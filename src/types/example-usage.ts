// 类型系统使用示例

import {
  UserProfile,
  HealthData,
  DietaryPreference,
  Recipe,
  Ingredient,
  NutritionInfo,
  MealPlan,
  HealthAnalysis,
  Recommendation,
  AgentResponse,
  AppState,
  AuthState,
  RecipeState,
  ApiResponse
} from './index';

// ============================================================================
// 用户相关类型使用示例
// ============================================================================

// 创建用户资料示例
const createUserProfileExample = (): UserProfile => {
  return {
    id: 'user_123',
    username: 'health_eater',
    email: 'user@example.com',
    displayName: '健康饮食者',
    createdAt: new Date(),
    updatedAt: new Date(),
    healthGoals: [
      {
        id: 'goal_001',
        type: 'weight_loss',
        targetValue: 65,
        currentValue: 75,
        targetDate: new Date('2024-12-31'),
        unit: 'kg',
        description: '减重10公斤',
        isActive: true
      }
    ]
  };
};

// 创建健康数据示例
const createHealthDataExample = (userId: string): HealthData => {
  return {
    id: 'health_data_001',
    userId,
    recordedAt: new Date(),
    weight: 75.5,
    height: 175,
    bmi: 24.5,
    bloodPressure: {
      systolic: 120,
      diastolic: 80
    },
    heartRate: 72,
    bloodSugar: 95,
    dailySteps: 8000,
    sleepDuration: 7.5,
    sleepQuality: 4
  };
};

// 创建饮食偏好示例
const createDietaryPreferenceExample = (userId: string): DietaryPreference => {
  return {
    id: 'diet_pref_001',
    userId,
    dietType: 'omnivore',
    allergies: [
      {
        id: 'allergy_001',
        name: '花生',
        severity: 'severe',
        notes: '避免所有含花生的食品'
      }
    ],
    dislikedFoods: ['苦瓜', '香菜'],
    preferredFoods: ['三文鱼', '西兰花', '燕麦'],
    restrictions: [
      {
        type: 'sodium',
        maxValue: 2300,
        unit: 'mg',
        reason: '高血压风险'
      }
    ],
    nutritionTargets: {
      calories: 2000,
      protein: {
        grams: 100,
        percentage: 20
      },
      carbohydrates: {
        grams: 250,
        percentage: 50
      },
      fat: {
        grams: 55,
        percentage: 30
      },
      fiber: 30,
      water: 2000
    }
  };
};

// ============================================================================
// 食谱相关类型使用示例
// ============================================================================

// 创建食材示例
const createIngredientsExample = (): Ingredient[] => {
  return [
    {
      id: 'ing_001',
      name: '鸡胸肉',
      amount: 200,
      unit: 'g',
      category: 'protein',
      optional: false,
      notes: '切成小块'
    },
    {
      id: 'ing_002',
      name: '西兰花',
      amount: 150,
      unit: 'g',
      category: 'vegetable',
      optional: false
    },
    {
      id: 'ing_003',
      name: '橄榄油',
      amount: 1,
      unit: 'tbsp',
      category: 'fat',
      optional: false
    }
  ];
};

// 创建营养信息示例
const createNutritionInfoExample = (): NutritionInfo => {
  return {
    calories: 350,
    protein: 30,
    carbohydrates: 15,
    fat: 20,
    fiber: 5,
    sugar: 3,
    sodium: 450,
    cholesterol: 85,
    vitamins: {
      a: 15,
      c: 80,
      b6: 20
    },
    minerals: {
      calcium: 10,
      iron: 15,
      potassium: 20
    },
    perServing: true
  };
};

// 创建食谱示例
const createRecipeExample = (): Recipe => {
  return {
    id: 'recipe_001',
    title: '香煎鸡胸肉配西兰花',
    description: '健康、高蛋白的快手晚餐选择',
    authorId: 'user_123',
    createdAt: new Date(),
    updatedAt: new Date(),
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    cuisine: '西式',
    category: 'dinner',
    tags: ['高蛋白', '低碳水', '快手菜'],
    ingredients: createIngredientsExample(),
    instructions: [
      '将鸡胸肉切成均匀的小块',
      '热锅倒入橄榄油',
      '放入鸡胸肉煎至两面金黄',
      '加入西兰花翻炒至熟',
      '加入盐和胡椒调味即可'
    ],
    nutritionInfo: createNutritionInfoExample(),
    images: ['https://example.com/image1.jpg'],
    compatibility: {
      vegetarian: false,
      vegan: false,
      glutenFree: true,
      dairyFree: true,
      keto: true,
      paleo: true,
      spicyLevel: 0
    },
    isPublic: true
  };
};

