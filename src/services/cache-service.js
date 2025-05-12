import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import CryptoJS from 'crypto-js';
import appConfig from '@/config';

/**
 * Cache Service
 * 
 * Bu servis, METS uygulamasında:
 * 1. API yanıtlarının önbelleğe alınması
 * 2. AI yanıtlarının yerel depolanması
 * 3. Çevrimdışı çalışma modu desteği
 * 4. Performans optimizasyonu
 * için kullanılır.
 */

// Konfigürasyon değerlerini daha kısa referans için alalım
const config = appConfig.cache || {
  enabled: true,                // Önbelleğe alma açık mı?
  defaultTTL: 3600000,          // Varsayılan cache süresi: 1 saat
  maxSize: 50 * 1024 * 1024,    // Maksimum cache boyutu: 50MB
  encryptionEnabled: true,      // Hassas verileri şifrele
  persistenceLevel: 'session',  // 'session', 'local', 'none'
  aiResponseTTL: 86400000,      // AI yanıtları cache süresi: 24 saat
  autoCleanInterval: 600000,    // Otomatik temizleme aralığı: 10 dakika
  compressLargeValues: true,    // 10KB'den büyük değerleri sıkıştır
  offline: {
    enabled: true,              // Çevrimdışı mod desteği
    syncOnReconnect: true,      // Bağlantı kurulduğunda senkronize et
    queueMaxSize: 100           // İşlem kuyruğu maksimum boyutu
  }
};

// Cache yönetimi için yardımcı fonksiyonlar
const generateCacheKey = (key, params = {}) => {
  // Anahtar ve parametrelerden tutarlı bir cache anahtarı oluştur
  const sortedParams = Object.entries(params || {})
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

  const stringifiedParams = Object.keys(sortedParams).length > 0 
    ? JSON.stringify(sortedParams) 
    : '';
  
  return `${key}${stringifiedParams ? `:${CryptoJS.MD5(stringifiedParams).toString()}` : ''}`;
};

// Değerleri şifreleme ve şifre çözme fonksiyonları
const encryptValue = (value, secretKey) => {
  if (!config.encryptionEnabled) return value;
  
  try {
    // Basit şifreleme için kullanabiliriz, üretimde daha güçlü bir yöntem kullanılabilir
    const key = secretKey || appConfig.encryptionKey || 'METS-SECURE-KEY';
    return CryptoJS.AES.encrypt(JSON.stringify(value), key).toString();
  } catch (error) {
    console.error('Cache şifreleme hatası:', error);
    return value;
  }
};

const decryptValue = (encryptedValue, secretKey) => {
  if (!config.encryptionEnabled || typeof encryptedValue !== 'string') return encryptedValue;
  
  try {
    // Şifresi çözülmüş değeri döndür
    const key = secretKey || appConfig.encryptionKey || 'METS-SECURE-KEY';
    const bytes = CryptoJS.AES.decrypt(encryptedValue, key);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Cache şifre çözme hatası:', error);
    return encryptedValue;
  }
};

// LZString gibi sıkıştırma yöntemleri eklenebilir.
// Bu örnekte, büyük nesnelerin sıkıştırılması için bir yer tutucu olarak bulunuyor.
const compressLargeValue = (value) => {
  // İhtiyaç durumunda, büyük değerleri sıkıştırmak için burada bir sıkıştırma algoritması kullanılabilir
  return value;
};

const decompressValue = (value) => {
  // İhtiyaç durumunda, burada sıkıştırma çözümü yapılabilir
  return value;
};

/**
 * Cache Servisi - Ana Sınıf
 */
class CacheService {
  constructor() {
    this.caches = {};
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    
    this.onlineStatus = navigator.onLine;
    this.pendingOperations = [];
    
    // Çevrimiçi/çevrimdışı durumu dinle
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Düzenli temizleme zamanlayıcısını başlat
    this.startCleanupInterval();
  }
  
