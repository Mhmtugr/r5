<!-- filepath: c:\Users\MEHMET\Desktop\METS\r5\src\components\docs\TechnicalDocs.vue -->
<template>
  <div class="technical-docs">
    <h1>METS AI ve Cache Teknoloji Dokümantasyonu</h1>
    
    <section class="doc-section">
      <h2>1. AI Servisi Kullanımı</h2>
      <div class="subsection">
        <h3>1.1 Temel AI Fonksiyonları</h3>
        <pre><code>import { aiService, useAiService } from '@/services/ai-service';

// Vue component içinde kullanım
const { sendMessage, ask, isOffline } = useAiService();

// Tekil mesaj gönderme
const response = await ask('Aktif siparişlerin durumu nedir?');
console.log(response.text); // AI yanıtı

// Sohbet mesajı gönderme (geçmiş ile)
const chatResponse = await sendMessage('Geciken siparişleri listele');
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>1.2 Model Seçimi ve Özelleştirme</h3>
        <pre><code>// Vue component içinde
const { 
  supportedModels, 
  switchModel, 
  getCurrentModel 
} = useAiService();

// Modelleri listeleme
console.log(supportedModels);

// Model değiştirme
switchModel('technical'); // Teknik sorular için optimize edilmiş model

// Mevcut model bilgisini alma 
const currentModel = getCurrentModel();
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>1.3 Çevrimdışı Mod Desteği</h3>
        <pre><code>// Çevrimdışı durumu izleme
const { isOffline, clearOfflineCache } = useAiService();

// Çevrimdışı durum kontrolü (template içinde)
&lt;div v-if="isOffline" class="offline-notice"&gt;
  Çevrimdışı moddasınız. AI yanıtları sınırlı olabilir.
&lt;/div&gt;

// Çevrimdışı önbelleği temizleme
await clearOfflineCache();
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>1.4 AI İstatistikleri</h3>
        <pre><code>// AI önbellek istatistiklerini alma
const { getAICacheStats } = useAiService();
const stats = getAICacheStats();

console.log(`Toplam AI önbellek girdisi: ${stats.total.entries}`);
console.log(`Çevrimdışı önbellek boyutu: ${stats.offline.size} byte`);
console.log(`Önbellek isabet oranı: %${stats.total.hitRate * 100}`);
</code></pre>
      </div>
    </section>
    
    <section class="doc-section">
      <h2>2. Cache Servisi Kullanımı</h2>
      <div class="subsection">
        <h3>2.1 Temel Cache İşlemleri</h3>
        <pre><code>import { cacheService, useCacheService } from '@/services/cache-service';

// Vue component içinde kullanım 
const { get, set, remove, clear } = useCacheService();

// Veri önbelleğe alma
await set('products', productList, { 
  namespace: 'inventory',  // Önbellek ad alanı
  ttl: 3600000            // 1 saat geçerlilik süresi
});

// Önbellekten veri alma
const products = await get('products', { namespace: 'inventory' });

// Parametreli önbellekleme (aynı anahtar, farklı parametre değerleri)
await set('orders', activeOrders, { 
  namespace: 'orders',
  params: { status: 'active', page: 1 } 
});

await set('orders', completedOrders, { 
  namespace: 'orders',
  params: { status: 'completed', page: 1 } 
});

// Parametreli önbellek alma
const activeOrdersPage1 = await get('orders', { 
  namespace: 'orders',
  params: { status: 'active', page: 1 } 
});

// Önbellek verisi silme
await remove('products', { namespace: 'inventory' });

// Tüm önbelleği temizleme
await clear(); // Tüm namespaces
await clear('inventory'); // Sadece 'inventory' namespace
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>2.2 Çevrimdışı İşlem Desteği</h3>
        <pre><code>const { queueOperation, isOnline, pendingOperations } = useCacheService();

// Çevrimdışı işlem kuyruğa ekleme
const saveOrder = async () => {
  const operation = {
    execute: async () => {
      // API çağrısı tanımı
      return axios.post('/api/orders', orderData);
    },
    critical: true, // Kritik işlem - bağlantı geldiğinde mutlaka çalıştır
    forceQueue: false // false = çevrimiçiyse hemen çalıştır, true = her zaman kuyruğa ekle
  };
  
  try {
    // İşlemi kuyruğa ekle
    const result = await queueOperation(operation);
    return result;
  } catch (error) {
    console.error('İşlem kuyruğa eklenemedi:', error);
    throw error;
  }
};

// Template içinde çevrimdışı işlem sayısını gösterme
&lt;span v-if="pendingOperations > 0" class="badge bg-warning"&gt;
  {{ pendingOperations }} bekleyen işlem
&lt;/span&gt;
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>2.3 Hassas Verileri Önbelleğe Alma</h3>
        <pre><code>// Hassas verileri şifreleyerek önbelleğe alma
await set('user-preferences', userPrefs, { 
  namespace: 'user',
  sensitive: true  // Veriyi şifrele
});

// Özel şifreleme anahtarı ile kullanım
await set('payment-info', paymentData, { 
  namespace: 'payments',
  sensitive: true,
  encryptionKey: 'custom-encryption-key'  // Özel şifreleme anahtarı
});
</code></pre>
      </div>
      
      <div class="subsection">
        <h3>2.4 Önbellek İstatistikleri</h3>
        <pre><code>// Önbellek istatistiklerini alma
const { getStats } = useCacheService();
const cacheStats = getStats();

