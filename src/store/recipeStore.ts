import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Recipe, MealPlan, DietaryPreference } from '../types';
import type { HealthData } from '../types/health';
import { RecipeAgent } from '../agents/RecipeAgent';
import { supabase } from '../services/supabase';
import { useUserStore } from './userStore';

export const useRecipeStore = defineStore('recipe', () => {
  // 响应式状态
  const recommendedRecipes = ref<Recipe[]>([]);
  const favoriteRecipes = ref<string[]>([]); // 存储食谱ID
  const recipes = ref<Record<string, Recipe>>({}); // 缓存所有加载过的食谱
  const mealPlans = ref<MealPlan[]>([]);
  const currentMealPlan = ref<MealPlan | null>(null);
  const generatedHistory = ref<{
    id: string;
    type: 'recipe' | 'mealPlan';
    title: string;
    generatedAt: Date;
  }[]>([]);
  const dietaryPreferences = ref<DietaryPreference | null>(null);
  const isLoading = ref(false);
  const isGenerating = ref(false);
  const error = ref<string | null>(null);
  const generationRecords = ref<Array<{
    id: string;
    user_id: string;
    health_data_id?: number | null;
    analysis_id?: string | null;
    goal_text: string;
    meal_type?: string | null;
    count?: number | null;
    recipes: Recipe[];
    created_at?: string;
  }>>([]);
  
  // 过滤和分页状态
  const filters = ref<{
    category?: string[];
    difficulty?: string[];
    dietaryTags?: string[];
    timeRange?: [number, number]; // 准备时间范围
    caloriesRange?: [number, number];
    searchQuery?: string;
  }>({});
  
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  });

  // 计算属性
  const favoriteRecipeObjects = computed(() => {
    return favoriteRecipes.value
      .map(recipeId => recipes.value[recipeId])
      .filter(Boolean) as Recipe[];
  });

  const filteredRecipes = computed(() => {
    let result = recommendedRecipes.value;
    
    // 应用搜索查询
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase();
      result = result.filter(recipe => 
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // 应用分类过滤
    if (filters.value.category && filters.value.category.length > 0) {
      result = result.filter(recipe => 
        filters.value.category?.includes(recipe.category)
      );
    }
    
    // 应用难度过滤
    if (filters.value.difficulty && filters.value.difficulty.length > 0) {
      result = result.filter(recipe => 
        filters.value.difficulty?.includes(recipe.difficulty)
      );
    }
    
    // 应用饮食标签过滤
    if (filters.value.dietaryTags && filters.value.dietaryTags.length > 0) {
      result = result.filter(recipe => {
        return filters.value.dietaryTags?.some(tag => {
          const lowerTag = tag.toLowerCase();
          switch (lowerTag) {
            case 'vegetarian':
              return recipe.compatibility?.vegetarian || false;
            case 'vegan':
              return recipe.compatibility?.vegan || false;
            case 'gluten_free':
              return recipe.compatibility?.glutenFree || false;
            case 'dairy_free':
              return recipe.compatibility?.dairyFree || false;
            case 'keto':
              return recipe.compatibility?.keto || false;
            case 'paleo':
              return recipe.compatibility?.paleo || false;
            default:
              return recipe.tags.some(t => t.toLowerCase().includes(lowerTag));
          }
        });
      });
    }
    
    // 应用时间范围过滤
    if (filters.value.timeRange && filters.value.timeRange.length === 2) {
      const [min, max] = filters.value.timeRange;
      result = result.filter(recipe => {
        const totalTime = recipe.prepTime + recipe.cookTime;
        return totalTime >= min && totalTime <= max;
      });
    }
    
    // 应用卡路里范围过滤
    if (filters.value.caloriesRange && filters.value.caloriesRange.length === 2) {
      const [min, max] = filters.value.caloriesRange;
      result = result.filter(recipe => {
        const calories = recipe.nutritionInfo.calories;
        return calories >= min && calories <= max;
      });
    }
    
    // 更新总数
    pagination.value.total = result.length;
    
    // 分页
    const start = (pagination.value.page - 1) * pagination.value.pageSize;
    const end = start + pagination.value.pageSize;
    
    return result.slice(start, end);
  });

  const activeMealPlans = computed(() => {
    return mealPlans.value.filter(plan => plan.isActive);
  });

  const isFavorite = computed(() => {
    return (recipeId: string) => favoriteRecipes.value.includes(recipeId);
  });

  const getRecipeById = computed(() => {
    return (recipeId: string) => recipes.value[recipeId] || null;
  });

  const availableCategories = computed(() => {
    const categories = new Set<string>();
    recommendedRecipes.value.forEach(recipe => {
      categories.add(recipe.category);
    });
    return Array.from(categories);
  });

  const availableDifficulties = computed(() => {
    const difficulties = new Set<string>();
    recommendedRecipes.value.forEach(recipe => {
      difficulties.add(recipe.difficulty);
    });
    return Array.from(difficulties);
  });

  const recipeAgent = new RecipeAgent();

  const createHash = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return `${hash}`;
  };

  const buildContextSignature = (healthData?: HealthData, analysisSummary?: string) => {
    const payload = {
      bmi: healthData?.bmi ?? null,
      systolic: healthData?.systolic ?? null,
      diastolic: healthData?.diastolic ?? null,
      heartRate: healthData?.heartRate ?? null,
      stressLevel: healthData?.stressLevel ?? null,
      dietPreferences: healthData?.dietPreferences ?? [],
      allergies: healthData?.allergies ?? [],
      dietaryRestrictions: healthData?.dietaryRestrictions ?? [],
      analysisSummary: analysisSummary ?? null
    };
    return JSON.stringify(payload);
  };

  const buildCacheKey = (userId: string, goalText: string, mealType?: string, count?: number, contextSignature?: string) => {
    const raw = [userId, goalText, mealType || '', `${count || ''}`, contextSignature || ''].join('|');
    return `ai_recipe_${createHash(raw)}`;
  };

  const loadAiRecipeCache = () => {
    if (typeof window === 'undefined') return {};
    try {
      const cacheStr = localStorage.getItem('ai_recipe_cache');
      return cacheStr ? JSON.parse(cacheStr) : {};
    } catch (err) {
      return {};
    }
  };

  const persistAiRecipeCache = (cache: Record<string, { recipes: Recipe[]; createdAt: string }>) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('ai_recipe_cache', JSON.stringify(cache));
    } catch (err) {
      return;
    }
  };

  const applyGeneratedRecipes = (recipesList: Recipe[]) => {
    // Append new recipes instead of replacing
    const currentIds = new Set(recommendedRecipes.value.map(r => r.id));
    const newRecipes = recipesList.filter(r => !currentIds.has(r.id));
    
    recommendedRecipes.value = [...newRecipes, ...recommendedRecipes.value];
    
    // Update cache map
    recipesList.forEach(recipe => {
      recipes.value[recipe.id] = recipe;
    });
    persistRecipeCache();
  };

  const buildDefaultPreferences = (userId: string, healthData?: HealthData, goalText?: string): DietaryPreference => {
    return {
      id: `pref-${userId}`,
      userId,
      dietType: undefined,
      allergies: (healthData?.allergies || []).map((name, index) => ({
        id: `allergy-${index}`,
        name,
        severity: 'mild'
      })),
      dislikedFoods: [],
      preferredFoods: healthData?.dietPreferences || [],
      restrictions: [],
      nutritionTargets: undefined,
      specialRequests: goalText ? [goalText] : undefined
    };
  };

  // 动作
  const fetchRecommendedRecipes = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API获取推荐食谱
      // 模拟API调用
      // const response = await recipeService.getRecommendedRecipes(userId, options);
      // const recipesList = response.data;
      
      // 更新食谱缓存
      // recipesList.forEach(recipe => {
      //   recipes.value[recipe.id] = recipe;
      // });
      // recommendedRecipes.value = recipesList;
      
      // 持久化
      persistRecipeCache();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取推荐食谱失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchRecipeById = async (recipeId: string) => {
    try {
      // 先检查缓存
      if (recipes.value[recipeId]) {
        return recipes.value[recipeId];
      }
      
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API获取食谱详情
      // 模拟API调用
      // const response = await recipeService.getRecipeById(recipeId);
      // const recipe = response.data;
      
      // recipes.value[recipe.id] = recipe;
      // persistRecipeCache();
      
      // return recipe;
      return null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取食谱详情失败';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const toggleFavorite = async (recipeId: string) => {
    try {
      const isCurrentlyFavorite = favoriteRecipes.value.includes(recipeId);
      
      if (isCurrentlyFavorite) {
        favoriteRecipes.value = favoriteRecipes.value.filter(id => id !== recipeId);
      } else {
        favoriteRecipes.value.push(recipeId);
      }
      
      // 这里应该调用API更新收藏状态
      // 模拟API调用
      // await recipeService.updateFavoriteStatus(recipeId, !isCurrentlyFavorite);
      
      // 持久化
      persistFavorites();
      
      return !isCurrentlyFavorite;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新收藏状态失败';
      // 回滚操作
      const isCurrentlyFavorite = favoriteRecipes.value.includes(recipeId);
      if (!isCurrentlyFavorite) {
        favoriteRecipes.value.push(recipeId);
      } else {
        favoriteRecipes.value = favoriteRecipes.value.filter(id => id !== recipeId);
      }
      return isCurrentlyFavorite;
    }
  };

  const generateMealPlan = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API生成餐计划
      // 模拟API调用
      // const response = await recipeService.generateMealPlan(userId, preferences);
      // const newMealPlan = response.data;
      
      // mealPlans.value.unshift(newMealPlan);
      // currentMealPlan.value = newMealPlan;
      
      // 添加到生成历史
      // generatedHistory.value.unshift({
      //   id: newMealPlan.id,
      //   type: 'mealPlan',
      //   title: newMealPlan.title,
      //   generatedAt: new Date()
      // });
      
      // 持久化
      persistMealPlans();
      persistGeneratedHistory();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成餐计划失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchMealPlans = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API获取餐计划
      // 模拟API调用
      // const response = await recipeService.getMealPlans(userId);
      // mealPlans.value = response.data;
      
      // 设置当前激活的餐计划
      // const activePlan = mealPlans.value.find(plan => plan.isActive);
      // if (activePlan) {
      //   currentMealPlan.value = activePlan;
      // }
      
      // 持久化
      persistMealPlans();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取餐计划失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const setCurrentMealPlan = async (mealPlanId: string) => {
    try {
      const mealPlan = mealPlans.value.find(plan => plan.id === mealPlanId);
      if (!mealPlan) {
        throw new Error('餐计划不存在');
      }
      
      // 停用其他所有餐计划
      mealPlans.value.forEach(plan => {
        plan.isActive = plan.id === mealPlanId;
      });
      
      currentMealPlan.value = mealPlan;
      
      // 这里应该调用API更新状态
      // 模拟API调用
      // await recipeService.updateMealPlanStatus(mealPlanId, true);
      
      persistMealPlans();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '设置当前餐计划失败';
      return false;
    }
  };

  const updateDietaryPreferences = async (newPreferences: DietaryPreference) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API更新饮食偏好
      // 模拟API调用
      // const response = await recipeService.updateDietaryPreferences(newPreferences);
      dietaryPreferences.value = { ...newPreferences };
      
      // 持久化
      persistDietaryPreferences();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新饮食偏好失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const setFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
    pagination.value.page = 1; // 重置到第一页
  };

  const resetFilters = () => {
    filters.value = {};
    pagination.value.page = 1;
  };

  const setPage = (page: number) => {
    pagination.value.page = Math.max(1, page);
  };

  const generateRecipesFromAgent = async (payload: {
    goalText: string;
    mealType?: string;
    count?: number;
    healthData?: HealthData;
    healthDataId?: number | null;
    analysisId?: string | null;
    analysisSummary?: string;
  }) => {
    try {
      isGenerating.value = true;
      error.value = null;
      const userStore = useUserStore();
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }

      const contextSignature = buildContextSignature(payload.healthData, payload.analysisSummary);
      const cacheKey = buildCacheKey(userId, payload.goalText, payload.mealType, payload.count, contextSignature);
      const cache = loadAiRecipeCache();
      const cached = cache[cacheKey];

      if (cached?.recipes?.length) {
        applyGeneratedRecipes(cached.recipes);
        return true;
      }

      const preferences = dietaryPreferences.value || buildDefaultPreferences(userId, payload.healthData, payload.goalText);
      const result = await recipeAgent.process({
        preferences,
        healthData: payload.healthData as any, // Temporary fix for type compatibility
        mealType: payload.mealType,
        count: payload.count,
        goalText: payload.goalText,
        analysisSummary: payload.analysisSummary
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || '生成食谱失败');
      }

      const recipesList = result.data;

      // 1. 保存到缓存和本地状态
      applyGeneratedRecipes(recipesList);
      cache[cacheKey] = {
        recipes: recipesList,
        createdAt: new Date().toISOString()
      };
      persistAiRecipeCache(cache);

      // 2. 保存到数据库 (ai_recipe_generations 表)
      // 注意：recipes 字段是 JSONB 类型，直接存入对象数组
      const { data, error: insertError } = await supabase
        .from('ai_recipe_generations')
        .insert({
          user_id: userId,
          health_data_id: payload.healthDataId ?? null,
          analysis_id: payload.analysisId ?? null,
          goal_text: payload.goalText,
          meal_type: payload.mealType ?? null,
          count: payload.count ?? null,
          recipes: recipesList // Supabase 会自动处理 JSON 序列化
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('保存食谱生成记录失败:', insertError);
        // 不抛出错误，因为本地已经有了数据，只需记录日志
      } else if (data) {
        // 更新历史记录
        // 确保 recipes 是对象数组（处理可能的字符串格式）
        const parsedRecipes = typeof data.recipes === 'string' 
          ? JSON.parse(data.recipes) 
          : data.recipes;
          
        const newRecord = {
          ...data,
          recipes: parsedRecipes
        };
        
        generationRecords.value.unshift(newRecord);
        generatedHistory.value.unshift({
          id: newRecord.id,
          type: 'recipe',
          title: newRecord.goal_text,
          generatedAt: new Date(newRecord.created_at)
        });
        persistGeneratedHistory();
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成食谱失败';
      return false;
    } finally {
      isGenerating.value = false;
    }
  };

  const fetchGeneratedRecipes = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      const userStore = useUserStore();
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }

      const { data, error: fetchError } = await supabase
        .from('ai_recipe_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // 处理数据类型：recipes 可能是字符串或 JSON 对象
      generationRecords.value = (data || []).map(record => ({
        ...record,
        recipes: typeof record.recipes === 'string' ? JSON.parse(record.recipes) : record.recipes
      })) as any[];

      if (generationRecords.value.length > 0) {
        const latest = generationRecords.value[0];
        if (latest?.recipes?.length) {
          applyGeneratedRecipes(latest.recipes);
        }
      }

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取生成记录失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const applyGenerationRecord = (record: { recipes?: Recipe[] }) => {
    if (record?.recipes?.length) {
      applyGeneratedRecipes(record.recipes);
    }
  };

  // 本地存储相关
  const persistRecipeCache = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('recipe_cache', JSON.stringify(recipes.value));
      }
    } catch (err) {
      console.error('保存食谱缓存失败:', err);
    }
  };

  const persistFavorites = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('favorite_recipes', JSON.stringify(favoriteRecipes.value));
      }
    } catch (err) {
      console.error('保存收藏食谱失败:', err);
    }
  };

  const persistMealPlans = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('meal_plans', JSON.stringify(mealPlans.value));
      }
    } catch (err) {
      console.error('保存餐计划失败:', err);
    }
  };

  const persistDietaryPreferences = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dietary_preferences', JSON.stringify(dietaryPreferences.value));
      }
    } catch (err) {
      console.error('保存饮食偏好失败:', err);
    }
  };

  const persistGeneratedHistory = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('generated_history', JSON.stringify(generatedHistory.value));
      }
    } catch (err) {
      console.error('保存生成历史失败:', err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const recipeCacheStr = localStorage.getItem('recipe_cache');
        const favoritesStr = localStorage.getItem('favorite_recipes');
        const mealPlansStr = localStorage.getItem('meal_plans');
        const preferencesStr = localStorage.getItem('dietary_preferences');
        const historyStr = localStorage.getItem('generated_history');
        
        if (recipeCacheStr) recipes.value = JSON.parse(recipeCacheStr);
        if (favoritesStr) favoriteRecipes.value = JSON.parse(favoritesStr);
        if (mealPlansStr) mealPlans.value = JSON.parse(mealPlansStr);
        if (preferencesStr) dietaryPreferences.value = JSON.parse(preferencesStr);
        if (historyStr) generatedHistory.value = JSON.parse(historyStr);
        
        // 设置当前激活的餐计划
        const activePlan = mealPlans.value.find(plan => plan.isActive);
        if (activePlan) {
          currentMealPlan.value = activePlan;
        }
      }
    } catch (err) {
      console.error('从本地存储加载食谱数据失败:', err);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      // 1. Remove from recommendedRecipes
      recommendedRecipes.value = recommendedRecipes.value.filter(r => r.id !== recipeId);
      
      // 2. Remove from favorites if exists
      if (favoriteRecipes.value.includes(recipeId)) {
        favoriteRecipes.value = favoriteRecipes.value.filter(id => id !== recipeId);
        persistFavorites();
      }
      
      // 3. Remove from recipes cache (optional, maybe keep for history?)
      // delete recipes.value[recipeId];
      
      persistRecipeCache();
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除食谱失败';
      return false;
    }
  };

  const clearData = () => {
    recommendedRecipes.value = [];
    favoriteRecipes.value = [];
    recipes.value = {};
    mealPlans.value = [];
    currentMealPlan.value = null;
    generatedHistory.value = [];
    dietaryPreferences.value = null;
    generationRecords.value = [];
    isGenerating.value = false;
    error.value = null;
    filters.value = {};
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0
    };
    clearLocalStorage();
  };

  const clearLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('recipe_cache');
        localStorage.removeItem('favorite_recipes');
        localStorage.removeItem('meal_plans');
        localStorage.removeItem('dietary_preferences');
        localStorage.removeItem('generated_history');
        localStorage.removeItem('ai_recipe_cache');
      }
    } catch (err) {
      console.error('清除食谱数据本地存储失败:', err);
    }
  };

  return {
    // 状态
    recommendedRecipes,
    favoriteRecipes,
    recipes,
    mealPlans,
    currentMealPlan,
    generatedHistory,
    dietaryPreferences,
    generationRecords,
    isLoading,
    isGenerating,
    error,
    filters,
    pagination,
    
    // 计算属性
    favoriteRecipeObjects,
    filteredRecipes,
    activeMealPlans,
    isFavorite,
    getRecipeById,
    availableCategories,
    availableDifficulties,
    
    // 动作
    fetchRecommendedRecipes,
    fetchRecipeById,
    toggleFavorite,
    generateMealPlan,
    fetchMealPlans,
    setCurrentMealPlan,
    updateDietaryPreferences,
    setFilters,
    resetFilters,
    setPage,
    generateRecipesFromAgent,
    fetchGeneratedRecipes,
    applyGenerationRecord,
    loadFromLocalStorage,
    deleteRecipe,
    clearData
  };
});
