<template>
  <div class="production-container p-4">
    <!-- Üst Başlık ve Butonlar -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Üretim Yönetimi</h2>
      <div class="action-buttons">
        <button @click="openModelViewer" class="btn btn-info me-2">
          <i class="bi bi-badge-3d"></i> 3D Model Görüntüle
        </button>
        <button @click="openUpdatePlanModal" class="btn btn-primary me-2">
          <i class="bi bi-calendar-plus"></i> Plan Güncelle
        </button>
        <button @click="openAddReportModal" class="btn btn-success">
          <i class="bi bi-file-earmark-plus"></i> Rapor Ekle
        </button>
      </div>
    </div>

    <!-- Model Seçici - Üretim modelleri arasında geçiş yapabilmek için -->
    <div class="row mb-4">
      <div class="col-12">
        <ModelSelector 
          :models="availableModels" 
          @select-model="selectModel"
          @preview-model="previewModel"
        />
      </div>
    </div>

    <!-- Yükleniyor Göstergesi -->
    <div v-if="isLoading" class="text-center">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Yükleniyor...</span>
      </div>
    </div>

    <!-- Hata Mesajı -->
    <div v-else-if="error" class="alert alert-danger">
      Üretim verileri yüklenirken bir hata oluştu: {{ error.message }}
    </div>

    <!-- İçerik Alanı -->
    <div v-else-if="productionData">
      <!-- Üretim Durumu Kartı -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Üretim Durumu</h5>
          <div class="progress mb-3" style="height: 25px;">
            <div class="progress-bar" role="progressbar" :style="{ width: productionData.progress + '%' }" :aria-valuenow="productionData.progress" aria-valuemin="0" aria-valuemax="100">
              {{ productionData.progress }}%
            </div>
          </div>
          <p class="card-text">
            <strong>Aktif Siparişler:</strong> {{ productionData.activeOrders }}<br>
            <strong>Tamamlanan:</strong> {{ productionData.completedOrders }}<br>
            <strong>Geciken:</strong> {{ productionData.delayedOrders }}
          </p>
        </div>
      </div>

      <!-- Üretim Planı Tablosu -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Üretim Planı</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Başlangıç</th>
                  <th>Bitiş</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="productionData.plan.length === 0">
                  <td colspan="7" class="text-center">Gösterilecek üretim planı bulunamadı.</td>
                </tr>
                <tr v-for="item in productionData.plan" :key="item.orderNumber">
                  <td>{{ item.orderNumber }}</td>
                  <td>{{ item.customer }}</td>
                  <td>{{ item.product }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatDate(item.startDate) }}</td>
                  <td>{{ formatDate(item.endDate) }}</td>
                  <td><span class="badge" :class="getStatusClass(item.status)">{{ item.status }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Üretim Raporları Tablosu -->
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Üretim Raporları</h5>
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Verimlilik</th>
                  <th>Hedef</th>
                  <th>Gerçekleşen</th>
                  <th>Fark</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="productionData.reports.length === 0">
                  <td colspan="5" class="text-center">Gösterilecek üretim raporu bulunamadı.</td>
                </tr>
                <tr v-for="report in productionData.reports" :key="report.date">
                  <td>{{ formatDate(report.date) }}</td>
                  <td>{{ report.efficiency }}%</td>
                  <td>{{ report.target }}</td>
                  <td>{{ report.actual }}</td>
                  <td :class="report.difference >= 0 ? 'text-success' : 'text-danger'">
                    {{ report.difference >= 0 ? '+' : '' }}{{ report.difference }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- 3D Model Önizleme, seçilen model varsa -->
    <div class="row" v-if="selectedModel">
      <div class="col-12">
        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Ürün Model Önizlemesi</h5>
            <button class="btn btn-sm btn-outline-primary" @click="openModelViewer">
              <i class="bi bi-arrows-fullscreen"></i> Tam Ekran
            </button>
          </div>
          <div class="card-body p-0" style="height: 300px;">
            <ModelPreview 
              :model-url="selectedModel.url"
              :model-name="selectedModel.name" 
              :annotations="selectedModel.annotations"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 3D Model Görüntüleyici Modal -->
    <ModelViewerModal 
      v-if="showModelViewer"
      :model-url="selectedModel?.url"
      :model-name="selectedModel?.name"
      :annotations="selectedModel?.annotations"
      @close="closeModelViewer"
    />

    <!-- TODO: Modalları ekle (UpdatePlanModal, AddReportModal) -->
    <!-- Örnek: <UpdatePlanModal v-model:visible="isUpdatePlanModalVisible" @plan-updated="refreshData" /> -->

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import productionModule from '@/modules/production/index.js'; 
import ModelSelector from '@/components/ai/ModelSelector.vue';
import ModelPreview from '@/components/ai/ModelPreview.vue';
import ModelViewerModal from '@/components/ai/ModelViewerModal.vue';

// Mock service - Yalnızca hata durumunda kullanılacak
const mockApiService = {
  getProductionData: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      progress: 75,
      activeOrders: 12,
      completedOrders: 45,
      delayedOrders: 3,
      plan: [
        { orderNumber: 'ORD-001', customer: 'Müşteri A', product: 'RM 36 CB', quantity: 5, startDate: '2023-10-01', endDate: '2023-10-15', status: 'Devam Ediyor' },
        { orderNumber: 'ORD-002', customer: 'Müşteri B', product: 'RM 36 LB', quantity: 10, startDate: '2023-10-05', endDate: '2023-10-25', status: 'Planlandı' },
        { orderNumber: 'ORD-003', customer: 'Müşteri C', product: 'RMU', quantity: 2, startDate: '2023-09-20', endDate: '2023-10-05', status: 'Tamamlandı' },
      ],
      reports: [
        { date: '2023-10-05', efficiency: 95, target: 100, actual: 95, difference: -5 },
        { date: '2023-10-04', efficiency: 102, target: 100, actual: 102, difference: 2 },
        { date: '2023-10-03', efficiency: 98, target: 100, actual: 98, difference: -2 },
      ]
    };
  }
};

