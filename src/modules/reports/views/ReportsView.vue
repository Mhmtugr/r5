<template>
  <div class="reports-view">
    <!-- AI ve Makine Öğrenmesi Paneli -->
    <div class="row mb-4">
      <div class="col-12">
        <MachineLearningPanel 
          :dataInsights="dataInsights"
          @generate-prediction="generatePrediction"
          @request-analysis="requestAnalysis"
        />
      </div>
    </div>

    <div class="row">
      <div class="col-md-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Raporlar ve Analizler</h5>
            <!-- Rapor Alma Dropdown -->
            <div class="dropdown">
                 <button class="btn btn-primary dropdown-toggle" type="button" id="reportsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                     <i class="bi bi-download"></i> Rapor Al
                 </button>
                 <ul class="dropdown-menu" aria-labelledby="reportsDropdown">
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('production')">Üretim Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('material')">Malzeme Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('delay')">Gecikme Raporu</a></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="downloadReport('efficiency')">Verimlilik Raporu</a></li>
                     <li><hr class="dropdown-divider"></li>
                     <li><a class="dropdown-item" href="#" @click.prevent="createCustomReport">Özel Rapor Oluştur</a></li>
                 </ul>
             </div>
          </div>
          <div class="card-body">
            <div class="row">
              <!-- Sol Sütun Grafikler -->
              <div class="col-md-6">
                <div class="card mb-4">
                  <div class="card-header">
                    <h6 class="mb-0">Üretim Verimliliği</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="efficiencyChart" height="250"></canvas> <!-- Chart.js bileşeni -->
                  </div>
                </div>
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">Gecikme Nedenleri</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="delayChart" height="250"></canvas> <!-- Chart.js bileşeni (doughnut/pie) -->
                  </div>
                </div>
              </div>
              <!-- Sağ Sütun Grafikler -->
              <div class="col-md-6">
                <div class="card mb-4">
                  <div class="card-header">
                    <h6 class="mb-0">Birim Bazlı Çalışma Süreleri</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="unitTimeChart" height="250"></canvas> <!-- Chart.js bileşeni (bar) -->
                  </div>
                </div>
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">Müşteri Bazlı Siparişler</h6>
                  </div>
                  <div class="card-body">
                    <canvas id="customerChart" height="250"></canvas> <!-- Chart.js bileşeni (bar/pie) -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Chart from 'chart.js/auto';
import MachineLearningPanel from '@/components/ai/MachineLearningPanel.vue';
// import apiService from '@/services/api-service';

// AI ve Makine Öğrenmesi veri ve işlemleri
const dataInsights = ref([
  {
    id: 'insight-001',
    title: 'Üretim Trendi Anomalisi',
    description: 'Son 30 günde üretim verimliliğinde %8\'lik bir düşüş tespit edildi.',
    severity: 'warning',
    date: '2025-04-08T14:30:00',
    category: 'efficiency',
    details: {
      metric: 'Verimlilik',
      previousValue: '87%',
      currentValue: '79%',
      trend: 'negative',
      possibleCauses: [
        'RM 36 CB üretim hattında planlı bakım',
        'Yeni personel eğitim süreci'
      ]
    }
  },
  {
    id: 'insight-002',
    title: 'Tedarik Zinciri Optimizasyon Fırsatı',
    description: 'Kesici mekanizması tedarik süreçlerinde %12\'lik bir optimizasyon potansiyeli bulundu.',
    severity: 'info',
    date: '2025-04-05T09:15:00',
    category: 'supply-chain',
    details: {
      metric: 'Teslimat Zamanı',
      currentValue: '45 gün',
      suggestedValue: '40 gün',
      trend: 'positive',
      recommendations: [
        'Tedarikçi A ile haftalık sipariş döngüsüne geçiş',
        'Minimum sipariş miktarını 20 birime çıkarma'
      ]
    }
  }
]);

let efficiencyChartInstance = null;
let delayChartInstance = null;
let unitTimeChartInstance = null;
let customerChartInstance = null;

onMounted(async () => {
    // Veri çekme ve grafik kurulumu
    // const reportData = await apiService.getAllReportData();
    // setupCharts(reportData);
    
    // Şimdilik mock veri kullanıyoruz
    setupMockCharts();
});

