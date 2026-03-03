import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '../store/userStore';

// 导入视图组件
const Home = () => import('../views/HomeView.vue');
const Auth = () => import('../views/AuthView.vue');
const Profile = () => import('../views/ProfileView.vue');
const Recipes = () => import('../views/Recipes.vue');
const HealthDashboard = () => import('../views/HealthDashboard.vue');
const Settings = () => import('../views/NotFoundView.vue');
const NotFound = () => import('../views/NotFoundView.vue');
const RecipeDetail = () => import('../views/RecipeDetail.vue');
const MealPlanner = () => import('../views/NotFoundView.vue');
const ProgressTracker = () => import('../views/NotFoundView.vue');
const AdminPanel = () => import('../views/NotFoundView.vue');
const SmartAssistant = () => import('../views/SmartAssistant.vue');
const DailyCheckIn = () => import('../views/DailyCheckIn.vue');

// 定义路由
const routes: Array<any> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: Auth,
    meta: {
      title: '登录/注册',
      requiresAuth: false,
      guestOnly: true // 只允许未登录用户访问
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: '个人资料',
      requiresAuth: true
    }
  },
  {
    path: '/recipes',
    name: 'Recipes',
    component: Recipes,
    meta: {
      title: '食谱库',
      requiresAuth: true
    }
  },
  {
    path: '/recipes/:id',
    name: 'RecipeDetail',
    component: RecipeDetail,
    meta: {
      title: '食谱详情',
      requiresAuth: true
    },
    props: true
  },
  {
    path: '/health',
    name: 'HealthDashboard',
    component: HealthDashboard,
    meta: {
      title: '健康数据',
      requiresAuth: true
    }
  },
  {
    path: '/meal-planner',
    name: 'MealPlanner',
    component: MealPlanner,
    meta: {
      title: '膳食计划',
      requiresAuth: true
    }
  },
  {
    path: '/progress',
    name: 'ProgressTracker',
    component: ProgressTracker,
    meta: {
      title: '进度跟踪',
      requiresAuth: true
    }
  },
  {
    path: '/assistant',
    name: 'SmartAssistant',
    component: SmartAssistant,
    meta: {
      title: '智能健康管家',
      requiresAuth: true
    }
  },
  {
    path: '/check-in',
    name: 'DailyCheckIn',
    component: DailyCheckIn,
    meta: {
      title: '每日打卡',
      requiresAuth: true
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      title: '设置',
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'AdminPanel',
    component: AdminPanel,
    meta: {
      title: '管理员面板',
      requiresAuth: true,
      requiresAdmin: true // 需要管理员权限
    }
  },
  // 捕获所有未匹配的路由
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 会话超时管理
class SessionManager {
  private static instance: SessionManager;
  private sessionTimeout: number;
  private timeoutId: number | null = null;

  private constructor() {
    // 默认超时时间为30分钟
    this.sessionTimeout = 30 * 60 * 1000;
    this.setupActivityTracking();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // 更新最后活动时间
  public updateActivity(): void {
    this.resetTimeout();
  }

  // 设置会话超时
  public setTimeout(timeoutMs: number): void {
    this.sessionTimeout = timeoutMs;
    this.resetTimeout();
  }

  // 重置超时计时器
  private resetTimeout(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      this.handleSessionTimeout();
    }, this.sessionTimeout);
  }

  // 处理会话超时
  private async handleSessionTimeout(): Promise<void> {
    console.log('会话已超时');
    const userStore = useUserStore();
    
    if (userStore.isLoggedIn) {
      try {
        await userStore.logout();
        console.warn('您的会话已超时，请重新登录');
        router.push('/auth');
      } catch (error) {
        console.error('会话超时处理失败:', error);
      }
    }
  }

  // 设置活动跟踪
  private setupActivityTracking(): void {
    // 监听用户活动事件
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(
        event,
        () => this.updateActivity(),
        { passive: true }
      );
    });
  }

  // 清除超时计时器
  public clearTimeout(): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// 路由守卫
router.beforeEach(
  async (to: any, _from: any, next: any) => {
    // 更新页面标题
    document.title = `${to.meta.title || '健康森林'} - 健康森林应用`;

    const userStore = useUserStore();
    const sessionManager = SessionManager.getInstance();

    // 1. 确保用户状态已初始化（从本地或 Supabase 恢复）
    if (!userStore.isInitialized) {
      await userStore.initialize();
    }

    // 2. 检查是否是 guestOnly 路由（如登录页）
    if (to.meta.guestOnly && userStore.isLoggedIn) {
      return next({ name: 'Home' });
    }

    // 3. 检查是否需要认证
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      console.warn('请先登录以访问此页面');
      return next({ name: 'Auth', query: { redirect: to.fullPath } });
    }

    // 4. 检查管理员权限
    if (to.meta.requiresAdmin && !userStore.hasPermission('admin')) {
      console.error('您没有权限访问该页面');
      return next({ name: 'Home' });
    }

    // 5. 更新活动时间并继续
    sessionManager.updateActivity();
    next();
  }
);

// 全局错误处理
router.onError((error: any) => {
  console.error('路由错误:', error);
  console.error('页面加载失败，请重试');
});

// 路由完成后，添加XSS保护措施
router.afterEach(() => {
  // 更新document的X-XSS-Protection头
  if (document.querySelector('meta[http-equiv="X-XSS-Protection"]')) {
    const meta = document.querySelector('meta[http-equiv="X-XSS-Protection"]') as HTMLMetaElement;
    meta.content = '1; mode=block';
  } else {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = '1; mode=block';
    document.head.appendChild(meta);
  }
});

export default router;