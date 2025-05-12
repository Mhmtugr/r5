import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

// Layouts
// import DefaultLayout from '@/layouts/DefaultLayout.vue'; // DefaultLayout zaten App.vue içinde ele alınıyor
// import BlankLayout from '@/layouts/BlankLayout.vue'; // BlankLayout zaten App.vue içinde ele alınıyor

// Views
const LoginView = () => import('@/modules/auth/views/LoginView.vue');
const Dashboard = () => import('@/modules/dashboard/views/DashboardHome.vue');
const OrderListView = () => import('@/modules/orders/views/OrderListView.vue');
const OrderDetailView = () => import('@/modules/orders/views/OrderDetailView.vue');
const OrderCreationView = () => import('@/modules/orders/views/OrderCreationView.vue');
const ProductionOverview = () => import('@/modules/production/views/ProductionOverview.vue');
const PlanningDashboard = () => import('@/modules/planning/views/PlanningDashboard.vue');
const TechnicalView = () => import('@/modules/technical/views/TechnicalView.vue'); // Corrected path and component
const SettingsGeneral = () => import('@/modules/settings/views/SettingsGeneral.vue');
const NotFound = () => import('@/components/NotFound.vue');
const InventoryList = () => import('@/modules/inventory/views/InventoryList.vue');
const MaterialsView = () => import('@/modules/inventory/views/MaterialsView.vue');
const StockView = () => import('@/modules/inventory/views/StockView.vue');
const DelayedMaterialsView = () => import('@/modules/inventory/views/DelayedMaterialsView.vue');
const PurchasingView = () => import('@/modules/purchasing/views/PurchasingView.vue');
const SuppliersView = () => import('@/modules/purchasing/views/SuppliersView.vue');
const ReportsView = () => import('@/modules/reports/views/ReportsView.vue'); // Corrected path and component
const DashboardDelayedOrders = () => import('@/modules/dashboard/views/DashboardDelayedOrders.vue');

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { layout: 'blank', requiresAuth: false },
  },  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard/delayed-orders',
    name: 'DelayedOrders',
    component: DashboardDelayedOrders,
    meta: { requiresAuth: true },
  },{
    path: '/orders',
    name: 'Orders',
    component: OrderListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/create',
    name: 'OrderCreate',
    component: OrderCreationView,
    meta: { requiresAuth: true },
  },
  {
    path: '/orders/:id',
    name: 'OrderDetail',
    component: OrderDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory',
    name: 'Inventory',
    component: InventoryList,
    meta: { requiresAuth: true },
  },  {
    path: '/materials',
    name: 'Materials',
    component: MaterialsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory/materials',
    name: 'InventoryMaterials',
    component: MaterialsView,
    meta: { requiresAuth: true },
  },  {
    path: '/stock',
    name: 'Stock',
    component: StockView,
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory/stock',
    name: 'InventoryStock',
    component: StockView,
    meta: { requiresAuth: true },
  },
  {
    path: '/inventory/delayed-materials',
    name: 'DelayedMaterials',
    component: DelayedMaterialsView,
    meta: { requiresAuth: true },
  },{
    path: '/reports',
    name: 'Reports',
    component: ReportsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/orders',
    name: 'OrderReports',
    component: ReportsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/reports/production',
    name: 'ProductionReports',
    component: ReportsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/production',
    name: 'Production',
    component: ProductionOverview,
    meta: { requiresAuth: true },
  },
  {
    path: '/production/planning',
    name: 'ProductionPlanning',
    component: ProductionOverview,
    meta: { requiresAuth: true },
  },
  {
    path: '/production/monitoring',
    name: 'ProductionMonitoring',
    component: ProductionOverview,
    meta: { requiresAuth: true },
  },
  {
    path: '/planning',
    name: 'Planning',
    component: PlanningDashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/technical',
    name: 'Technical',
    component: TechnicalView,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsGeneral,
    meta: { requiresAuth: true },
  },  {
    path: '/purchasing',
    name: 'Purchasing',
    component: PurchasingView,
    meta: { requiresAuth: true },
  },
  {
    path: '/purchasing/suppliers',
    name: 'Suppliers',
    component: SuppliersView,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { layout: 'blank', requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // Vite için BASE_URL kullanımı
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  // Pinia store hazır olmadan authStore.user veya isAuthenticated kullanılamaz.
  // Bu yüzden önce initialize çağrılmalı veya store'un initialize olması beklenmeli.
  // App.vue içinde zaten bir session kontrolü var, bu yüzden burada tekrar etmeye gerek olmayabilir
  // ancak emin olmak için bir kontrol ekleyebiliriz.

  // Eğer store henüz initialize olmadıysa ve user bilgisi yoksa, initialize et
  if (!authStore.user && authStore.sessionInitialized === false) {
      await authStore.initialize();
  }
  
  const isAuthenticated = authStore.isAuthenticated;
  const requiresAuth = to.meta.requiresAuth !== false; // Varsayılan olarak true

  if (requiresAuth && !isAuthenticated) {
    if (to.name !== 'Login') {
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else if (isAuthenticated && to.name === 'Login') {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
