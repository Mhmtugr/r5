import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiService } from '@/services/ai-service';
import { cacheService } from '@/services/cache-service';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('AI Service', () => {
  beforeEach(() => {
    // Her test öncesinde önbelleği temizle
    cacheService.clear('ai');
    cacheService.clear('ai_offline');
    
    // Axios mock'unu sıfırla
    vi.resetAllMocks();
  });
  
  it('temel AI servisi durumunu alabilir', () => {
    const status = aiService.getServiceStatus();
    
    expect(status).toHaveProperty('activeService');
    expect(status).toHaveProperty('isOpenRouterConfigured');
  });
  
  it('çevrimdışıyken önbellekten yanıt alır', async () => {
    // Çevrimdışı durumu simule et
    const originalNavigatorOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    
    // Test prompta yanıt vermesi için önceden cache'e ekle
    const testPrompt = 'Test offline prompt';
    const fakeCachedResponse = {
      text: 'This is a cached response for offline mode',
      success: true,
      source: 'cache-test',
      model: 'test-model',
    };
    
    // Cache'e ekle
    await cacheService.set(
      `offline_ask_${testPrompt.slice(0, 50).replace(/\s+/g, '_')}`, 
      fakeCachedResponse,
      { namespace: 'ai_offline', params: { promptLength: testPrompt.length } }
    );
    
    // Servis fonksiyonunu çağır
    const response = await aiService.ask(testPrompt);
    
    // Cache yanıtını aldığını doğrula
    expect(response).toHaveProperty('fromCache', true);
    expect(response).toHaveProperty('offline', true);
    expect(response.text).toBe(fakeCachedResponse.text);
    expect(axios).not.toHaveBeenCalled(); // API çağrısı yapılmadığını doğrula
    
    // Navigator.onLine'ı geri al
    Object.defineProperty(navigator, 'onLine', { value: originalNavigatorOnLine, configurable: true });
  });
  
  it('çevrimdışıyken ve cache yoksa demo yanıtı üretir', async () => {
    // Çevrimdışı durumu simule et
    const originalNavigatorOnLine = navigator.onLine;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    
    // Mevcut olmayan bir prompt ile sorgula
    const nonCachedPrompt = 'This prompt has no cache entry ' + Date.now();
    
    // Servis fonksiyonunu çağır
    const response = await aiService.ask(nonCachedPrompt);
    
    // Demo yanıtı aldığını doğrula
    expect(response).toBeTruthy();
    expect(response).toHaveProperty('isDemo', true);
    expect(axios).not.toHaveBeenCalled(); // API çağrısı yapılmadığını doğrula
    
    // Navigator.onLine'ı geri al
    Object.defineProperty(navigator, 'onLine', { value: originalNavigatorOnLine, configurable: true });
  });
  
  it('çevrimiçiyken API yanıtını önbelleğe alır', async () => {
    // API'nin döneceği yanıtı ayarla
    const mockApiResponse = {
      data: {
        choices: [
          {
            message: {
              content: 'This is a mock API response'
            }
          }
        ],
        model: 'mock-model'
      }
    };
    
    // Axios mock ayarları
    axios.mockResolvedValue(mockApiResponse);
    
    // Test prompt
    const testPrompt = 'Cache this response ' + Date.now();
    
    // Servis fonksiyonunu çağır
    await aiService.ask(testPrompt);
    
    // Cache anahtarını oluştur
    const cacheKey = `offline_ask_${testPrompt.slice(0, 50).replace(/\s+/g, '_')}`;
    
    // Cache'de depolandığını doğrula
    const cachedResponse = await cacheService.get(cacheKey, { 
      namespace: 'ai_offline',
      params: { promptLength: testPrompt.length } 
    });
    
    // Cache girişini doğrula
    expect(cachedResponse).toBeTruthy();
    expect(cachedResponse.text).toBe('This is a mock API response');
  });
  
  it('API hatası durumunda demo yanıt döner', async () => {
    // API'nin hata fırlatmasını sağla
    axios.mockRejectedValue(new Error('API Error'));
    
    // Test prompt
    const testPrompt = 'This should trigger an error';
    
    // Servis fonksiyonunu çağır
    const response = await aiService.ask(testPrompt);
    
    // Demo yanıtı aldığını doğrula
    expect(response).toBeTruthy();
    expect(response.isDemo).toBe(true);
  });
});
