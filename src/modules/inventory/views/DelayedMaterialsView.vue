<template>
  <div class="delayed-materials">
    <h2>Geciken Malzemeler</h2>
    <p class="lead">Zamanında tedarik edilmeyen veya teslim süresi aşılmış malzemelerin listesi.</p>
    
    <!-- Filtreleme ve Arama -->
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Malzeme adı, kodu veya tedarikçi ile ara..." 
            v-model="searchQuery"
          />
          <select class="form-select" v-model="priorityFilter">
            <option value="all">Tüm Öncelikler</option>
            <option value="high">Yüksek Öncelik</option>
            <option value="medium">Orta Öncelik</option>
            <option value="low">Düşük Öncelik</option>
          </select>
          <button class="btn btn-outline-secondary" @click="applyFilters">
            <i class="bi bi-search"></i> Ara
          </button>
        </div>
      </div>
      <div class="col-md-4 text-end">
        <button class="btn btn-primary" @click="exportDelayedMaterialsList">
          <i class="bi bi-download"></i> Listeyi İndir
        </button>
      </div>
    </div>
    
    <!-- Geciken Malzemeler Tablosu -->
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Malzeme</th>
                <th>Beklenen Miktar</th>
                <th>Tedarikçi</th>
                <th>Sipariş Tarihi</th>
                <th>Beklenen Teslim</th>
                <th>Gecikme</th>
                <th>Etkilenen Siparişler</th>
                <th>Öncelik</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(material, index) in delayedMaterials" :key="material.id" :class="getRowClass(material)">
                <td>{{ material.code }}</td>
                <td>{{ material.name }}</td>
                <td>{{ material.quantity }} {{ material.unit }}</td>
                <td>{{ material.supplier }}</td>
                <td>{{ formatDate(material.orderDate) }}</td>
                <td>{{ formatDate(material.expectedDelivery) }}</td>
                <td>{{ material.delayDays }} gün</td>
                <td>
                  <span class="badge bg-secondary">{{ material.affectedOrders }} sipariş</span>
                  <button class="btn btn-sm btn-link" @click="showAffectedOrders(material.id)">Görüntüle</button>
                </td>
                <td>
                  <span class="badge" :class="getPriorityClass(material.priority)">
                    {{ getPriorityLabel(material.priority) }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-success" @click="contactSupplier(material.id)">
                      <i class="bi bi-telephone"></i> Tedarikçiyi Ara
                    </button>
                    <button class="btn btn-outline-primary" @click="findAlternative(material.id)">
                      <i class="bi bi-shuffle"></i> Alternatif Bul
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- İstatistikler -->
    <div class="row mt-4">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Tedarikçi Performansı</h5>
          </div>
          <div class="card-body">
            <canvas id="supplierPerformanceChart" height="250"></canvas>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h5>Geciken Malzeme Kategorileri</h5>
          </div>
          <div class="card-body">
            <canvas id="materialCategoriesChart" height="250"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State
const searchQuery = ref('');
const priorityFilter = ref('all');
const delayedMaterials = ref([
  {
    id: 1,
    code: 'EK-1025',
    name: 'Sigorta (100A)',
    quantity: 50,
    unit: 'adet',
    supplier: 'Elektro Malzeme A.Ş.',
    orderDate: '2025-03-15',
    expectedDelivery: '2025-04-20',
    delayDays: 22,
    affectedOrders: 3,
    priority: 'high'
  },
  {
    id: 2,
    code: 'MK-7356',
    name: 'Bağlantı Terminali',
    quantity: 200,
    unit: 'adet',
    supplier: 'Metal İşleme Ltd.',
    orderDate: '2025-04-01',
    expectedDelivery: '2025-05-01',
    delayDays: 11,
    affectedOrders: 2,
    priority: 'medium'
  },
  {
    id: 3,
    code: 'EK-2233',
    name: 'Kontaktör (132A)',
    quantity: 15,
    unit: 'adet',
    supplier: 'Elektro Malzeme A.Ş.',
    orderDate: '2025-04-10',
    expectedDelivery: '2025-05-05',
    delayDays: 7,
    affectedOrders: 1,
    priority: 'high'
  },
  {
    id: 4,
    code: 'MK-8112',
    name: 'Bara (20x5mm)',
    quantity: 100,
    unit: 'metre',
    supplier: 'Metal İşleme Ltd.',
    orderDate: '2025-04-15',
    expectedDelivery: '2025-05-10',
    delayDays: 2,
    affectedOrders: 4,
    priority: 'low'
  }
]);

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
};

const getRowClass = (material) => {
  if (material.priority === 'high') return 'table-danger';
  if (material.priority === 'medium') return 'table-warning';
  return 'table-light';
};

const getPriorityClass = (priority) => {
  if (priority === 'high') return 'bg-danger';
  if (priority === 'medium') return 'bg-warning text-dark';
  return 'bg-info text-dark';
};

const getPriorityLabel = (priority) => {
  if (priority === 'high') return 'Yüksek';
  if (priority === 'medium') return 'Orta';
  return 'Düşük';
};

const applyFilters = () => {
  console.log(`Arama: ${searchQuery.value}, Öncelik: ${priorityFilter.value}`);
  // Gerçek uygulamada burada filtreleme yapılır
};

const showAffectedOrders = (materialId) => {
  console.log(`Etkilenen siparişler görüntüleniyor: ${materialId}`);
  // Gerçek uygulamada burada bir modal açılır ve etkilenen siparişler listelenir
};

const contactSupplier = (materialId) => {
  console.log(`Tedarikçi iletişim bilgileri: ${materialId}`);
  // Gerçek uygulamada burada tedarikçi iletişim bilgileri gösterilir
};

const findAlternative = (materialId) => {
  console.log(`Alternatif malzeme araştırılıyor: ${materialId}`);
  // Gerçek uygulamada burada alternatif malzemeler önerilir
};

const exportDelayedMaterialsList = () => {
  console.log('Liste dışa aktarılıyor...');
  // Gerçek uygulamada burada Excel/PDF çıktısı alınır
};

onMounted(() => {
  console.log('Geciken Malzemeler bileşeni yüklendi');
  // Gerçek uygulamada burada API'den veriler çekilir ve grafikler oluşturulur
});
</script>

<style scoped>
.delayed-materials {
  padding: 1rem;
}
</style>