const productionData = ref(null);
const isLoading = ref(true);
const error = ref(null);
const showModelViewer = ref(false);
const selectedModel = ref(null);

// Örnek 3D Modeller
const availableModels = ref([
  { 
    id: 'rm36cb', 
    name: 'RM 36 CB', 
    url: '/models/rm36cb.glb', 
    thumbnail: '/images/models/rm36cb-thumb.jpg',
    description: 'Orta gerilim kesici hücresi',
    annotations: [
      {
        position: { x: 0.5, y: 1.2, z: 0.3 },
        content: 'Kesici Mekanizması',
        details: 'VD4 tipi vakum kesici, 36kV 1250A'
      },
      {
        position: { x: -0.2, y: 0.8, z: 0.1 },
        content: 'Ayırıcı Mekanizması',
        details: 'Çift pozisyonlu motor kumandalı ayırıcı'
      }
    ]
  },
  { 
    id: 'rm36lb', 
    name: 'RM 36 LB', 
    url: '/models/rm36lb.glb', 
    thumbnail: '/images/models/rm36lb-thumb.jpg',
    description: 'Orta gerilim ayırıcı hücresi',
    annotations: [
      {
        position: { x: 0.3, y: 0.9, z: 0.2 },
        content: 'Yük Ayırıcı',
        details: 'NAL tipi SF6 gaz izoleli yük ayırıcı'
      }
    ]
  },
  { 
    id: 'rmu', 
    name: 'RMU', 
    url: '/models/rmu.glb', 
    thumbnail: '/images/models/rmu-thumb.jpg',
    description: 'Ring Main Unit',
    annotations: []
  }
]);

// Veri yükleme fonksiyonu
const loadData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Production modülünü başlatıyoruz
    await productionModule.init();
    
    // API verilerini alıyoruz
    // Burada production modülünden gelen verileri view'ın ihtiyaç duyduğu formata dönüştürüyoruz
    productionData.value = {
      progress: productionModule.productionData.progress || 0,
      activeOrders: productionModule.productionData.activeProduction?.length || 0,
      completedOrders: productionModule.productionData.completedOrders || 0,
      delayedOrders: productionModule.productionData.delayedOrders || 0,
      plan: productionModule.productionData.schedule?.map(item => ({
        orderNumber: item.orderNumber || item.id,
        customer: item.customer,
        product: item.productName,
        quantity: item.quantity,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.status
      })) || [],
      reports: productionModule.productionData.reports || []
    };
  } catch (err) {
    console.error('Üretim verileri yüklenirken hata:', err);
    error.value = err;
    
    // Hata durumunda mock veri kullanıyoruz
    productionData.value = await mockApiService.getProductionData();
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadData();
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('tr-TR');
  } catch (e) {
    console.warn(`Invalid date format: ${dateString}`);
    return dateString; // Return original string if formatting fails
  }
};

const getStatusClass = (status) => {
  const statusClasses = {
    'Planlandı': 'bg-primary',
    'Devam Ediyor': 'bg-warning text-dark', // Dark text for better contrast on yellow
    'Tamamlandı': 'bg-success',
    'Gecikti': 'bg-danger'
  };
  return statusClasses[status] || 'bg-secondary';
};

const openUpdatePlanModal = () => {
  console.log('Plan güncelleme modalı açılacak');
  // isUpdatePlanModalVisible.value = true;
  // TODO: Implement modal opening logic
};

const openAddReportModal = () => {
  console.log('Rapor ekleme modalı açılacak');
  // isAddReportModalVisible.value = true;
  // TODO: Implement modal opening logic
};

// Model işlemleri
const selectModel = (model) => {
  selectedModel.value = model;
  console.log(`${model.name} modeli seçildi`);
};

const previewModel = (model) => {
  selectedModel.value = model;
  openModelViewer();
};

const openModelViewer = () => {
  if (selectedModel.value) {
    showModelViewer.value = true;
  } else if (availableModels.value.length > 0) {
    selectedModel.value = availableModels.value[0];
    showModelViewer.value = true;
  }
};

const closeModelViewer = () => {
  showModelViewer.value = false;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* R3/modules/production/production.html <style> bloğundaki stiller buraya taşınabilir */
.table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

/* Action button aralığı için */
.action-buttons > .btn {
  margin-left: 0.5rem; /* veya me-2 yerine */
}
.action-buttons > .btn:first-child {
  margin-left: 0;
}

.badge {
  font-size: 0.85em;
  padding: 0.4em 0.7em;
}
</style>