console.log(`Toplam önbellek boyutu: ${cacheStats.total.size} byte`);
console.log(`Önbellek isabet oranı: %${cacheStats.total.hitRate * 100}`);
console.log(`Önbellek isabetleri: ${cacheStats.total.hits}`);
console.log(`Önbellek kaçırmaları: ${cacheStats.total.misses}`);
</code></pre>
      </div>
    </section>
    
    <section class="doc-section">
      <h2>3. Mimari Genel Bakış</h2>
      <div class="architecture-diagram">
        <img src="/assets/images/docs/mets-architecture.png" alt="METS Mimari Diyagramı">
      </div>
      
      <div class="subsection">
        <h3>3.1 AI Servis Mimarisi</h3>
        <ul>
          <li><strong>Soyutlama Katmanı:</strong> Farklı AI servisleri (OpenRouter, Gemini, vb.) arasında geçiş yapabilme.</li>
          <li><strong>Önbellekleme:</strong> API yanıtlarını önbellekleme ile tekrarlanan sorguları optimize etme.</li>
          <li><strong>Çevrimdışı Mod:</strong> Bağlantı olmadığında önbelleğe alınmış yanıtları kullanma.</li>
          <li><strong>Yeniden Deneme Mantığı:</strong> API hatalarında otomatik yeniden deneme ile güvenilirlik.</li>
          <li><strong>Format Uyumluluğu:</strong> Farklı AI servisleri için yanıt formatı standardizasyonu.</li>
        </ul>
      </div>
      
      <div class="subsection">
        <h3>3.2 Cache Servis Mimarisi</h3>
        <ul>
          <li><strong>Namespace Yapısı:</strong> Farklı veri türleri için izole ad alanları.</li>
          <li><strong>Parametre Tabanlı Önbellekleme:</strong> Aynı sorgu, farklı parametreler için etkin önbellekleme.</li>
          <li><strong>Boyut Yönetimi:</strong> Otomatik temizleme ve boyut sınırlama ile bellek optimizasyonu.</li>
          <li><strong>Veri Güvenliği:</strong> Hassas veriler için şifreleme desteği.</li>
          <li><strong>Çevrimdışı İşlem Kuyruğu:</strong> Bağlantı olmadığında işlemleri saklama ve sonra çalıştırma.</li>
          <li><strong>İstatistik Toplama:</strong> Önbellek performansını ölçme ve optimize etme.</li>
        </ul>
      </div>
    </section>
    
    <section class="doc-section">
      <h2>4. En İyi Pratikler</h2>
      <div class="best-practices">
        <ol>
          <li>
            <strong>İstek Optimizasyonu:</strong> Aynı AI isteklerinin tekrarlanmasını önlemek için önbellek anahtarlarını dikkatli tasarlayın.
          </li>
          <li>
            <strong>Vade Süresi (TTL):</strong> Verilerinizin ne kadar süre geçerli olduğunu düşünerek uygun TTL değerlerini belirleyin.
          </li>
          <li>
            <strong>Namespace Stratejisi:</strong> İlgili verileri aynı ad alanında gruplandırın, böylece hepsini bir seferde temizleyebilirsiniz.
          </li>
          <li>
            <strong>Önbellek Boyutu:</strong> Büyük nesneleri önbelleğe almadan önce gerçekten gerekli olup olmadığını değerlendirin.
          </li>
          <li>
            <strong>Kritik İşlemler:</strong> Ödeme veya sipariş gibi kritik işlemleri çevrimdışı kuyrukta `critical: true` olarak işaretleyin.
          </li>
          <li>
            <strong>Önbellek İzleme:</strong> Periyodik olarak önbellek istatistiklerini izleyerek sisteminizi optimize edin.
          </li>
          <li>
            <strong>AI Prompt Optimizasyonu:</strong> Daha iyi cache hit oranı için benzer sorguları standart hale getirin.
          </li>
        </ol>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'TechnicalDocs'
}
</script>

<style scoped>
.technical-docs {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  color: #333;
}

h1 {
  font-size: 28px;
  margin-bottom: 30px;
  border-bottom: 2px solid #3e7ee6;
  padding-bottom: 10px;
  color: #3e7ee6;
}

.doc-section {
  margin-bottom: 40px;
}

h2 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #2c5282;
}

h3 {
  font-size: 18px;
  margin: 15px 0;
  color: #3e7ee6;
}

pre {
  background-color: #f6f8fa;
  border-radius: 5px;
  padding: 15px;
  border: 1px solid #e1e4e8;
  overflow: auto;
}

code {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.subsection {
  margin-bottom: 25px;
}

.architecture-diagram {
  text-align: center;
  margin: 20px 0;
}

.architecture-diagram img {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 5px;
}

ul, ol {
  padding-left: 25px;
  line-height: 1.7;
}

li {
  margin-bottom: 10px;
}

.best-practices ol {
  counter-reset: best-practices;
}

.best-practices li {
  counter-increment: best-practices;
}

.best-practices li::before {
  content: counter(best-practices);
  background: #3e7ee6;
  color: white;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 50%;
  margin-right: 8px;
  font-size: 14px;
}

strong {
  color: #2c5282;
}

@media (max-width: 768px) {
  .technical-docs {
    padding: 15px;
  }
  
  pre {
    padding: 10px;
    font-size: 13px;
  }
  
  h1 {
    font-size: 24px;
  }
  
  h2 {
    font-size: 20px;
  }
  
  h3 {
    font-size: 16px;
  }
}
</style>
