import { ref, reactive, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import axios from 'axios';
import appConfig from '@/config';

// Daha kısa bir isim için referans
const config = appConfig;

// API Anahtarı ve URL Yapılandırması
const API_SERVICE_CONFIG = {
  gemini: {
    apiKey: appConfig.ai?.gemini?.apiKey || import.meta.env.VITE_GEMINI_API_KEY,
    apiUrl: appConfig.ai?.gemini?.apiUrl || 'https://generativelanguage.googleapis.com/v1beta/models',
    modelName: appConfig.ai?.gemini?.modelName || 'gemini-1.5-pro', // Varsayılan model
  },
  openRouter: {
    apiKey: appConfig.ai?.openRouter?.apiKey || import.meta.env.VITE_OPENROUTER_API_KEY,
    apiUrl: appConfig.ai?.openRouter?.apiUrl || 'https://openrouter.ai/api/v1',
    defaultModels: appConfig.ai?.openRouter?.defaultModels || {
      chat: 'openai/gpt-3.5-turbo',
      instruct: 'google/gemini-flash-1.5', // Örnek bir instruct model
    },
    siteUrl: appConfig.ai?.openRouter?.siteUrl, // siteUrl ve appName referans için eklendi
    appName: appConfig.ai?.openRouter?.appName,
  },
  // Diğer AI servisleri buraya eklenebilir (örn: local LLM)
};

// Aktif AI Servisini Seçme (örn: config dosyasından veya store üzerinden)
const ACTIVE_AI_SERVICE = config.ai?.activeService || 'gemini'; // Varsayılan olarak gemini

// --- GENEL API İSTEK FONKSİYONU ---
const makeApiRequest = async (serviceName, endpoint, payload, method = 'POST') => {
  const serviceConfig = API_SERVICE_CONFIG[serviceName];
  if (!serviceConfig || !serviceConfig.apiKey || !serviceConfig.apiUrl) {
    console.warn(`${serviceName} API anahtarı veya URL bulunamadı. Demo mod kullanılıyor.`);
    return simulateAIResponse(payload.contents ? payload.contents[0]?.parts[0]?.text : payload.messages?.[payload.messages.length - 1]?.content);
  }

  const headers = {
    'Authorization': `Bearer ${serviceConfig.apiKey}`,
    'Content-Type': 'application/json',
  };
  
  // OpenRouter için ek başlıklar
  if (serviceName === 'openRouter') {
    if (serviceConfig.siteUrl) headers['HTTP-Referer'] = serviceConfig.siteUrl;
    if (serviceConfig.appName) headers['X-Title'] = serviceConfig.appName;
  }

  try {
    const response = await axios({
      method,
      url: `${serviceConfig.apiUrl}/${endpoint}`,
      data: payload,
      headers,
    });

    // Yanıt formatları servise göre değişebilir, burada genel bir yapı varsayılıyor
    // Gemini-benzeri yanıt
    if (response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return {
        text: response.data.candidates[0].content.parts[0].text,
        success: true,
        raw: response.data,
        source: serviceName,
      };
    }
    // OpenAI/OpenRouter-benzeri yanıt (chat completions)
    if (response.data.choices?.[0]?.message?.content) {
      return {
        text: response.data.choices[0].message.content,
        success: true,
        raw: response.data,
        source: serviceName,
      };
    }
    throw new Error('API yanıtından metin alınamadı veya format tanınmıyor');
  } catch (error) {
    console.error(`${serviceName} API hatası:`, error.response?.data || error.message);
    return simulateAIResponse(payload.contents ? payload.contents[0]?.parts[0]?.text : payload.messages?.[payload.messages.length - 1]?.content, serviceName, error.response?.data || error.message);
  }
};

// --- GEMINI ÖZEL FONKSİYONLARI ---
const geminiGenerateContent = async (prompt, options = {}) => {
  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options.temperature ?? config.ai?.geminiGenerationConfig?.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? config.ai?.geminiGenerationConfig?.maxOutputTokens ?? 2048,
      topP: options.topP ?? config.ai?.geminiGenerationConfig?.topP ?? 0.8,
      topK: options.topK ?? config.ai?.geminiGenerationConfig?.topK ?? 40,
    },
    safetySettings: config.ai?.geminiSafetySettings || [
      // Varsayılan güvenlik ayarları
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };
  return makeApiRequest('gemini', `${API_SERVICE_CONFIG.gemini.modelName}:generateContent`, payload);
};

