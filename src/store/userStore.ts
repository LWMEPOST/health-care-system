import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserProfile, SessionData } from '../types';
import { db } from '../services/supabase';

import { useHealthStore } from './healthStore';

export const useUserStore = defineStore('user', () => {
  // 响应式状态
  const isLoggedIn = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const userProfile = ref<UserProfile | null>(null);
  const session = ref<SessionData | null>(null);
  const permissions = ref<string[]>([]);

  // 计算属性
  const isAuthenticated = computed(() => isLoggedIn.value && !!userProfile.value?.id);
  const userRole = computed(() => userProfile.value?.role || 'user');
  const hasPermission = computed(() => {
    return (requiredPermission: string) => permissions.value.includes(requiredPermission);
  });
  const displayName = computed(() => userProfile.value?.displayName || userProfile.value?.username || '用户');
  const sessionExpiry = computed(() => session.value?.expiresAt || null);
  const isSessionExpired = computed(() => {
    if (!sessionExpiry.value) return true;
    return new Date(sessionExpiry.value) < new Date();
  });

  const isInitialized = ref(false);

  // 动作
  const initialize = async () => {
    if (isInitialized.value) return;
    
    try {
      isLoading.value = true;
      // 1. 先尝试从本地存储加载
      loadFromLocalStorage();
      
      // 2. 无论本地存储如何，都从 Supabase 获取最新会话以验证
      const { supabase } = await import('../services/supabase');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        const user = currentSession.user;
        userProfile.value = {
          id: user.id,
          username: user.email?.split('@')[0] || '',
          email: user.email || '',
          displayName: user.user_metadata?.name || '',
          avatarUrl: user.user_metadata?.avatar_url || '',
          createdAt: new Date(user.created_at),
          updatedAt: new Date()
        };
        session.value = {
          token: currentSession.access_token,
          refreshToken: currentSession.refresh_token || '',
          expiresAt: new Date(Date.now() + (currentSession.expires_in || 3600) * 1000)
        };
        isLoggedIn.value = true;
        persistToLocalStorage();
      } else {
        // 如果 Supabase 说没登录，确保本地也清空
        logout();
      }
    } catch (err) {
      console.error('初始化用户状态失败:', err);
    } finally {
      isInitialized.value = true;
      isLoading.value = false;
    }
  };

  const login = async (authData: {
    user: UserProfile;
    session: SessionData;
    permissions: string[];
  }) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 设置用户信息和会话
      userProfile.value = authData.user;
      session.value = authData.session;
      permissions.value = authData.permissions;
      isLoggedIn.value = true;
      
      // 持久化到本地存储
      persistToLocalStorage();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登录失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    try {
      isLoading.value = true;
      
      // 清除状态
      userProfile.value = null;
      session.value = null;
      permissions.value = [];
      isLoggedIn.value = false;
      
      // 清除本地存储
      clearLocalStorage();
      
      // 清除健康数据
      const healthStore = useHealthStore();
      healthStore.clearHealthData();
    } catch (err) {
      error.value = err instanceof Error ? err.message : '登出失败';
    } finally {
      isLoading.value = false;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      if (userProfile.value) {
        // 更新本地状态
        userProfile.value = {
          ...userProfile.value,
          ...updates,
          updatedAt: new Date()
        };
        
        // 同步到数据库
        const userId = userProfile.value?.id;
        const dbUpdates = {
          email: userProfile.value.email,
          username: userProfile.value.username,
          display_name: userProfile.value.displayName,
          avatar_url: userProfile.value.avatarUrl,
          metadata: userProfile.value.metadata,
          updated_at: new Date()
        };
        
        try {
          // 更新应用数据库中的用户表
          if (userId) {
            const dbResult = await db.update('users', userId, dbUpdates);
            console.log('数据库更新结果:', dbResult);
          }
        } catch (dbError) {
          console.error('数据库更新失败:', dbError);
          // 数据库更新失败不影响本地更新，只记录错误
        }
        
        // 更新本地存储
        persistToLocalStorage();
        return true;
      }
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新用户信息失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const refreshSession = async (newSession: SessionData) => {
    try {
      session.value = newSession;
      persistToLocalStorage();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新会话失败';
      return false;
    }
  };

  const checkAndRefreshSession = async () => {
    if (isSessionExpired.value && isAuthenticated.value) {
      // 这里可以调用API刷新会话
      // 暂时返回false
      return false;
    }
    return true;
  };

  // 本地存储相关
  const persistToLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_profile', JSON.stringify(userProfile.value));
        localStorage.setItem('user_session', JSON.stringify(session.value));
        localStorage.setItem('user_permissions', JSON.stringify(permissions.value));
        localStorage.setItem('is_logged_in', String(isLoggedIn.value));
      }
    } catch (err) {
      console.error('保存到本地存储失败:', err);
    }
  };

  const clearLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_profile');
        localStorage.removeItem('user_session');
        localStorage.removeItem('user_permissions');
        localStorage.removeItem('is_logged_in');
      }
    } catch (err) {
      console.error('清除本地存储失败:', err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const profileStr = localStorage.getItem('user_profile');
        const sessionStr = localStorage.getItem('user_session');
        const permissionsStr = localStorage.getItem('user_permissions');
        const isLoggedInStr = localStorage.getItem('is_logged_in');
        
        if (profileStr && sessionStr && permissionsStr && isLoggedInStr) {
          userProfile.value = JSON.parse(profileStr);
          session.value = JSON.parse(sessionStr);
          permissions.value = JSON.parse(permissionsStr);
          isLoggedIn.value = isLoggedInStr === 'true';
          
          // 检查会话是否过期
          if (isSessionExpired.value) {
            logout();
          }
        }
      }
    } catch (err) {
      console.error('从本地存储加载失败:', err);
      logout();
    }
  };

  // 初始化时从本地存储加载
  if (typeof window !== 'undefined') {
    loadFromLocalStorage();
  }

  return {
    // 状态
    isLoggedIn,
    isLoading,
    isInitialized,
    error,
    userProfile,
    session,
    permissions,
    
    // 计算属性
    isAuthenticated,
    userRole,
    hasPermission,
    displayName,
    sessionExpiry,
    isSessionExpired,
    
    // 动作
    initialize,
    login,
    logout,
    updateUserProfile,
    refreshSession,
    checkAndRefreshSession,
    loadFromLocalStorage
  };
});
