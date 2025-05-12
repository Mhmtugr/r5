/**
 * METS - MehmetEndüstriyelTakip Ana Uygulama Giriş Noktası
 * Version: 2.0.0
 * Author: MehmetMETS Team
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import router from '@/router'

// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/main.scss'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Utils and Config
import { aiService } from '@/services/ai-service'
import { apiService } from '@/services/api-service'
import { useEventBus } from '@/utils/event-bus'
import { registerServiceWorker, checkForUpdates, listenToNetworkChanges } from '@/utils/service-worker'

// Service Worker Kaydı ve PWA Özellikleri
window.addEventListener('load', async () => {
  try {
    // Service Worker'ı kaydet
    const registration = await registerServiceWorker();
    
    if (registration) {
      // Güncellemeleri kontrol et
      checkForUpdates();
      
      // Online/offline durumu dinle ve kullanıcıya bildir
      listenToNetworkChanges(
        // Çevrimdışı olunduğunda
        () => {
          console.log('Bağlantı kesildi, çevrimdışı moduna geçildi');
          useEventBus().emit('network:offline');
        },
        // Çevrimiçi olunduğunda
        () => {
          console.log('Bağlantı kuruldu, çevrimiçi moduna geçildi');
          useEventBus().emit('network:online');
        }
      );
    }
  } catch (error) {
    console.error('Service Worker başlatılırken hata:', error);
  }
});

// Oluştur ve ayarla
const app = createApp(App)

// Pinia store
const pinia = createPinia()
app.use(pinia)

// Router kullan
app.use(router)

// Global özellikleri ayarla
app.config.globalProperties.$eventBus = useEventBus()
app.config.globalProperties.$apiService = apiService
app.config.globalProperties.$aiService = aiService

// Geliştirme sırasında faydalı konsol mesajları
if (import.meta.env.DEV) {
  console.log('🚀 MehmetEndüstriyelTakip - Geliştirme Modu')
  console.log('🔌 API URL:', import.meta.env.VITE_API_URL || 'Not configured')
  console.log('📊 Version:', import.meta.env.VITE_APP_VERSION || '1.0.0')
  
  // Daha temiz bir Development deneyimi için konsol grupları kullan
  console.groupCollapsed('🛠️ Geliştirme Bilgileri')
  console.log('Pinia Store:', pinia)
  console.log('Router:', router)
  console.log('Environment:', import.meta.env)
  console.groupEnd()
}

// Uygulama Error Handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global Error:', err)
  console.error('Error Component:', vm)
  console.error('Error Info:', info)
  
  // Gerçek bir uygulamada bir hata izleme servisine bildirimde bulunulabilir (Sentry vb.)
}

// Service Worker Güncelleme Olayını Dinle
document.addEventListener('swUpdateAvailable', (event) => {
  // Kullanıcıya güncelleme bildirimi göster
  const isConfirmed = confirm('Uygulamanın yeni sürümü mevcut. Yüklemek için sayfayı yenilemek ister misiniz?');
  if (isConfirmed && event.detail && typeof event.detail.reload === 'function') {
    event.detail.reload();
  }
});

// Mount et
app.mount('#app')