const geminiChat = async (messages, options = {}) => {
  const formattedMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user', // system rolü Gemini için user olarak maplenir
    parts: [{ text: msg.content }],
  }));

  const payload = {
    contents: formattedMessages,
    generationConfig: {
      temperature: options.temperature ?? config.ai?.geminiGenerationConfig?.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? config.ai?.geminiGenerationConfig?.maxOutputTokens ?? 2048,
      topP: options.topP ?? config.ai?.geminiGenerationConfig?.topP ?? 0.8,
      topK: options.topK ?? config.ai?.geminiGenerationConfig?.topK ?? 40,
    },
    safetySettings: config.ai?.geminiSafetySettings, // Yukarıdakiyle aynı
  };
  return makeApiRequest('gemini', `${API_SERVICE_CONFIG.gemini.modelName}:generateContent`, payload);
};

// --- OPENROUTER ÖZEL FONKSİYONLARI ---
const openRouterChatCompletion = async (messages, options = {}) => {
  const model = options.model || API_SERVICE_CONFIG.openRouter.defaultModels.chat;
  const payload = {
    model: model,
    messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
    temperature: options.temperature ?? config.ai?.openRouterGenerationConfig?.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? config.ai?.openRouterGenerationConfig?.maxTokens ?? 2048,
    top_p: options.topP ?? config.ai?.openRouterGenerationConfig?.topP ?? 0.8,
    // OpenRouter'a özel diğer parametreler eklenebilir (örn: stream, top_k vb.)
  };
  return makeApiRequest('openRouter', 'chat/completions', payload);
};