// 创建餐计划示例
const createMealPlanExample = (userId: string): MealPlan => {
  return {
    id: 'meal_plan_001',
    userId,
    title: '一周健康减脂餐计划',
    description: '针对减重目标的均衡餐单',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-07'),
    meals: [
      {
        id: 'meal_001',
        day: 1,
        type: 'breakfast',
        recipeId: 'recipe_breakfast_001',
        notes: '早餐前喝一杯温水'
      },
      {
        id: 'meal_002',
        day: 1,
        type: 'lunch',
        recipeId: 'recipe_lunch_001'
      },
      {
        id: 'meal_003',
        day: 1,
        type: 'dinner',
        recipeId: 'recipe_001' // 使用上面创建的食谱
      }
    ],
    generatedByAI: true,
    healthGoalId: 'goal_001',
    dietaryPreferenceId: 'diet_pref_001',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
};

// ============================================================================
// AI相关类型使用示例
// ============================================================================

// 创建健康分析示例
const createHealthAnalysisExample = (userId: string): HealthAnalysis => {
  return {
    id: 'analysis_001',
    userId,
    analyzedAt: new Date(),
    summary: '整体健康状况良好，但体重略高，建议适当调整饮食并增加有氧运动。',
    status: 'normal',
    metricsAnalysis: [
      {
        metric: '体重',
        value: 75.5,
        referenceRange: [65, 70],
        status: 'high',
        trend: 'stable',
        recommendations: [
          '控制每日热量摄入在2000卡路里以内',
          '每周进行至少150分钟中等强度有氧运动'
        ]
      },
      {
        metric: '血压',
        value: 120,
        referenceRange: [90, 120],
        status: 'normal',
        trend: 'improving',
        recommendations: ['继续保持健康的生活方式']
      }
    ],
    dietaryRecommendations: [
      '增加蔬菜和水果的摄入',
      '减少精制碳水化合物的摄入',
      '选择优质蛋白质来源'
    ],
    activityRecommendations: [
      '每周进行3-5次有氧运动',
      '加入力量训练以增加肌肉量',
      '每天保持8000-10000步'
    ],
    nextSteps: [
      '制定详细的运动计划',
      '记录每日饮食',
      '每月复查体重和血压'
    ],
    relatedDataIds: ['health_data_001', 'health_data_002']
  };
};

// 创建推荐建议示例
const createRecommendationExample = (): Recommendation<Recipe> => {
  const recipe = createRecipeExample();
  
  return {
    id: 'recommendation_001',
    type: 'recipe',
    targetId: 'recipe_001',
    title: '推荐食谱：香煎鸡胸肉配西兰花',
    description: '根据您的减重目标和高蛋白需求，为您推荐这道健康美味的食谱',
    content: recipe,
    relevanceScore: 0.95,
    reasons: [
      '符合您的高蛋白、低碳水饮食目标',
      '准备时间短，适合工作日晚餐',
      '不含您过敏的食材'
    ],
    createdAt: new Date(),
    context: {
      basedOnHealthGoals: ['goal_001'],
      basedOnDietaryPreferences: true,
      seasonal: false
    }
  };
};

// 创建AI响应示例
const createAgentResponseExample = (): AgentResponse => {
  return {
    id: 'agent_response_001',
    requestId: 'request_001',
    type: 'recommendation',
    content: '根据您的健康数据和饮食偏好，我为您推荐了一份为期一周的减脂餐计划。这份计划包含均衡的营养，同时控制热量摄入，帮助您实现减重目标。',
    structuredData: {
      recipes: [createRecipeExample()],
      mealPlans: [createMealPlanExample('user_123')],
      healthInsights: [
        '增加蛋白质摄入有助于保持饱腹感',
        '膳食纤维有助于消化健康',
        '控制晚餐时间在睡前3小时有助于睡眠质量'
      ]
    },
    confidenceScore: 0.9,
    generatedAt: new Date(),
    generationParams: {
      model: 'gpt-4',
      temperature: 0.7
    },
    references: [
      {
        type: 'study',
        title: '高蛋白饮食对减重的影响',
        url: 'https://example.com/study1'
      }
    ]
  };
};

// ============================================================================
// 应用状态类型使用示例
// ============================================================================

// 创建应用状态示例
const createAppStateExample = (): AppState => {
  return {
    isLoading: false,
    error: null,
    theme: 'light',
    language: 'zh-CN',
    notifications: [
      {
        id: 'notif_001',
        type: 'info',
        title: '新功能上线',
        message: '我们新增了AI食谱推荐功能，快来体验吧！',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ],
    version: '1.0.0',
    settings: {
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
        measurementSystem: 'metric',
        timeFormat: '24h',
        dateFormat: 'YYYY-MM-DD'
      }
    }
  };
};

// 创建认证状态示例
const createAuthStateExample = (): AuthState => {
  return {
    user: createUserProfileExample(),
    isAuthenticated: true,
    isLoading: false,
    error: null,
    authMethod: 'email',
    session: {
      token: 'jwt_token_here',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      refreshToken: 'refresh_token_here'
    }
  };
};

// 创建食谱状态示例
const createRecipeStateExample = (): RecipeState => {
  return {
    recipes: [createRecipeExample()],
    currentRecipe: createRecipeExample(),
    favorites: ['recipe_001', 'recipe_002'],
    recentViewed: ['recipe_001', 'recipe_003'],
    filters: {
      category: ['dinner'],
      difficulty: ['easy'],
      dietaryTags: ['gluten_free']
    },
    pagination: {
      page: 1,
      pageSize: 10,
      totalItems: 56,
      totalPages: 6,
      hasNext: true,
      hasPrevious: false
    },
    isLoading: false,
    error: null
  };
};

// 创建API响应示例
const createApiResponseExample = (): ApiResponse<Recipe[]> => {
  return {
    success: true,
    data: [createRecipeExample()],
    message: '食谱获取成功',
    meta: {
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 56,
        totalPages: 6,
        hasNext: true,
        hasPrevious: false
      }
    }
  };
};

// 导出示例函数，便于在其他地方使用
export {
  createUserProfileExample,
  createHealthDataExample,
  createDietaryPreferenceExample,
  createRecipeExample,
  createMealPlanExample,
  createHealthAnalysisExample,
  createRecommendationExample,
  createAgentResponseExample,
  createAppStateExample,
  createAuthStateExample,
  createRecipeStateExample,
  createApiResponseExample
};