  // Cache'i başlat veya mevcut cache'e eriş
  getCache(namespace = 'default') {
    if (!this.caches[namespace]) {
      // Kalıcılık seviyesine göre depolama belirle
      const storageType = config.persistenceLevel === 'local' ? 'localStorage' : 
                         config.persistenceLevel === 'session' ? 'sessionStorage' : null;
      
      this.caches[namespace] = {
        data: storageType ? useStorage(`mets-cache-${namespace}`, {}, storageType) : ref({}),
        metadata: storageType ? useStorage(`mets-cache-meta-${namespace}`, {}, storageType) : ref({}),
        stats: { hits: 0, misses: 0, size: 0 },
      };
    }
    
    return this.caches[namespace];
  }
  
  // Veri önbelleğe al
  async set(key, value, options = {}) {
    if (!config.enabled) return value;
    
    const namespace = options.namespace || 'default';
    const cache = this.getCache(namespace);
    const cacheKey = generateCacheKey(key, options.params);
    
    // TTL (Time-to-Live) hesapla
    const ttl = options.ttl !== undefined ? options.ttl : 
                (namespace === 'ai' ? config.aiResponseTTL : config.defaultTTL);
                
    // Değeri işle (şifreleme/sıkıştırma)
    let processedValue = value;
    
    if (options.sensitive || namespace === 'ai') {
      processedValue = encryptValue(processedValue, options.encryptionKey);
    }
    
    if (config.compressLargeValues && JSON.stringify(value).length > 10 * 1024) {
      processedValue = compressLargeValue(processedValue);
    }
    
    // Cache'e ekle
    cache.data.value[cacheKey] = processedValue;
    cache.metadata.value[cacheKey] = {
      timestamp: Date.now(),
      expires: ttl ? Date.now() + ttl : null,
      size: JSON.stringify(processedValue).length,
      source: options.source || 'manual',
      type: options.type || typeof value
    };
    
    // İstatistikleri güncelle
    cache.stats.size += cache.metadata.value[cacheKey].size;
    
    // Maksimum boyut kontrolü - gerekirse eski kayıtları temizle
    this.enforceMaxSize(namespace);
    
    return value;
  }
  
  // Önbellekten veri al
  async get(key, options = {}) {
    if (!config.enabled) return null;
    
    const namespace = options.namespace || 'default';
    const cache = this.getCache(namespace);
    const cacheKey = generateCacheKey(key, options.params);
    
    // Cache'de veri var mı kontrol et
    if (cache.data.value[cacheKey] !== undefined) {
      const metadata = cache.metadata.value[cacheKey];
      
      // Süre dolmuş mu kontrol et
      if (metadata.expires && metadata.expires < Date.now()) {
        // Süresi dolmuş veriyi temizle
        this.remove(key, { namespace, params: options.params });
        cache.stats.misses++;
        this.stats.misses++;
        return null;
      }
      
      // Başarılı cache hit
      cache.stats.hits++;
      this.stats.hits++;
      
      // Değeri işle (şifre çözme/sıkıştırma çözme)
      let value = cache.data.value[cacheKey];
      
      if (options.sensitive || namespace === 'ai') {
        value = decryptValue(value, options.encryptionKey);
      }
      
      // Sıkıştırılmış değerler için çözme
      if (metadata.compressed) {
        value = decompressValue(value);
      }
      
      return value;
    }
    
    // Cache miss
    cache.stats.misses++;
    this.stats.misses++;
    return null;
  }
  
  // Önbellekten veri sil
  remove(key, options = {}) {
    const namespace = options.namespace || 'default';
    const cache = this.getCache(namespace);
    const cacheKey = generateCacheKey(key, options.params);
    
    // Cache'den değeri kaldır
    if (cache.data.value[cacheKey] !== undefined) {
      const size = cache.metadata.value[cacheKey]?.size || 0;
      delete cache.data.value[cacheKey];
      delete cache.metadata.value[cacheKey];
      
      // İstatistikleri güncelle
      cache.stats.size -= size;
      return true;
    }
    
    return false;
  }
  