// --- DEMO MODU İÇİN YANIT SİMÜLASYONU ---
const simulateAIResponse = async (prompt, service = 'METS AI Asistan', errorInfo = null) => {
  console.log(`Demo mod (${service}): AI yanıtı simüle ediliyor. Hata: ${errorInfo ? JSON.stringify(errorInfo) : 'Yok'}`);
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
  
  let responseText = `Üzgünüm, \"${prompt?.substring(0, 50)}...\" ile ilgili isteğinizi işlerken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.`;
  let additionalData = null;
  
  if (errorInfo) {
    responseText = `API bağlantı sorunu (${service}): ${JSON.stringify(errorInfo)}. Geliştirici konsolunu kontrol edin. Demo yanıt üretiliyor.`;
  }

  if (prompt) {
    const p = prompt.toLowerCase();
    
    // Sipariş sorguları
    if (p.includes('sipariş') || p.includes('order')) {
      if (p.includes('x123') || p.includes('x-123')) {
        responseText = 'Sipariş X-123 için durum: Malzeme tedariği tamamlandı. Üretim aşamasında: Hücre montajı %75 tamamlandı. Testler için planlanan tarih: 14.05.2025. Şu ana kadar herhangi bir gecikme yaşanmamış ve süreç planlandığı gibi ilerliyor.';
      } else if (p.includes('gecik') || p.includes('delay')) {
        responseText = 'Şu anda 3 siparişte gecikme mevcut: Y-456 (3 gün gecikme - kontrol rölesi tedarik sorunu), Z-789 (1 hafta gecikme - müşteri tasarım değişikliği talebi) ve B-321 (2 gün gecikme - montaj personeli hastalık izni). Bu siparişlerin çözümü için Satın Alma ve Üretim departmanları koordineli çalışıyor.';
      } else {
        responseText = 'Aktif siparişlerimiz toplam 27 adet. Bu ay içinde 12 adet teslimat planlanıyor, önümüzdeki 30 gün içinde 15 yeni hücre üretimi tamamlanacak. Son 24 saatte 2 yeni sipariş alındı, toplam değeri 345.000€.';
      }
    }
    
    // Stok sorguları
    else if (p.includes('stok') || p.includes('malzeme') || p.includes('materyal') || p.includes('inventory')) {
      if (p.includes('krit') || p.includes('düşük') || p.includes('az')) {
        responseText = 'Kritik stok seviyesindeki malzemeler: ABB VD4 Kesici (2 adet kaldı - 5 adet sipariş verildi, beklenen tarih: 18.05.2025), Siemens 7SR11 Röle (5 adet kaldı - stok yetersiz, 10 adet sipariş gerekli), 120mm² Kablo (50m kaldı - minimum stok seviyesinin altında).';
      } else if (p.includes('durum') || p.includes('genel') || p.includes('rapor')) {
        responseText = 'Stok durumu: Toplam 1250 farklı malzeme kaydı mevcut. Son 30 günde 182 malzeme hareketi gerçekleşti. 15 malzeme kritik stok seviyesinin altında, 23 malzeme ise uyarı seviyesinde. B01 deposunda 875, B02 deposunda 375 kalem malzeme bulunuyor. Son ERP senkronizasyonu bugün saat 08:15\'te gerçekleştirildi.';
      } else {
        responseText = 'Stoktaki malzeme durumu genel olarak iyi. Kritik durumda 15 malzeme mevcut. Geçmiş 3 aylık veriler incelendiğinde, Schneider kesicilerde tedarik süresi uzamış durumda, alternatiflerin değerlendirilmesi önerilir. Siemens rölelerinde ise stok optimizasyonu yapılabilir, şu an fazla stok mevcut.';
      }
    }
    
    // Planlama sorguları
    else if (p.includes('plan') || p.includes('üretim') || p.includes('imalat') || p.includes('production')) {
      if (p.includes('bugün') || p.includes('günlük')) {
        responseText = 'Bugünkü üretim planı: 4 adet RM36-CB hücre montajı, 2 adet RM36-LB hücre testleri, 6 adet hücre için kablaj işlemi. Personel durumu: İmal/Eşit vardiyada 12 personel aktif. Planlanan vardiya bitiş saati: 17:30. Şu ana kadar herhangi bir aksama bildirilmedi.';
      } else if (p.includes('haftal') || p.includes('gelecek')) {
        responseText = 'Gelecek hafta üretim planı: 12 adet RM36 serisi hücre üretimi planlandı. Pazartesi-Salı: Montaj işlemleri, Çarşamba-Perşembe: Kablaj ve kontrol sistemleri, Cuma: Test ve kalite kontrol. Gerekli tüm malzemeler stokta mevcut, üretimde gecikme beklenmemektedir.';
        
        // Tahmin verisi ekle
        additionalData = {
          prediction: {
            modelType: 'Üretim Tahmin Modeli',
            confidence: 0.87,
            predictions: [
              { label: 'Beklenen Tamamlanma', value: '18 Mayıs 2025', trend: 0 },
              { label: 'Olası Gecikme Riski', value: '%8', trend: -1 },
              { label: 'Malzeme Yeterliliği', value: '%96', trend: 1 }
            ],
            explanation: 'Üretim süresi tahminleri geçmiş 24 haftalık veri analizi üzerinden yapılmıştır.'
          }
        };
      } else if (p.includes('aylık') || p.includes('uzun')) {
        responseText = 'Aylık üretim kapasite değerlendirmesi: Mevcut personel ve ekipmanla ayda ortalama 65 adet hücre üretilebiliyor. Kapasite kullanım oranımız %82. Gelecek 3 ay için üretim planımız şöyle: Mayıs: 58 hücre, Haziran: 62 hücre, Temmuz: 54 hücre. Temmuz ayında yıllık bakım nedeniyle 1 haftalık üretim duruşu planlandı.';
      } else {
        responseText = 'Genel üretim durumu: 27 aktif sipariş üretimde. 18 adeti planlandığı gibi ilerliyor, 6 adedi 1-3 gün arası gecikme riski taşıyor, 3 adedi ise kesin gecikme bildirimi yapıldı. Kapasite kullanımı normal seviyelerde, ek vardiya ihtiyacı görünmüyor. İş güvenliği açısından son 45 gündür sıfır kaza ile çalışılıyor.';
      }
    }
    
    // Teknik sorgular
    else if (p.includes('teknik') || p.includes('technical') || p.includes('doküman') || p.includes('çizim') || p.includes('döküman')) {
      if (p.includes('rm36') || p.includes('hücre') || p.includes('cell')) {
        responseText = 'RM36 serisi hücreler hakkında teknik bilgiler: Nominal gerilim 36kV, nominal akım 630A-2500A arası, kesme kapasitesi 25kA. Standart boyutlar: 800mm genişlik, 1500mm derinlik, 2200mm yükseklik. Koruma sınıfı IP3X, opsiyonel olarak IP41 sunulabilir. Kesici tipi olarak SF6 veya vakum kesici kullanılabilir.';
        
        // Teknik doküman ilişkilendirme
        additionalData = {
          relatedDocs: [
            { id: 123, name: 'RM36 Serisi - Teknik Katalog', category: 'Katalog', version: '2.3' },
            { id: 456, name: 'RM36-CB Montaj Talimatı', category: 'Talimat', version: '1.5' },
            { id: 789, name: 'RM36 Serisi - 3D Modeller', category: '3D Model', version: '2023' }
          ]
        };
      } else if (p.includes('test') || p.includes('kalite')) {
        responseText = 'Test prosedürlerimiz IEC 62271-200 standardına uygun şekilde yapılmaktadır. Her hücre için uygulanan testler: 1) Yüksek gerilim dayanım testi (70kV-1dk), 2) Ana devre direnci ölçümü, 3) Anahtarlama cihazları fonksiyon testi, 4) Kontrol devresi fonksiyon testi, 5) Mekanik çalışma testi (min. 100 açma-kapama). Tüm test sonuçları ürünle beraber raporlanır.';
      } else {
        responseText = 'Teknik dokümantasyon sistemi içinde toplam 1240 doküman mevcut. Bunlar: 320 montaj talimatı, 154 test prosedürü, 425 teknik çizim, 112 kullanım kılavuzu ve 229 diğer teknik döküman. En son güncellenen doküman: "RM36-BC Topraklama Prosedürü", 08.05.2025 tarihinde güncellenmiştir.';
      }
    }
    
    // 3D model ve CAD sorguları
    else if (p.includes('3d') || p.includes('model') || p.includes('cad') || p.includes('tasarım')) {
      responseText = 'CAD modellerimiz SolidWorks 2023 formatında hazırlanmaktadır. RM36 serisi için detaylı 3D modeller mevcuttur. Mevcut modeller: RM36-CB (Kesicili Hücre), RM36-LB (Yük Ayırıcılı Hücre), RM36-BC (Bara Bağlantı Hücresi), TR36-AI (Akım Trafosu). Bu modeller müşterilere STEP veya IGES formatında sağlanabilir.';
      
      // 3D model önizleme ekle
      additionalData = {
        modelPreview: {
          id: 'rm36cb',
          name: 'RM 36 CB Hücresi',
          image: '/assets/images/models/rm-36-cb.png'
        }
      };
    }
    
    // Genel selamlama
    else if (p.includes('merhaba') || p.includes('selam') || p.includes('hi') || p.includes('hello')) {
      responseText = 'Merhaba! Ben METS yapay zeka asistanınızım. Size üretim durumu, stok bilgileri, siparişler, teknik bilgiler veya planlama konularında yardımcı olabilirim. Nasıl yardımcı olabilirim?';
    }
    
    // Diğer sorgulamalar
    else {
      responseText = `"${prompt.substring(0, 60)}..." sorunuz için yanıt: MehmetEndüstriyelTakip sisteminde bu konuyla ilgili veri analizi yapılıyor. Daha spesifik bir soru sorarak (örn: belirli bir sipariş durumu, stok bilgisi veya üretim planı) daha net yanıtlar alabilirim. Yardımcı olabileceğim başka bir konu var mı?`;
    }
  }

  // Temel yanıt nesnesi
  const response = {
    text: responseText,
    success: true, // Demo yanıtları için de başarılı gösterelim
    source: service,
    isDemo: true
  };
  
  // Eğer ek veri varsa yanıta ekle
  if (additionalData) {
    // Prediction verisi
    if (additionalData.prediction) {
      response.prediction = additionalData.prediction;
    }
    
    // İlgili dokümanlar
    if (additionalData.relatedDocs) {
      response.relatedDocs = additionalData.relatedDocs;
    }
    
    // 3D Model önizleme
    if (additionalData.modelPreview) {
      response.modelPreview = additionalData.modelPreview;
    }
  }
  
  return response;
};

