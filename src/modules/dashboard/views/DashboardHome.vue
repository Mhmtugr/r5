<template>
  <div class="dashboard-home">
    <h1>Gösterge Paneli</h1>
    <p>Mehmet Endüstriyel Takip Uygulamasına hoş geldiniz. Bu alan, siparişler, üretim, stok ve raporlar hakkında genel bir bakış sunacaktır.</p>
    
    <!-- AI Insights Dashboard -->
    <div class="row mb-4">
      <div class="col-12">
        <AIInsightsDashboard />
      </div>
    </div>
      <!-- Özet Kartları -->
    <div class="row mt-4">
      <div class="col-md-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Aktif Siparişler</h5>
            <p class="card-text">Şu anda {{ activeOrdersCount }} aktif sipariş bulunmaktadır.</p>
            <router-link to="/orders" class="btn btn-primary">Siparişleri Gör</router-link>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Stok Durumu</h5>
            <p class="card-text">Kritik seviyedeki malzeme: {{ criticalStockCount }}</p>
            <router-link to="/inventory" class="btn btn-info">Stok Detayları</router-link>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body">
            <h5 class="card-title">Geciken Siparişler</h5>
            <p class="card-text">{{ delayedOrdersCount }} sipariş gecikmede!</p>
            <router-link to="/dashboard/delayed-orders" class="btn btn-dark">Gecikmeleri Gör</router-link>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-danger text-white">
          <div class="card-body">
            <h5 class="card-title">Geciken Malzemeler</h5>
            <p class="card-text">{{ delayedMaterialsCount }} malzemede gecikme</p>
            <router-link to="/inventory/delayed-materials" class="btn btn-light text-danger">Detayları Gör</router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Üretim Özeti -->
    <div class="row mt-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Üretim Durumu</h5>
            <router-link to="/production" class="btn btn-sm btn-outline-primary">Tüm Üretim</router-link>
          </div>
          <div class="card-body">
            <div class="production-overview">
              <div class="d-flex justify-content-around text-center">
                <div class="status-item">
                  <div class="status-value">8</div>
                  <div class="status-label">Üretimde</div>
                </div>
                <div class="status-item">
                  <div class="status-value">3</div>
                  <div class="status-label">Test</div>
                </div>
                <div class="status-item">
                  <div class="status-value">5</div>
                  <div class="status-label">Montaj</div>
                </div>
                <div class="status-item">
                  <div class="status-value">4</div>
                  <div class="status-label">Tamamlanan</div>
                </div>
              </div>
              <div class="progress mt-3" style="height: 20px;">
                <div class="progress-bar bg-success" style="width: 40%;">40%</div>
                <div class="progress-bar bg-warning" style="width: 35%;">35%</div>
                <div class="progress-bar bg-danger" style="width: 25%;">25%</div>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <small>Zamanında: 40%</small>
                <small>Risk altında: 35%</small>
                <small>Gecikmede: 25%</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Planlama</h5>
            <router-link to="/planning" class="btn btn-sm btn-outline-primary">Detay</router-link>
          </div>
          <div class="card-body">
            <p><strong>Bugün (12 Mayıs 2025)</strong></p>
            <ul class="list-group">
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Teslim planlanmış siparişler
                <span class="badge bg-primary rounded-pill">2</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Kritik malzeme teslimatları
                <span class="badge bg-info rounded-pill">3</span>
              </li>
              <li class="list-group-item d-flex justify-content-between align-items-center">
                Başlayacak üretimler
                <span class="badge bg-success rounded-pill">4</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// İleride buraya gösterge paneli için gerekli veri çekme ve işleme mantığı eklenecek.
import { ref, onMounted } from 'vue';
import AIInsightsDashboard from '@/components/ai/AIInsightsDashboard.vue';

const activeOrdersCount = ref(0); // Örnek veri
const criticalStockCount = ref(0); // Örnek veri
const delayedOrdersCount = ref(0); // Geciken siparişler
const delayedMaterialsCount = ref(0); // Geciken malzemeler

onMounted(async () => {
  // Mock veri ile doldurma
  activeOrdersCount.value = 12;
  criticalStockCount.value = 5;
  delayedOrdersCount.value = 4;
  delayedMaterialsCount.value = 9;
  
  // Gerçek API çağrısı için:
  // try {
  //   const dashboardData = await fetchDashboardData();
  //   activeOrdersCount.value = dashboardData.activeOrders || 0;
  //   criticalStockCount.value = dashboardData.criticalStock || 0;
  //   delayedOrdersCount.value = dashboardData.delayedOrders || 0;
  //   delayedMaterialsCount.value = dashboardData.delayedMaterials || 0;
  // } catch (error) {
  //   console.error('Dashboard verileri yüklenirken hata:', error);
  // }
});
</script>

<style scoped>
.dashboard-home {
  padding: 1rem;
}

.card {
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-weight: 600;
  margin-bottom: 1rem;
}

.card-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.status-item {
  padding: 0.5rem;
}

.status-value {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.status-label {
  font-size: 0.9rem;
  color: var(--text-muted);
}
</style>