import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Notification } from '../types';

export const useUiStore = defineStore('ui', () => {
  // 响应式状态
  const isLoading = ref(false);
  const loadingMessage = ref<string | null>(null);
  const error = ref<string | null>(null);
  const success = ref<string | null>(null);
  const theme = ref<'light' | 'dark' | 'system'>('light');
  const language = ref<'zh-CN' | 'en-US'>('zh-CN');
  const notifications = ref<Notification[]>([]);
  const sidebarCollapsed = ref(false);
  const mobileMenuOpen = ref(false);
  const screenSize = ref<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const isMobile = ref(false);
  const version = ref('1.0.0');
  
  // 设置状态
  const settings = ref({
    notifications: {
      enabled: true,
      mealReminders: true,
      healthInsights: true,
      newRecipes: true
    },
    privacy: {
      shareUsageData: true,
      shareHealthData: false
    },
    preferences: {
      measurementSystem: 'metric' as 'metric' | 'imperial',
      timeFormat: '24h' as '12h' | '24h',
      dateFormat: 'YYYY-MM-DD'
    }
  });

  // 计算属性
  const effectiveTheme = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme.value;
  });

  const unreadNotificationsCount = computed(() => {
    return notifications.value.filter(notification => !notification.read).length;
  });

  const getActiveNotifications = computed(() => {
    const now = new Date();
    return notifications.value.filter(notification => {
      return !notification.expiresAt || new Date(notification.expiresAt) > now;
    });
  });

  const isLargeScreen = computed(() => {
    return ['lg', 'xl'].includes(screenSize.value);
  });

  const isSmallScreen = computed(() => {
    return ['xs', 'sm'].includes(screenSize.value);
  });

  // 动作
  const setLoading = (status: boolean, message?: string) => {
    isLoading.value = status;
    if (message) {
      loadingMessage.value = message;
    } else if (!status) {
      loadingMessage.value = null;
    }
  };

  const setError = (message: string | null) => {
    error.value = message;
    // 自动清除错误信息
    if (message) {
      setTimeout(() => {
        error.value = null;
      }, 5000);
    }
  };

  const setSuccess = (message: string | null) => {
    success.value = message;
    // 自动清除成功信息
    if (message) {
      setTimeout(() => {
        success.value = null;
      }, 3000);
    }
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    theme.value = newTheme;
    applyTheme();
    persistSettings();
  };

  const toggleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme.value);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const setLanguage = (newLanguage: 'zh-CN' | 'en-US') => {
    language.value = newLanguage;
    persistSettings();
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    notifications.value.unshift(newNotification);
    
    // 限制通知数量
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(0, 50);
    }
    
    persistNotifications();
    return newNotification.id;
  };

  const markNotificationAsRead = (notificationId: string) => {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      persistNotifications();
    }
  };

  const deleteNotification = (notificationId: string) => {
    notifications.value = notifications.value.filter(n => n.id !== notificationId);
    persistNotifications();
  };

  const markAllNotificationsAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true;
    });
    persistNotifications();
  };

  const clearAllNotifications = () => {
    notifications.value = [];
    persistNotifications();
  };

  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    sidebarCollapsed.value = collapsed;
  };

  const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  };

  const setMobileMenuOpen = (open: boolean) => {
    mobileMenuOpen.value = open;
  };

  const updateScreenSize = () => {
    const width = window.innerWidth;
    
    if (width < 576) {
      screenSize.value = 'xs';
      isMobile.value = true;
    } else if (width < 768) {
      screenSize.value = 'sm';
      isMobile.value = true;
    } else if (width < 992) {
      screenSize.value = 'md';
      isMobile.value = false;
    } else if (width < 1200) {
      screenSize.value = 'lg';
      isMobile.value = false;
    } else {
      screenSize.value = 'xl';
      isMobile.value = false;
    }
    
    // 移动设备自动收起侧边栏
    if (isMobile.value) {
      sidebarCollapsed.value = true;
    }
  };

  const updateNotificationSettings = (notificationSettings: Partial<typeof settings.value.notifications>) => {
    settings.value.notifications = {
      ...settings.value.notifications,
      ...notificationSettings
    };
    persistSettings();
  };

  const updatePrivacySettings = (privacySettings: Partial<typeof settings.value.privacy>) => {
    settings.value.privacy = {
      ...settings.value.privacy,
      ...privacySettings
    };
    persistSettings();
  };

  const updatePreferences = (preferences: Partial<typeof settings.value.preferences>) => {
    settings.value.preferences = {
      ...settings.value.preferences,
      ...preferences
    };
    persistSettings();
  };

  // 辅助方法
  const applyTheme = () => {
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark');
    html.classList.add(`theme-${effectiveTheme.value}`);
  };

  // 本地存储相关
  const persistSettings = () => {
    try {
      if (typeof window !== 'undefined') {
        const settingsToSave = {
          theme: theme.value,
          language: language.value,
          settings: settings.value
        };
        localStorage.setItem('ui_settings', JSON.stringify(settingsToSave));
      }
    } catch (err) {
      console.error('保存UI设置失败:', err);
    }
  };

  const persistNotifications = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('notifications', JSON.stringify(notifications.value));
      }
    } catch (err) {
      console.error('保存通知失败:', err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const settingsStr = localStorage.getItem('ui_settings');
        const notificationsStr = localStorage.getItem('notifications');
        
        if (settingsStr) {
          const savedSettings = JSON.parse(settingsStr);
          if (savedSettings.theme) theme.value = savedSettings.theme;
          if (savedSettings.language) language.value = savedSettings.language;
          if (savedSettings.settings) settings.value = savedSettings.settings;
        }
        
        if (notificationsStr) {
          notifications.value = JSON.parse(notificationsStr);
        }
        
        // 应用主题
        applyTheme();
        
        // 清除过期通知
        const now = new Date();
        notifications.value = notifications.value.filter(notification => {
          return !notification.expiresAt || new Date(notification.expiresAt) > now;
        });
      }
    } catch (err) {
      console.error('从本地存储加载UI设置失败:', err);
    }
  };

  const clearData = () => {
    error.value = null;
    success.value = null;
    notifications.value = [];
    loadingMessage.value = null;
    isLoading.value = false;
    clearLocalStorage();
  };

  const clearLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ui_settings');
        localStorage.removeItem('notifications');
      }
    } catch (err) {
      console.error('清除UI数据本地存储失败:', err);
    }
  };

  // 初始化事件监听
  const initResizeListener = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateScreenSize);
      // 初始调用一次
      updateScreenSize();
    }
  };

  const removeResizeListener = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateScreenSize);
    }
  };

  const initThemeListener = () => {
    if (typeof window !== 'undefined' && theme.value === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      return mediaQuery;
    }
    return null;
  };

  const removeThemeListener = (mediaQuery: MediaQueryList | null) => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', applyTheme);
    }
  };

  return {
    // 状态
    isLoading,
    loadingMessage,
    error,
    success,
    theme,
    language,
    notifications,
    sidebarCollapsed,
    mobileMenuOpen,
    screenSize,
    isMobile,
    version,
    settings,
    
    // 计算属性
    effectiveTheme,
    unreadNotificationsCount,
    getActiveNotifications,
    isLargeScreen,
    isSmallScreen,
    
    // 动作
    setLoading,
    setError,
    setSuccess,
    setTheme,
    toggleTheme,
    setLanguage,
    addNotification,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    clearAllNotifications,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileMenu,
    setMobileMenuOpen,
    updateScreenSize,
    updateNotificationSettings,
    updatePrivacySettings,
    updatePreferences,
    loadFromLocalStorage,
    clearData,
    
    // 初始化方法
    initResizeListener,
    removeResizeListener,
    initThemeListener,
    removeThemeListener
  };
});