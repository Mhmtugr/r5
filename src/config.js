/**
 * MehmetEndüstriyelTakip Konfigürasyon Dosyası
 * 
 * Bu dosya, tüm uygulama çapındaki yapılandırma ayarlarını merkezi olarak yönetir.
 * Orta ölçekli sanayi üretim süreçleri için gerekli tüm parametreleri içerir.
 * 
 * @version 2.0.0
 * @author MehmetMETS Team
 */

// Ortam değişkenlerini Vite ile al
const env = import.meta.env;

/**
 * Uygulama genelinde kullanılan konfigürasyon ayarları
 * Tüm servisler tarafından bu yapı üzerinden erişilebilir
 */
const appConfig = {
  /**
   * Temel Uygulama Bilgileri
   */
  app: {
    name: 'MehmetEndüstriyelTakip',
    shortName: 'METS',
    version: env.VITE_APP_VERSION || '2.0.0',
    description: 'Orta Gerilim Hücre İmalat Takip Sistemi',
    environment: env.MODE || 'production',
    baseUrl: env.BASE_URL || '/',
    buildDate: new Date().toISOString(),
  },

  /**
   * API ve Sunucu Bağlantı Ayarları
   */
  api: {
    baseUrl: env.VITE_API_URL || 'https://api.mehmet-endustriyel.com',
    timeout: parseInt(env.VITE_API_TIMEOUT || '30000'),
    useMockData: env.VITE_USE_DEMO_MODE === 'true' || env.MODE === 'development',
    retryAttempts: parseInt(env.VITE_API_RETRY_ATTEMPTS || '3'),
    authHeaderName: 'Authorization',
  },

  /**
   * Yapay Zeka Servisleri Ayarları
   * METS uygulamasının en önemli farklılaştırıcı özelliği
   */
  ai: {
    // Aktif servis seçimi (gemini, openRouter, local)
    activeService: env.VITE_ACTIVE_AI_SERVICE || 'gemini',
    
    // Chatbot Ayarları
    chatbot: {
      name: 'METS AI Asistan',
      icon: '/assets/icons/ai-assistant.svg',
      welcomeMessage: 'METS AI Asistan ile üretim ve teknik bilgilere erişebilirsiniz. Size nasıl yardımcı olabilirim?',
      defaultPlaceholder: 'Bir soru sorun veya sipariş durumu sorgulayın...',
    },
    
    // Gemini Servisi
    gemini: {
      apiKey: env.VITE_GEMINI_API_KEY,
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      modelName: env.VITE_AI_MODEL_NAME || 'gemini-1.5-pro',
      maxTokens: parseInt(env.VITE_GEMINI_MAX_TOKENS || '8192'),
      temperature: parseFloat(env.VITE_GEMINI_TEMPERATURE || '0.7'),
      promptPrefixes: {
        technical: 'Mehmet Endüstriyel orta gerilim hücre üreticisi bir firmadır. Aşağıdaki teknik soruya uzman elektrik mühendisi olarak yanıt ver:',
        planning: 'Sen bir üretim planlama uzmanısın. Şu soruya üretim akışı optimizasyonu perspektifiyle cevap ver:',
        general: 'Mehmet Endüstriyel orta gerilim üretimi yapan bir firma için şu soruyu yanıtla:'
      }
    },

    // OpenRouter Servisi
    openRouter: {
      apiKey: env.VITE_OPENROUTER_API_KEY,
      apiUrl: 'https://openrouter.ai/api/v1',
      defaultModels: {
        chat: env.VITE_OPENROUTER_CHAT_MODEL || 'openai/gpt-3.5-turbo',
        instruct: env.VITE_OPENROUTER_INSTRUCT_MODEL || 'google/gemini-flash-1.5',
        technical: env.VITE_OPENROUTER_TECHNICAL_MODEL || 'openai/gpt-4',
      },
      siteUrl: env.VITE_SITE_URL || 'https://erp.mehmet-endustriyel.com',
      appName: 'METS AI Assistant',
      maxTokens: parseInt(env.VITE_OPENROUTER_MAX_TOKENS || '4096'),
    },
    
    // Yerel AI Model Servisi (ilerideki uygulamalar için)
    localModel: {
      enabled: env.VITE_LOCAL_MODEL_ENABLED === 'true',
      apiUrl: env.VITE_LOCAL_MODEL_URL || 'http://localhost:8080/api',
      modelPath: env.VITE_LOCAL_MODEL_PATH,
      contextWindow: parseInt(env.VITE_LOCAL_MODEL_CONTEXT_WINDOW || '4096'),
    },
    
    // Dosya ve Dökümantasyon AI İşleme
    documentProcessing: {
      enabled: true,
      supportedTypes: ['pdf', 'docx', 'xlsx', 'dwg', 'dxf', 'png', 'jpg'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      ocrEnabled: env.VITE_OCR_ENABLED === 'true',
    },
    
    // Üretim Analitiği ve Tahminleme
    analytics: {
      enablePredictions: true,
      predictionModels: {
        deliveryDate: 'regression',
        productionEfficiency: 'timeseries',
        qualityControl: 'classification',
      },
      confidenceThreshold: 0.75,
      historyWindowDays: 365, // Tahmin için kullanılacak geçmiş veri penceresi
    }
  },
  
  /**
   * Canias ERP Entegrasyonu Ayarları
   * Stok yönetimi ve sipariş takibi için kritik ayarlar
   */
  erp: {
    // Bağlantı ayarları
    connection: {
      wsUrl: env.VITE_ERP_WS_URL || 'wss://erp-sync.mehmet-endustriyel.com',
      apiEndpoint: env.VITE_ERP_API_ENDPOINT || '/api/erp',
      useSecureConnection: env.VITE_ERP_USE_SECURE === 'true' || true,
      timeout: parseInt(env.VITE_ERP_TIMEOUT || '60000'),
    },
    
    // Senkronizasyon ayarları
    sync: {
      interval: parseInt(env.VITE_ERP_SYNC_INTERVAL || '300000'), // Default 5 dakika
      retryDelay: parseInt(env.VITE_ERP_RETRY_DELAY || '10000'), // Default 10 saniye
      maxRetries: parseInt(env.VITE_ERP_MAX_RETRIES || '5'),
      priorityUpdates: ['stocks', 'orders', 'production'],
    },
    
    // Veri entegrasyonu ayarları
    integration: {
      stockModule: 'B01', // Ana stok deposu kodu
      materialPrefix: 'MAT',
      orderPrefix: 'SPR',
      enableBatchProcessing: true,
      logLevel: env.VITE_ERP_LOG_LEVEL || 'info',
      cacheExpiry: 24 * 60 * 60 * 1000, // 24 saat
    },
    
    // Offline modu ve veri saklama ayarları
    offline: {
      enableOfflineMode: true,
      syncOnReconnect: true,
      persistChanges: true,
      storageQuota: 50 * 1024 * 1024, // 50MB
    }
  },
  
  /**
   * Üretim Planlama ve Takip Ayarları
   */
  production: {
    // Üretim birimi ayarları
    units: [
      { id: 'elektrik_tasarim', name: 'Elektrik Tasarım', defaultCapacity: 160 },
      { id: 'mekanik_tasarim', name: 'Mekanik Tasarım', defaultCapacity: 120 },
      { id: 'satin_alma', name: 'Satın Alma', defaultCapacity: 80 },
      { id: 'mekanik_uretim', name: 'Mekanik Üretim', defaultCapacity: 200 },
      { id: 'ic_montaj', name: 'İç Montaj', defaultCapacity: 240 },
      { id: 'kablaj', name: 'Kablaj', defaultCapacity: 320 },
      { id: 'genel_montaj', name: 'Genel Montaj', defaultCapacity: 280 },
      { id: 'test', name: 'Test', defaultCapacity: 160 }
    ],
    
    // Ürün tipleri ve özellikleri
    productTypes: [
      { id: 'RM36CB', name: 'RM 36 CB', baseHours: 48 },
      { id: 'RM36LB', name: 'RM 36 LB', baseHours: 36 },
      { id: 'RM36FL', name: 'RM 36 FL', baseHours: 28 },
      { id: 'RM36MB', name: 'RM 36 MB', baseHours: 40 },
      { id: 'RMU', name: 'RMU', baseHours: 56 }
    ],
    
    // Planlama ayarları
    planning: {
      defaultShiftHours: 8,
      workDaysPerWeek: 5,
      overTimeEnabled: true,
      maxOverTimeHours: 4,
      priorityLevels: ['critical', 'high', 'medium', 'low'],
      defaultPriority: 'medium',
      alertThresholds: {
        delayWarning: 8, // Saat
        delayCritical: 24, // Saat
        capacityWarning: 85, // Yüzde
        capacityCritical: 95, // Yüzde
      }
    },
    
    // Not ve uyarı sistemi ayarları
    notifications: {
      defaultResponseTime: 3 * 60 * 60 * 1000, // 3 saat (ms)
      reminderInterval: 30 * 60 * 1000, // 30 dakika (ms)
      escalationLevels: ['department', 'management', 'executive'],
      severityLevels: {
        info: { color: 'blue', icon: 'info-circle' },
        warning: { color: 'yellow', icon: 'exclamation-triangle' },
        critical: { color: 'red', icon: 'exclamation-circle' }
      }
    }
  },
  
  /**
   * Kullanıcı Arayüzü ve Görselleştirme Ayarları
   */
  ui: {
    // Tema ayarları
    theme: {
      default: env.VITE_DEFAULT_THEME || 'light',
      supportedThemes: ['light', 'dark', 'blue', 'contrast'],
      colors: {
        primary: env.VITE_COLOR_PRIMARY || '#1e40af',
        secondary: env.VITE_COLOR_SECONDARY || '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        light: '#f8fafc',
        dark: '#1e293b',
      }
    },
    
    // Marka ve Logo
    brand: {
      logo: {
        light: '/assets/logo-light.svg',
        dark: '/assets/logo-dark.svg',
        small: '/assets/logo-icon.svg',
      },
      favicon: '/favicon.ico',
      touchIcon: '/assets/icons/apple-touch-icon.png',
    },
    
    // Bildirimler ve Toast mesajları
    notifications: {
      position: 'top-right',
      duration: 5000,
      maxVisible: 5,
    },
    
    // Sayfalama ayarları
    pagination: {
      defaultPageSize: 25,
      pageSizeOptions: [10, 25, 50, 100],
    },
    
    // Data tabloları için varsayılan ayarlar
    tables: {
      denseLayout: false,
      enableSorting: true,
      enableFiltering: true,
      enableExport: true,
      exportFormats: ['xlsx', 'csv', 'pdf'],
    },
    
    // Grafikler ve veri görselleştirme
    charts: {
      defaultLib: 'chartjs',
      colorScheme: 'blue',
      animate: true,
      responsive: true,
      defaultHeight: 300,
    },
    
    // Bilgi panelleri (dashboard widgets)
    dashboards: {
      refreshInterval: 5 * 60 * 1000, // 5 dakika
      defaultLayout: 'grid',
      savableLayouts: true,
      defaultWidgets: ['productionStatus', 'pendingOrders', 'materialAlerts', 'delayedItems']
    }
  },
  
  /**
   * Sistem ve Güvenlik Ayarları
   */
  system: {
    // Oturum ayarları
    session: {
      tokenName: 'mets_auth_token',
      tokenExpiry: 8 * 60 * 60 * 1000, // 8 saat
      refreshThreshold: 30 * 60 * 1000, // 30 dakika
      inactivityTimeout: 45 * 60 * 1000, // 45 dakika
    },
    
    // Günlük (logging) ve hata izleme
    logging: {
      level: env.VITE_LOG_LEVEL || 'info',
      enableConsole: env.MODE !== 'production',
      enableRemote: env.VITE_REMOTE_LOGGING === 'true',
      remoteEndpoint: env.VITE_LOG_ENDPOINT,
      sensitiveFields: ['password', 'token', 'apiKey'],
    },
    
    // PWA konfigürasyonu
    pwa: {
      enabled: true,
      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
      },
      installPrompt: true,
      updateCheckInterval: 60 * 60 * 1000, // 1 saat
    },
    
    // Önbellek (cache) ayarları
    cache: {
      enabled: true,
      staticMaxAge: 30 * 24 * 60 * 60, // 30 gün (saniye)
      apiMaxAge: 5 * 60, // 5 dakika (saniye)
      localStorageQuota: 10 * 1024 * 1024, // 10MB
    }
  },
  
  /**
   * İzleme ve Analiz Ayarları
   */
  analytics: {
    enabled: env.VITE_ANALYTICS_ENABLED !== 'false',
    provider: env.VITE_ANALYTICS_PROVIDER || 'internal',
    trackingId: env.VITE_ANALYTICS_ID,
    anonymizeIp: true,
    features: {
      pageViews: true,
      events: true,
      timing: true,
      exceptions: true,
    },
    consent: {
      required: true,
      cookieName: 'analytics_consent',
      cookieExpiry: 365, // Gün
    }
  }
};

// Tek bir config nesnesi olarak dışa aktar
export default appConfig;