  // Tüm önbelleği temizle
  clear(namespace) {
    if (namespace) {
      // Belirli bir namespace'i temizle
      const cache = this.getCache(namespace);
      cache.data.value = {};
      cache.metadata.value = {};
      cache.stats = { hits: 0, misses: 0, size: 0 };
      return;
    }
    
    // Tüm cache'i temizle
    Object.keys(this.caches).forEach(ns => {
      this.clear(ns);
    });
  }
  
  // Maksimum önbellek boyutunu kontrol et ve gerekirse temizle
  enforceMaxSize(namespace) {
    const cache = this.getCache(namespace);
    
    // Maksimum boyut aşıldı mı kontrol et
    if (cache.stats.size > config.maxSize) {
      console.log(`Cache boyutu aşıldı (${namespace}): ${cache.stats.size} / ${config.maxSize} bayt. Temizleniyor...`);
      
      // En eski kayıtları bul ve sil
      const entries = Object.entries(cache.metadata.value)
        .map(([key, meta]) => ({ key, timestamp: meta.timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // Boyut sınırın altına düşene kadar eski kayıtları sil
      while (cache.stats.size > config.maxSize * 0.8 && entries.length > 0) {
        const { key } = entries.shift();
        const size = cache.metadata.value[key]?.size || 0;
        
        delete cache.data.value[key];
        delete cache.metadata.value[key];
        
        cache.stats.size -= size;
      }
    }
  }
  
  // Süresi dolmuş tüm kayıtları temizle
  cleanup() {
    const now = Date.now();
    
    Object.keys(this.caches).forEach(namespace => {
      const cache = this.getCache(namespace);
      
      Object.entries(cache.metadata.value).forEach(([key, meta]) => {
        if (meta.expires && meta.expires < now) {
          const size = meta.size || 0;
          
          delete cache.data.value[key];
          delete cache.metadata.value[key];
          
          cache.stats.size -= size;
        }
      });
    });
  }
  
  // Düzenli temizleme zamanlayıcısını başlat
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, config.autoCleanInterval);
  }
  
  // Zamanlayıcıyı durdur
  stopCleanupInterval() {
    clearInterval(this.cleanupInterval);
  }
  
  // Çevrimiçi olduğunda tetiklenen fonksiyon
  handleOnline() {
    this.onlineStatus = true;
    
    // Çevrimdışıyken bekleyen işlemleri senkronize et
    if (config.offline.syncOnReconnect && this.pendingOperations.length > 0) {
      this.syncPendingOperations();
    }
    
    // Çevrimiçi olay yayını
    const event = new CustomEvent('mets-cache-online');
    document.dispatchEvent(event);
  }
  
  // Çevrimdışı olduğunda tetiklenen fonksiyon
  handleOffline() {
    this.onlineStatus = false;
    
    // Çevrimdışı olay yayını
    const event = new CustomEvent('mets-cache-offline');
    document.dispatchEvent(event);
  }
  
  // Bekleyen işlemleri senkronize et
  async syncPendingOperations() {
    // Çevrimdışı kuyruk boşsa bir şey yapma
    if (this.pendingOperations.length === 0) return;
    
    console.log(`${this.pendingOperations.length} bekleyen işlem senkronize ediliyor...`);
    
    // İşlemleri FIFO (ilk giren ilk çıkar) sırasıyla işle
    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    
    try {
      // İşlemleri sırayla işle
      for (const op of operations) {
        try {
          // İşlemi uygula (API çağrısı, veri gönderme vb.)
          await op.execute();
          
          // Başarılı işlem için callback tetikle
          if (op.onSuccess && typeof op.onSuccess === 'function') {
            op.onSuccess();
          }
        } catch (error) {
          console.error('İşlem senkronizasyonu hatası:', error);
          
          // Hata callback'i tetikle
          if (op.onError && typeof op.onError === 'function') {
            op.onError(error);
          }
          
          // Kritik işlemleri yeniden kuyruğa ekle
          if (op.critical) {
            this.pendingOperations.push(op);
          }
        }
      }
    } catch (error) {
      console.error('Senkronizasyon işlemi sırasında hata:', error);
    }
  }
  
  // İşlemi kuyruğa ekle (çevrimdışı durumda)
  queueOperation(operation) {
    // Çevrimiçiyse hemen çalıştır
    if (this.onlineStatus && !operation.forceQueue) {
      return operation.execute();
    }
    
    // Maksimum kuyruk boyutu kontrolü
    if (this.pendingOperations.length >= config.offline.queueMaxSize) {
      // Kritik olmayan eski bir işlemi sil
      const nonCriticalIndex = this.pendingOperations.findIndex(op => !op.critical);
      if (nonCriticalIndex >= 0) {
        this.pendingOperations.splice(nonCriticalIndex, 1);
      } else if (!operation.critical) {
        // Yeni işlem kritik değilse ve tüm kuyruk kritik işlemlerden oluşuyorsa işlemi iptal et
        console.warn('İşlem kuyruğu dolu, kritik olmayan işlem iptal edildi.');
        return Promise.reject(new Error('Queue is full with critical operations'));
      }
    }
    
    // İşlemi kuyruğa ekle
    this.pendingOperations.push(operation);
    
    // İşlemi izlemek için bir promise döndür
    return new Promise((resolve, reject) => {
      operation.onSuccess = resolve;
      operation.onError = reject;
    });
  }
  
  // Cache istatistiklerini al
  getStats() {
    // Genel istatistikleri hesapla
    let totalSize = 0;
    let totalHits = 0;
    let totalMisses = 0;
    
    Object.values(this.caches).forEach(cache => {
      totalSize += cache.stats.size;
      totalHits += cache.stats.hits;
      totalMisses += cache.stats.misses;
    });
    
    return {
      total: {
        size: totalSize,
        hits: totalHits,
        misses: totalMisses,
        hitRate: totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0
      },
      byNamespace: Object.fromEntries(
        Object.entries(this.caches).map(([namespace, cache]) => [
          namespace,
          {
            size: cache.stats.size,
            hits: cache.stats.hits,
            misses: cache.stats.misses,
            hitRate: cache.stats.hits + cache.stats.misses > 0 ? 
                     cache.stats.hits / (cache.stats.hits + cache.stats.misses) : 0,
            entries: Object.keys(cache.data.value).length
          }
        ])
      ),
      config: { ...config },
      onlineStatus: this.onlineStatus,
      pendingOperations: this.pendingOperations.length
    };
  }
  
  // Nesne tamamen kaldırılırken temizleme yap
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.stopCleanupInterval();
    this.clear();
  }
}

