import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cacheService } from '@/services/cache-service';

describe('Cache Service', () => {
  beforeEach(() => {
    // Her test öncesinde önbelleği temizle
    cacheService.clear();
  });

  it('basit bir değeri önbelleğe alabilir ve alabilir', async () => {
    const testKey = 'test-key';
    const testValue = { data: 'test-value' };
    
    await cacheService.set(testKey, testValue);
    const retrievedValue = await cacheService.get(testKey);
    
    expect(retrievedValue).toEqual(testValue);
  });
  
  it('parametrelerle anahtar oluşturabilir', async () => {
    const testKey = 'test-params';
    const params1 = { id: 123, filter: 'active' };
    const params2 = { id: 123, filter: 'archived' };
    const value1 = { data: 'value1' };
    const value2 = { data: 'value2' };
    
    await cacheService.set(testKey, value1, { params: params1 });
    await cacheService.set(testKey, value2, { params: params2 });
    
    const retrieved1 = await cacheService.get(testKey, { params: params1 });
    const retrieved2 = await cacheService.get(testKey, { params: params2 });
    
    expect(retrieved1).toEqual(value1);
    expect(retrieved2).toEqual(value2);
    expect(retrieved1).not.toEqual(retrieved2);
  });
  
  it('süresi dolmuş değerleri döndürmez', async () => {
    vi.useFakeTimers();
    
    const testKey = 'expire-test';
    const testValue = { data: 'will-expire' };
    
    await cacheService.set(testKey, testValue, { ttl: 1000 }); // 1 saniye sonra dolacak
    
    const immediateValue = await cacheService.get(testKey);
    expect(immediateValue).toEqual(testValue);
    
    // 2 saniye ilerlet
    vi.advanceTimersByTime(2000);
    
    const expiredValue = await cacheService.get(testKey);
    expect(expiredValue).toBeNull();
    
    vi.useRealTimers();
  });
  
  it('istatistikleri doğru hesaplar', async () => {
    // Önce birkaç değer oluştur
    await cacheService.set('stats-test-1', { data: 'stats1' });
    await cacheService.set('stats-test-2', { data: 'stats2' });
    
    // Bir değeri birkaç kez al
    await cacheService.get('stats-test-1');
    await cacheService.get('stats-test-1');
    await cacheService.get('stats-test-2');
    
    // Olmayan bir değeri al
    await cacheService.get('non-existent-key');
    
    // İstatistikleri al
    const stats = cacheService.getStats();
    
    // Temel istatistikleri kontrol et
    expect(stats.total.hits).toBe(3); // 3 başarılı istek
    expect(stats.total.misses).toBe(1); // 1 başarısız istek
    expect(stats.byNamespace.default.entries).toBe(2); // 2 giriş
  });
  
  it('farklı ad alanları (namespace) kullanabilir', async () => {
    const testKey = 'shared-key';
    const value1 = { ns1: 'value1' };
    const value2 = { ns2: 'value2' };
    
    // Farklı ad alanlarında aynı anahtarla değerler kaydet
    await cacheService.set(testKey, value1, { namespace: 'namespace1' });
    await cacheService.set(testKey, value2, { namespace: 'namespace2' });
    
    // Değerleri al ve karşılaştır
    const retrieved1 = await cacheService.get(testKey, { namespace: 'namespace1' });
    const retrieved2 = await cacheService.get(testKey, { namespace: 'namespace2' });
    
    expect(retrieved1).toEqual(value1);
    expect(retrieved2).toEqual(value2);
    expect(retrieved1).not.toEqual(retrieved2);
  });
  
  it('çevrimdışı operasyon kuyruğunu yönetebilir', async () => {
    // Mock bir operasyon oluştur
    const mockOperation = {
      execute: vi.fn().mockResolvedValue({ success: true }),
      critical: true
    };
    
    // Navigator.onLine'ı geçici olarak false yap
    const originalNavigatorOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    
    // İşlemi kuyruğa ekle
    const operationPromise = cacheService.queueOperation(mockOperation);
    
    // Navigator.onLine'ı geri al
    Object.defineProperty(navigator, 'onLine', { value: originalNavigatorOnLine, configurable: true });
    
    // İşlemin kuyrukta olduğunu doğrula
    const stats = cacheService.getStats();
    expect(stats.pendingOperations).toBeGreaterThan(0);
    
    // Senkronizasyon işlemini simüle et
    mockOperation.onSuccess(); // Promise'ı çöz
    
    // Promise'ın çözüldüğünü bekle
    await operationPromise;
    
    // Çalıştırma fonksiyonunun çağrılmadığını doğrula (çevrimdışı durumda)
    expect(mockOperation.execute).not.toHaveBeenCalled();
  });
});