// --- AI İÇGÖRÜ OLUŞTURMA FONKSİYONU ---
const generateAIInsight = async () => {
  const insightTypes = [
    'stock-warning', // Stok uyarısı
    'production-optimization', // Üretim optimizasyonu
    'delivery-risk', // Teslimat riski
    'quality-trend', // Kalite trendi
    'maintenance-alert', // Bakım uyarısı
    'supplier-performance' // Tedarikçi performansı
  ];
  
  const departments = [
    'Üretim', 'Satın Alma', 'Planlama', 'Kalite Kontrol', 'Lojistik', 'Teknik'
  ];
  
  // Rastgele içgörü tipi ve departman seçimi
  const insightType = insightTypes[Math.floor(Math.random() * insightTypes.length)];
  const department = departments[Math.floor(Math.random() * departments.length)];
  const importance = Math.random() > 0.8 ? 'high' : (Math.random() > 0.5 ? 'medium' : 'low');
  
  // İçgörü içeriğini oluştur
  let title, content, prediction, actions;
  
  switch (insightType) {
    case 'stock-warning':
      title = 'Kritik Stok Seviyesi Uyarısı';
      content = 'Son 3 ayın tüketim hızı analiz edildiğinde, SF6 gazlı kesicilerin stok seviyesi kritik eşiğin altına inecek. Bu durum önümüzdeki ay başlayacak olan 3 büyük proje için risk oluşturuyor.';
      actions = ['analyze', 'report'];
      prediction = { stockDays: 14, trend: -1, confidence: 0.89 };
      break;
    
    case 'production-optimization':
      title = 'Üretim Hattı Optimizasyonu';
      content = 'RM36-CB hücrelerinin montaj sürecinde darboğaz analizi yapıldı. Kablaj operasyonunun yeniden düzenlenmesi ile %12\'ye varan zaman tasarrufu sağlanabilir.';
      actions = ['analyze', 'view3d'];
      prediction = { timeSaving: '12%', trend: 1, confidence: 0.78 };
      break;
    
    case 'delivery-risk':
      title = 'Teslimat Riski Tespiti';
      content = 'ABC Firması\'nın 10 hücrelik siparişinde teslimat riski tespit edildi. Ara kontrol rölelerinin gecikmesi nedeniyle planlanan teslim tarihine yetişememe olasılığı %75.';
      actions = ['report', 'analyze'];
      prediction = { delayDays: 5, trend: -1, confidence: 0.82 };
      break;
    
    case 'quality-trend':
      title = 'Kalite İyileştirme Fırsatı';
      content = 'Son 12 ay içindeki kalite kontrol verileri analiz edildiğinde, topraklama kontrol sistemlerinde tutarsız test sonuçları görülüyor. Prosedür güncellemesi önerilir.';
      actions = ['report', 'analyze'];
      prediction = { issueRate: '3.2%', trend: -0.5, confidence: 0.91 };
      break;
    
    case 'maintenance-alert':
      title = 'Önleyici Bakım Uyarısı';
      content = 'B-241 test ünitesinin performans analizine göre, belirti göstermeden önce bakıma alınması önerilir. Bu üniteyle test edilen son 5 hücrede normalin üzerinde test süresi gözlendi.';
      actions = ['report'];
      prediction = { failureProbability: '68%', trend: 1, confidence: 0.76 };
      break;
      
    case 'supplier-performance':
      title = 'Tedarikçi Performans Analizi';
      content = 'XYZ tedarikçisinin son 6 aylık performans analizi tamamlandı. Teslimat güvenilirliği %62\'ye düşmüş durumda. Alternatif tedarikçiler değerlendirilmeli.';
      actions = ['analyze', 'report'];
      prediction = { reliabilityScore: 62, trend: -2, confidence: 0.85 };
      break;
    
    default:
      title = 'Sistem Optimizasyon Önerisi';
      content = 'Sistem verilerinin analizi sonucunda verimlilik iyileştirme fırsatı tespit edildi.';
      actions = ['analyze'];
      prediction = { efficiencyGain: '7%', confidence: 0.72 };
  }
  
  return {
    id: Date.now(),
    type: insightType,
    title,
    content,
    department,
    importance,
    date: new Date(),
    prediction,
    actions,
    source: 'METS AI Analizi'
  };
};

