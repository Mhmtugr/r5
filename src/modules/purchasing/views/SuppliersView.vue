<template>
  <div class="suppliers-container p-4">
    <h2>Tedarikçi Yönetimi</h2>

    <!-- Arama ve Filtreleme -->
    <div class="mb-4">
      <div class="row">
        <div class="col-md-8">
          <div class="input-group">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Tedarikçi adı, kodu veya kategorisi ile ara..." 
              v-model="searchQuery"
            />
            <button class="btn btn-outline-secondary" type="button">
              <i class="bi bi-search"></i>
            </button>
          </div>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" @click="openNewSupplierModal">
            <i class="bi bi-plus-circle me-1"></i> Yeni Tedarikçi Ekle
          </button>
        </div>
      </div>
    </div>

    <!-- Tedarikçi Tablosu -->
    <div class="card">
      <div class="card-body">
        <h5 class="card-title mb-3">Tedarikçiler</h5>
        
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Tedarikçi Adı</th>
                <th scope="col">Kategori</th>
                <th scope="col">İletişim</th>
                <th scope="col">Son Sipariş</th>
                <th scope="col">Değerlendirme</th>
                <th scope="col">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(supplier, index) in suppliers" :key="supplier.id">
                <th scope="row">{{ index + 1 }}</th>
                <td>{{ supplier.name }}</td>
                <td>{{ supplier.category }}</td>
                <td>{{ supplier.contact }}</td>
                <td>{{ supplier.lastOrder }}</td>
                <td>
                  <div class="rating">
                    <i v-for="n in 5" :key="n" class="bi" :class="{'bi-star-fill': n <= supplier.rating, 'bi-star': n > supplier.rating}"></i>
                  </div>
                </td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" @click="viewSupplierDetails(supplier.id)">
                      <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success" @click="createPurchaseOrder(supplier.id)">
                      <i class="bi bi-cart-plus"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="editSupplier(supplier.id)">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modallar Buraya Gelecek -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// State tanımlamaları
const searchQuery = ref('');
const suppliers = ref([
  {
    id: 1,
    name: 'Elektro Malzeme A.Ş.',
    category: 'Elektrik Komponentleri',
    contact: 'info@elektroas.com',
    lastOrder: '2025-04-30',
    rating: 4
  },
  {
    id: 2,
    name: 'Metal İşleme Ltd.',
    category: 'Mekanik Parçalar',
    contact: 'satis@metalislemeltd.com',
    lastOrder: '2025-05-05',
    rating: 3
  },
  {
    id: 3,
    name: 'Otomasyon Sistemleri',
    category: 'Kontrol Sistemleri',
    contact: 'bilgi@otomasyonsistem.com',
    lastOrder: '2025-05-01',
    rating: 5
  },
  {
    id: 4,
    name: 'Endüstriyel Çözümler',
    category: 'Çeşitli',
    contact: 'siparis@endustriyelcozumler.com',
    lastOrder: '2025-04-15',
    rating: 4
  }
]);

// Metodlar
const openNewSupplierModal = () => {
  console.log('Yeni tedarikçi modalı açıldı');
};

const viewSupplierDetails = (id) => {
  console.log(`Tedarikçi detayları görüntülendi: ${id}`);
};

const createPurchaseOrder = (id) => {
  console.log(`Satın alma siparişi oluşturuldu: ${id}`);
};

const editSupplier = (id) => {
  console.log(`Tedarikçi düzenleme modalı açıldı: ${id}`);
};

// Lifecycle hooks
onMounted(() => {
  console.log('SuppliersView bileşeni oluşturuldu.');
});
</script>

<style scoped>
.rating {
  color: #ffc107;
}
</style>
