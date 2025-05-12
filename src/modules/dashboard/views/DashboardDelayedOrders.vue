<template>
  <div class="delayed-orders">
    <h2>Geciken Siparişler</h2>
    <p class="lead">Teslimat tarihi geçmiş veya gecikmesi muhtemel siparişler burada listelenir.</p>
    
    <!-- Filtreleme Seçenekleri -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="input-group">
          <span class="input-group-text">Filtrele</span>
          <select class="form-select" v-model="filterBy">
            <option value="all">Tüm Gecikmeler</option>
            <option value="critical">Kritik Gecikmeler (>7 gün)</option>
            <option value="moderate">Orta Gecikmeler (3-7 gün)</option>
            <option value="minor">Küçük Gecikmeler (<3 gün)</option>
          </select>
          <select class="form-select" v-model="sortBy">
            <option value="date">Teslim Tarihine Göre</option>
            <option value="customer">Müşteriye Göre</option>
            <option value="amount">Tutara Göre</option>
          </select>
          <button class="btn btn-outline-secondary" type="button" @click="applyFilters">
            <i class="bi bi-funnel"></i> Uygula
          </button>
        </div>
      </div>
      <div class="col-md-4 text-end">
        <button class="btn btn-primary" @click="generateDelayReport">
          <i class="bi bi-file-earmark-bar-graph"></i> Gecikme Raporu Oluştur
        </button>
      </div>
    </div>
    
    <!-- Geciken Siparişler Tablosu -->
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>Sipariş No</th>
            <th>Müşteri</th>
            <th>Teslim Tarihi</th>
            <th>Gecikme Süresi</th>
            <th>Durum</th>
            <th>Gecikme Nedeni</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in delayedOrders" :key="order.id" :class="getRowClass(order)">
            <td>{{ order.orderNumber }}</td>
            <td>{{ order.customer }}</td>
            <td>{{ formatDate(order.deliveryDate) }}</td>
            <td>{{ order.delayDays }} gün</td>
            <td>
              <span class="badge" :class="getStatusClass(order.status)">{{ order.status }}</span>
            </td>
            <td>{{ order.delayReason }}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <router-link :to="`/orders/${order.id}`" class="btn btn-outline-primary">
                  <i class="bi bi-eye"></i> Görüntüle
                </router-link>
                <button class="btn btn-outline-warning" @click="prioritizeOrder(order.id)">
                  <i class="bi bi-arrow-up-circle"></i> Önceliklendir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Gecikme Analizi -->
    <div class="card mt-4">
      <div class="card-header">
        <h5>Gecikme Analizi</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>Gecikme Nedenleri Dağılımı</h6>
            <canvas id="delayReasonsChart" height="250"></canvas>
          </div>
          <div class="col-md-6">
            <h6>Şu anki gecikme etkisi</h6>
            <div class="impact-stats">
              <div class="stat-item">
                <div class="stat-label">Finansal Etki:</div>
                <div class="stat-value text-danger">-₺125,000</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Etkilenen Müşteri Sayısı:</div>
                <div class="stat-value">8</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Ortalama Gecikme:</div>
                <div class="stat-value">6.4 gün</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <button class="btn btn-info" @click="showDelayRecommendations">
          <i class="bi bi-lightbulb"></i> Gecikmeleri Azaltmak İçin Öneriler
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// State
const delayedOrders = ref([
  {
    id: 1,
    orderNumber: 'OG-2025-042',
    customer: 'Elektrik Dağıtım A.Ş.',
    deliveryDate: '2025-05-01',
    delayDays: 11,
    status: 'Kritik',
    delayReason: 'Malzeme tedarik sorunu'
  },
  {
    id: 2,
    orderNumber: 'OG-2025-039',
    customer: 'Enerji Sistemleri Ltd.',
    deliveryDate: '2025-05-05',
    delayDays: 7,
    status: 'Orta',
    delayReason: 'Kalite kontrol'
  },
  {
    id: 3,
    orderNumber: 'OG-2025-044',
    customer: 'Sanayi Tesisleri A.Ş.',
    deliveryDate: '2025-05-08',
    delayDays: 4,
    status: 'Düşük',
    delayReason: 'Personel yetersizliği'
  },
  {
    id: 4,
    orderNumber: 'OG-2025-047',
    customer: 'Solar Elektrik',
    deliveryDate: '2025-05-10',
    delayDays: 2,
    status: 'Düşük',
    delayReason: 'Üretim planı değişikliği'
  }
]);

const filterBy = ref('all');
const sortBy = ref('date');
const router = useRouter();

// Methods
const getRowClass = (order) => {
  if (order.delayDays > 7) return 'table-danger';
  if (order.delayDays >= 3) return 'table-warning';
  return 'table-light';
};

const getStatusClass = (status) => {
  if (status === 'Kritik') return 'bg-danger';
  if (status === 'Orta') return 'bg-warning text-dark';
  return 'bg-info text-dark';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
};

const applyFilters = () => {
  console.log(`Filtreler uygulandı: ${filterBy.value}, sıralama: ${sortBy.value}`);
  // Gerçek uygulamada burada API'den veri çekilebilir
};

const prioritizeOrder = (orderId) => {
  console.log(`Sipariş önceliklendirildi: ${orderId}`);
  // Gerçek uygulamada burada API çağrısı yapılabilir
};

const generateDelayReport = () => {
  console.log('Gecikme raporu oluşturuluyor...');
  // Gerçek uygulamada burada rapor oluşturma/indirme işlemi yapılabilir
};

const showDelayRecommendations = () => {
  console.log('Gecikme önerileri gösteriliyor...');
  // Gerçek uygulamada bir modal açılabilir
};

onMounted(() => {
  console.log('Geciken Siparişler bileşeni yüklendi');
  // Gerçek uygulamada burada API'den veri çekilebilir
  // ve delayReasonsChart gibi grafikler oluşturulabilir
});
</script>

<style scoped>
.impact-stats {
  margin-top: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.stat-value {
  font-weight: bold;
}

.text-danger {
  color: #dc3545;
}
</style>
