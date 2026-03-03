// 健康食谱应用 - TypeScript类型系统定义

// 会话数据类型
export interface SessionData {
  token: string;
  expiresAt: Date;
  refreshToken: string;
}

// 认证相关扩展
export interface UserProfile {
  role?: string;
}

// ============================================================================
// 1. 用户相关类型
// ============================================================================

/**
 * 用户基本资料类型
 */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
  // 健康目标相关
  healthGoals?: HealthGoal[];
  // 其他元数据
  metadata?: Record<string, any>;
}

/**
 * 健康目标类型
 */
export interface HealthGoal {
  id: string;
  type: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'energy_boost' | 'custom';
  targetValue?: number;
  currentValue?: number;
  targetDate?: Date;
  unit?: string;
  description?: string;
  isActive: boolean;
}

/**
 * 健康数据记录类型
 */
export interface HealthData {
  id: string;
  userId: string;
  recordedAt: Date;
  // 身体指标
  weight?: number; // 体重(kg)
  height?: number; // 身高(cm)
  bmi?: number; // BMI指数
  bloodPressure?: {
    systolic: number; // 收缩压
    diastolic: number; // 舒张压
  };
  heartRate?: number; // 心率(bpm)
  bloodSugar?: number; // 血糖(mg/dL)
  cholesterol?: {
    total?: number;
    ldl?: number;
    hdl?: number;
    triglycerides?: number;
  };
  // 活动数据
  dailySteps?: number;
  activityDuration?: number; // 分钟
  caloriesBurned?: number;
  // 睡眠数据
  sleepDuration?: number; // 小时
  sleepQuality?: number; // 1-5评分
  // 其他自定义指标
  customMetrics?: Record<string, number>;
}

/**
 * 饮食偏好类型
 */
export interface DietaryPreference {
  id: string;
  userId: string;
  // 饮食类型
  dietType?: 'vegetarian' | 'vegan' | 'omnivore' | 'pescatarian' | 'keto' | 'paleo' | 'mediterranean' | 'gluten_free' | 'dairy_free' | 'other';
  // 过敏原
  allergies: Array<{
    id: string;
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    notes?: string;
  }>;
  // 不喜欢的食物
  dislikedFoods: string[];
  // 喜欢的食物
  preferredFoods: string[];
  // 限制项
  restrictions: Array<{
    type: 'calorie' | 'protein' | 'carbohydrate' | 'fat' | 'sodium' | 'sugar' | 'custom';
    maxValue?: number;
    minValue?: number;
    unit: string;
    reason?: string;
  }>;
  // 营养目标
  nutritionTargets?: {
    calories?: number;
    protein?: {
      grams?: number;
      percentage?: number;
    };
    carbohydrates?: {
      grams?: number;
      percentage?: number;
    };
    fat?: {
      grams?: number;
      percentage?: number;
    };
    fiber?: number;
    water?: number; // 毫升
  };
  // 特殊要求
  specialRequests?: string[];
}

// ============================================================================
// 2. 食谱相关类型
// ============================================================================

/**
 * 食谱基本信息类型
 */
export interface Recipe {
  id: string;
  title: string;
  description: string;
  authorId?: string;
  createdAt: Date;
  updatedAt: Date;
  prepTime: number; // 分钟
  cookTime: number; // 分钟
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'other';
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  nutritionInfo: NutritionInfo;
  images?: string[]; // 图片URL数组
  ratings?: RecipeRating[];
  isPublic: boolean;
  // 兼容性标记
  compatibility?: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    keto: boolean;
    paleo: boolean;
    spicyLevel: 0 | 1 | 2 | 3 | 4 | 5;
  };
  // 统计信息
  stats?: {
    viewCount: number;
    saveCount: number;
    cookCount: number;
    avgRating: number;
  };
}

/**
 * 食材类型
 */
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: 'vegetable' | 'fruit' | 'protein' | 'grain' | 'dairy' | 'fat' | 'spice' | 'other';
  optional?: boolean;
  substitution?: string;
  notes?: string;
  // 营养信息（每单位）
  unitNutrition?: Partial<NutritionInfo>;
}

/**
 * 营养成分类型
 */
export interface NutritionInfo {
  calories: number;
  protein: number; // 克
  carbohydrates: number; // 克
  fat: number; // 克
  fiber: number; // 克
  sugar: number; // 克
  sodium: number; // 毫克
  cholesterol: number; // 毫克
  // 维生素
  vitamins?: {
    a?: number;
    c?: number;
    d?: number;
    e?: number;
    k?: number;
    b1?: number;
    b2?: number;
    b6?: number;
    b12?: number;
    folate?: number;
  };
  // 矿物质
  minerals?: {
    calcium?: number;
    iron?: number;
    potassium?: number;
    magnesium?: number;
    zinc?: number;
    phosphorus?: number;
    sodium?: number;
  };
  // 其他成分
  other?: Record<string, number>;
  // 每份量
  perServing: boolean;
}

/**
 * 食谱评分类型
 */
export interface RecipeRating {
  id: string;
  userId: string;
  recipeId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: Date;
}

/**
 * 餐计划类型
 */