// --- AI İÇGÖRÜ YÖNETİMİ ---
const setupPeriodicInsights = (notificationStore) => {
  // İçgörü ve bildirim periyodu (demo modda daha sık, gerçek uygulamada daha seyrek)
  const insightInterval = 
    (import.meta.env.VITE_USE_DEMO_MODE === 'true') ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5 veya 30 dakika
    
  // İlk içgörü için kısa bir süre bekle
  setTimeout(() => generateAndNotify(), 30000);
  
  // Periyodik içgörü oluşturma
  const intervalId = setInterval(() => generateAndNotify(), insightInterval);
  
  // İçgörü oluşturup bildirim ekleme
  async function generateAndNotify() {
    if (!notificationStore) return;
    
    try {
      // Yeni içgörü oluştur
      const insight = await generateAIInsight();
      
      // Önemi yüksek olan içgörüleri bildirim olarak ekle
      if (insight.importance === 'high' || insight.importance === 'medium') {
        notificationStore.addAiNotification({
          title: insight.title,
          content: insight.content,
          department: insight.department,
          priority: insight.importance === 'high' ? 'high' : 'medium',
          category: 'ai-insight',
          metadata: { 
            insightId: insight.id,
            insightType: insight.type,
            prediction: insight.prediction
          }
        });
      }
      
      // İçgörü oluşturulduğu bilgisini sisteme yay
      const event = new CustomEvent('ai-insight-generated', { detail: insight });
      document.dispatchEvent(event);
      
      console.log('Yeni AI içgörüsü oluşturuldu:', insight.title);
      
    } catch (error) {
      console.error('İçgörü oluşturma hatası:', error);
    }
  }
  
  // Temizleme fonksiyonu
  return () => {
    clearInterval(intervalId);
  };
};

