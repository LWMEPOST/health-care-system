import { useUserStore } from './userStore';
import { useHealthStore } from './healthStore';
import { useRecipeStore } from './recipeStore';
import { useUiStore } from './uiStore';
import type { SessionData } from '../types';

// 导出所有store
export {
  useUserStore,
  useHealthStore,
  useRecipeStore,
  useUiStore
};

// 为了向后兼容性，提供useSystemStore接口，适配到useUiStore
export const useSystemStore = () => {
  const uiStore = useUiStore();
  
  return {
    ...uiStore,
    clearError: () => uiStore.setError(null)
  };
};

// 导出类型
export type {
  SessionData
};

// 初始化所有store的辅助函数
export const initializeStores = () => {
  const uiStore = useUiStore();
  const userStore = useUserStore();
  const healthStore = useHealthStore();
  const recipeStore = useRecipeStore();
  
  // 从本地存储加载数据
  uiStore.loadFromLocalStorage();
  userStore.loadFromLocalStorage();
  healthStore.loadFromLocalStorage();
  recipeStore.loadFromLocalStorage();
  
  // 初始化UI事件监听
  uiStore.initResizeListener();
  uiStore.initThemeListener();
  
  return {
    uiStore,
    userStore,
    healthStore,
    recipeStore
  };
};