onBeforeUnmount(() => {
    // Grafik örneklerini temizle
    efficiencyChartInstance?.destroy();
    delayChartInstance?.destroy();
    unitTimeChartInstance?.destroy();
    customerChartInstance?.destroy();
});

const setupMockCharts = () => {
    setupEfficiencyChart();
    setupDelayChart();
    setupUnitTimeChart();
    setupCustomerChart();
};

// Örnek Grafik Kurulum Fonksiyonları
const setupEfficiencyChart = () => {
  const ctx = document.getElementById('efficiencyChart')?.getContext('2d');
  if (!ctx) return;
  efficiencyChartInstance = new Chart(ctx, {
      type: 'line',
      data: { 
        labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'], 
        datasets: [{ 
          label: 'Verimlilik (%)', 
          data: [75, 78, 80, 79, 82, 85], 
          borderColor: '#27ae60', 
          tension: 0.3,
          fill: {
            target: 'origin',
            above: 'rgba(39, 174, 96, 0.1)'
          }
        }] 
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Son 6 Ay Üretim Verimliliği'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 70,
            max: 100
          }
        }
      }
  });
};

const setupDelayChart = () => {
  const ctx = document.getElementById('delayChart')?.getContext('2d');
  if (!ctx) return;
  delayChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: { 
        labels: ['Malzeme Eksikliği', 'Planlama Hatası', 'Personel Yetersizliği', 'Diğer'], 
        datasets: [{ 
          data: [40, 25, 15, 20], 
          backgroundColor: ['#e74c3c', '#f39c12', '#3498db', '#95a5a6'] 
        }] 
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
  });
};

const setupUnitTimeChart = () => {
  const ctx = document.getElementById('unitTimeChart')?.getContext('2d');
  if (!ctx) return;
  unitTimeChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels: ['Elektrik Tasarım', 'Mekanik Tasarım', 'İç Montaj', 'Kablaj', 'Test', 'Genel Montaj'], 
        datasets: [{ 
          label: 'Ortalama Çalışma Süresi (saat)', 
          data: [120, 150, 180, 170, 90, 200],
          backgroundColor: '#3498db'
        }] 
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Birim Bazlı Haftalık Çalışma Süreleri'
          }
        }
      }
  });
};

const setupCustomerChart = () => {
  const ctx = document.getElementById('customerChart')?.getContext('2d');
  if (!ctx) return;
  customerChartInstance = new Chart(ctx, {
      type: 'pie',
      data: { 
        labels: ['Müşteri A', 'Müşteri B', 'Müşteri C', 'Müşteri D', 'Diğer'], 
        datasets: [{ 
          label: 'Sipariş Yüzdesi', 
          data: [30, 25, 15, 12, 18],
          backgroundColor: ['#27ae60', '#3498db', '#f39c12', '#9b59b6', '#95a5a6']
        }] 
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Müşteri Bazlı Sipariş Dağılımı'
          }
        }
      }
  });
};

const downloadReport = (reportType) => {
    console.log(`Downloading ${reportType} report...`);
    // apiService.downloadReport(reportType);
    alert(`${reportType} raporu indirme işlemi başlatıldı.`);
};

const createCustomReport = () => {
    console.log('Opening custom report creation interface...');
    // Özel rapor oluşturma modalını aç veya sayfaya yönlendir
    alert('Özel rapor oluşturma özelliği henüz aktif değil.');
};

// AI işlemleri
const generatePrediction = async (predictionType) => {
  console.log(`Generating ${predictionType} prediction...`);
  // Gerçek uygulamada: API çağrısı yapılacak
  alert(`${predictionType} için tahmin oluşturulması başlatıldı. Bu işlem biraz zaman alabilir.`);
};

const requestAnalysis = async (dataType) => {
  console.log(`Analyzing ${dataType}...`);
  // Gerçek uygulamada: API çağrısı yapılacak
  alert(`${dataType} için veri analizi başlatıldı.`);
};
</script>

<style scoped>
/* Raporlar görünümü özel stilleri */
.card-body canvas {
    max-width: 100%;
}

.reports-view .card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1rem;
}
</style>