// DIŞA AKTARILAN SERVİS FONKSİYONLARI ---
export const aiService = {
  sendMessage: async (messageContent, conversationHistory = [], options = {}) => {
    const currentPrompt = messageContent;
    let messages = [];

    if (conversationHistory && conversationHistory.length > 0) {
      messages = [...conversationHistory, { role: 'user', content: currentPrompt }];
    } else {
      // Eğer geçmiş yoksa, sistem mesajı ve kullanıcı mesajı ile başlat
      // Bu sistem mesajı, AI'ın rolünü ve bağlamını belirler.
      // Projenizin gereksinimlerine göre bu mesajı özelleştirin.
      messages.push({
        role: 'system',
        content: config.ai?.systemPrompt || 'Sen MehmetEndustriyelTakip uygulaması için bir asistansın. Üretim, stok, siparişler ve genel fabrika süreçleri hakkında bilgi verebilirsin. Sorulara net, kısa ve profesyonel cevaplar ver.'
      });
      messages.push({ role: 'user', content: currentPrompt });
    }
    
    // Aktif servise göre isteği yönlendir
    if (ACTIVE_AI_SERVICE === 'gemini') {
      // Gemini için, eğer sadece tek bir prompt varsa generateContent, yoksa chat kullanılabilir.
      // Şimdilik tutarlılık için hep chat (yani generateContent altında contents array) kullanalım.
      return geminiChat(messages, options);
    } else if (ACTIVE_AI_SERVICE === 'openRouter') {
      return openRouterChatCompletion(messages, options);
    } else {
      // Desteklenmeyen servis veya demo modu
      console.warn(`Aktif AI servisi (${ACTIVE_AI_SERVICE}) desteklenmiyor veya yapılandırılmamış. Demo yanıtı kullanılıyor.`);
      return simulateAIResponse(currentPrompt, ACTIVE_AI_SERVICE);
    }
  },

  // Tek seferlik sorgular için (sohbet geçmişi olmadan)
  ask: async (prompt, options = {}) => {
    if (ACTIVE_AI_SERVICE === 'gemini') {
      return geminiGenerateContent(prompt, options);
    } else if (ACTIVE_AI_SERVICE === 'openRouter') {
      // OpenRouter için tek seferlik sorgu da chat/completions ile yapılabilir,
      // sadece messages array'i tek bir kullanıcı mesajı içerir.
      const messages = [
        { role: 'system', content: config.ai?.systemPrompt || 'Kısa ve öz cevaplar ver.' }, // Daha genel bir sistem mesajı
        { role: 'user', content: prompt }
      ];
      return openRouterChatCompletion(messages, { ...options, model: options.model || API_SERVICE_CONFIG.openRouter.defaultModels.instruct });
    } else {
      return simulateAIResponse(prompt, ACTIVE_AI_SERVICE);
    }
  },
  
  // Yapılandırmayı ve durumu kontrol etmek için yardımcı fonksiyon
  getServiceStatus: () => {
    return {
      activeService: ACTIVE_AI_SERVICE,
      isGeminiConfigured: !!(API_SERVICE_CONFIG.gemini.apiKey && API_SERVICE_CONFIG.gemini.apiUrl),
      isOpenRouterConfigured: !!(API_SERVICE_CONFIG.openRouter.apiKey && API_SERVICE_CONFIG.openRouter.apiUrl),
      geminiModel: API_SERVICE_CONFIG.gemini.modelName,
      openRouterChatModel: API_SERVICE_CONFIG.openRouter.defaultModels.chat,
      openRouterInstructModel: API_SERVICE_CONFIG.openRouter.defaultModels.instruct,
    };
  },

  // AI içgörü oluşturma fonksiyonu
  generateInsight: generateAIInsight,

  // AI içgörü yönetimi fonksiyonu
  setupPeriodicInsights
};