export interface MealPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  meals: Array<{
    id: string;
    day: number; // 1-7
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
    recipeId?: string;
    customMeal?: string;
    notes?: string;
    completed?: boolean;
  }>;
  generatedByAI?: boolean;
  healthGoalId?: string;
  dietaryPreferenceId?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// ============================================================================
// 3. AI相关类型
// ============================================================================

/**
 * 健康分析结果类型
 */
export interface HealthAnalysis {
  id: string;
  userId: string;
  analyzedAt: Date;
  // 基础分析
  summary: string;
  status: 'normal' | 'needs_attention' | 'warning';
  // 具体指标分析
  metricsAnalysis: Array<{
    metric: string;
    value: number;
    referenceRange: [number, number];
    status: 'low' | 'normal' | 'high';
    trend?: 'improving' | 'stable' | 'worsening';
    recommendations: string[];
  }>;
  // 饮食建议
  dietaryRecommendations: string[];
  // 活动建议
  activityRecommendations: string[];
  // 下一步行动
  nextSteps: string[];
  // 相关数据引用
  relatedDataIds: string[];
}

/**
 * 推荐建议类型
 */
export interface Recommendation<T = any> {
  id: string;
  type: 'recipe' | 'meal_plan' | 'ingredient_substitution' | 'nutrition_tip' | 'activity' | 'custom';
  targetId?: string;
  title: string;
  description: string;
  content: T;
  relevanceScore: number; // 0-1
  reasons: string[];
  createdAt: Date;
  expiresAt?: Date;
  // 上下文信息
  context?: {
    basedOnHealthGoals?: string[];
    basedOnDietaryPreferences?: boolean;
    basedOnRecentActivities?: string[];
    seasonal?: boolean;
  };
}

/**
 * AI响应类型
 */
export interface AgentResponse {
  id: string;
  requestId: string;
  type: 'analysis' | 'recommendation' | 'explanation' | 'conversation' | 'error';
  content: string;
  // 结构化数据
  structuredData?: {
    recipes?: Recipe[];
    mealPlans?: MealPlan[];
    healthInsights?: string[];
    ingredients?: Ingredient[];
    // 其他结构化输出
  };
  confidenceScore?: number; // 0-1
  generatedAt: Date;
  // 生成参数
  generationParams?: Record<string, any>;
  // 引用资料
  references?: Array<{
    type: string;
    title: string;
    url?: string;
    snippet?: string;
  }>;
}

/**
 * AI请求类型
 */
export interface AgentRequest {
  id: string;
  userId: string;
  type: 'analysis_request' | 'recommendation_request' | 'question' | 'custom';
  content: string;
  // 上下文信息
  context?: {
    userProfileId?: string;
    healthDataIds?: string[];
    dietaryPreferenceId?: string;
    recipeIds?: string[];
    // 其他上下文
  };
  // 请求参数
  params?: Record<string, any>;
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// ============================================================================
// 4. 应用状态类型
// ============================================================================

/**
 * 应用全局状态类型
 */
export interface AppState {
  isLoading: boolean;
  error: AppError | null;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: Notification[];
  version: string;
  settings: AppSettings;
}

/**
 * 应用设置类型
 */
export interface AppSettings {
  notifications: {
    enabled: boolean;
    mealReminders: boolean;
    healthInsights: boolean;
    newRecipes: boolean;
  };
  privacy: {
    shareUsageData: boolean;
    shareHealthData: boolean;
  };
  preferences: {
    measurementSystem: 'metric' | 'imperial';
    timeFormat: '24h' | '12h';
    dateFormat: string;
  };
}

/**
 * 应用错误类型
 */
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * 通知类型
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  title: string;
  message: string;
  read: boolean;
  action?: {
    label: string;
    url?: string;
    callback?: () => void;
  };
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * 认证状态类型
 */
export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
  authMethod: 'email' | 'google' | 'facebook' | 'apple' | 'anonymous' | null;
  session: {
    token: string | null;
    expiresAt: Date | null;
    refreshToken: string | null;
  };
}

/**
 * 食谱状态类型
 */
export interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  favorites: string[]; // 食谱ID数组
  recentViewed: string[]; // 食谱ID数组
  filters: RecipeFilters;
  pagination: Pagination;
  isLoading: boolean;
  error: AppError | null;
}

/**
 * 食谱过滤条件类型
 */
export interface RecipeFilters {
  category?: string[];
  cuisine?: string[];
  difficulty?: string[];
  prepTime?: {
    min?: number;
    max?: number;
  };
  cookTime?: {
    min?: number;
    max?: number;
  };
  calories?: {
    min?: number;
    max?: number;
  };
  dietaryTags?: string[];
  ingredients?: string[];
  excludeIngredients?: string[];
  searchQuery?: string;
}

/**
 * 分页信息类型
 */
export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// 通用工具类型
// ============================================================================

/**
 * 带ID的基础类型
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 通用响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  message?: string;
  meta?: {
    pagination?: Pagination;
    [key: string]: any;
  };
}

/**
 * 数据加载状态
 */
export type LoadingStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

/**
 * 通用CRUD操作参数类型
 */
export interface CrudOptions {
  skipCache?: boolean;
  invalidateCache?: boolean;
  optimisticUpdate?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 通用搜索参数类型
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pagination?: {
    page: number;
    pageSize: number;
  };
}