// Singleton örneği oluştur
const cacheServiceInstance = new CacheService();

// Vue composable olarak kullanım
export function useCacheService() {
  // Online durumu izleyen computed değer
  const isOnline = computed(() => cacheServiceInstance.onlineStatus);
  
  // Bekleyen işlem sayısı
  const pendingOperations = computed(() => cacheServiceInstance.pendingOperations.length);
  
  return {
    // Temel cache işlemleri
    get: cacheServiceInstance.get.bind(cacheServiceInstance),
    set: cacheServiceInstance.set.bind(cacheServiceInstance),
    remove: cacheServiceInstance.remove.bind(cacheServiceInstance),
    clear: cacheServiceInstance.clear.bind(cacheServiceInstance),
    
    // Çevrimdışı destek
    isOnline,
    pendingOperations,
    queueOperation: cacheServiceInstance.queueOperation.bind(cacheServiceInstance),
    syncPendingOperations: cacheServiceInstance.syncPendingOperations.bind(cacheServiceInstance),
    
    // İstatistikler
    getStats: cacheServiceInstance.getStats.bind(cacheServiceInstance)
  };
}

// Doğrudan kullanım için cache servisini dışa aktar
export const cacheService = {
  get: cacheServiceInstance.get.bind(cacheServiceInstance),
  set: cacheServiceInstance.set.bind(cacheServiceInstance),
  remove: cacheServiceInstance.remove.bind(cacheServiceInstance),
  clear: cacheServiceInstance.clear.bind(cacheServiceInstance),
  getStats: cacheServiceInstance.getStats.bind(cacheServiceInstance),
  queueOperation: cacheServiceInstance.queueOperation.bind(cacheServiceInstance)
};