// Composable function to use aiService
export function useAiService() {
  // Chat history state
  const history = useStorage('ai-chat-history', []);
  const isProcessing = ref(false);
  
  // Supported AI models configuration
  const supportedModels = {
    gemini: {
      name: 'Gemini Pro',
      key: 'gemini',
      capabilities: ['Genel Sorular', 'Teknik Analiz', 'Planlama'],
    },
    openai: {
      name: 'GPT-3.5',
      key: 'openai',
      capabilities: ['Genel Sorular', 'İş Akışı', 'Veri Analizi'],
    },
    technical: {
      name: 'Teknik Uzman',
      key: 'technical',
      capabilities: ['Teknik Döküman', '3D Modeller', 'Tasarım'],
    },
  };
  
  // Active model state (persisted)
  const activeModelKey = useStorage('ai-active-model', 'gemini');
  
  // Switch AI model
  const switchModel = (modelKey) => {
    if (supportedModels[modelKey]) {
      activeModelKey.value = modelKey;
      return true;
    }
    return false;
  };
  
  // Get current model details
  const getCurrentModel = () => {
    const model = supportedModels[activeModelKey.value];
    return model ? { ...model, key: activeModelKey.value } : supportedModels.gemini;
  };
  
  // Clear chat history
  const clearHistory = () => {
    history.value = [];
  };
  
  // Send a new message
  const sendMessage = async (messageContent) => {
    if (isProcessing.value) return;
    
    isProcessing.value = true;
    
    try {
      // Add user message to history
      history.value.push({
        role: 'user',
        content: messageContent,
        timestamp: new Date()
      });
      
      // Get AI response
      const response = await aiService.sendMessage(
        messageContent, 
        history.value.filter(msg => msg.role !== 'system' && !msg.isSystemMessage),
        { model: activeModelKey.value }
      );
      
      // Add AI response to history
      if (response) {
        history.value.push({
          role: 'assistant',
          content: response.text,
          timestamp: new Date(),
          source: response.source
        });
      }
      
      return response;
    } catch (error) {
      console.error('AI yanıtı alınamadı:', error);
      history.value.push({
        role: 'assistant',
        isSystemMessage: true,
        content: 'Mesajınız işlenirken bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      });
    } finally {
      isProcessing.value = false;
    }
  };
  
  // Mock functions for system data and model interactions
  // These would be connected to real data sources in a production environment
  const getSystemData = async () => {
    return {
      cadModels: [
        { id: 'rm36cb', name: 'RM 36 CB', previewImage: '/assets/images/models/rm-36-cb.png' },
        { id: 'rm36lb', name: 'RM 36 LB', previewImage: '/assets/images/models/rm-36-lb.png' },
        { id: 'rm36bc', name: 'RM 36 BC', previewImage: '/assets/images/models/rm-36-bc.png' },
        { id: 'tr36ai', name: 'TR 36 AI', previewImage: '/assets/images/models/tr-36-ai.png' }
      ]
    };
  };
  
  const modelComponents = async (modelId) => {
    return {
      success: true,
      data: {
        components: [
          { id: 1, name: 'Ana Gövde', count: 1 },
          { id: 2, name: 'Kesici Mekanizması', count: 1 },
          { id: 3, name: 'Kontrol Paneli', count: 1 },
          { id: 4, name: 'Bara Bağlantısı', count: 3 },
          { id: 5, name: 'Topraklama Anahtarı', count: 1 }
        ]
      }
    };
  };
  
  const modelMeasurements = async (modelId) => {
    return {
      success: true,
      data: {
        dimensions: {
          width: 800,
          height: 2200,
          depth: 1500
        },
        weight: 850
      }
    };
  };
  
  return {
    // AI service core methods
    sendMessage,
    ask: aiService.ask,
    getServiceStatus: aiService.getServiceStatus,
    
    // Chat state and history
    history,
    isProcessing,
    clearHistory,
    
    // Model management
    supportedModels,
    switchModel,
    getCurrentModel,
    
    // System data interfaces
    getSystemData,
    modelComponents,
    modelMeasurements
  };
}