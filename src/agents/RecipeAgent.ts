import { BaseAgent, AgentResponse } from './BaseAgent';
import { DietaryPreference, Recipe } from '../types';
import type { HealthData } from '../types/health';

export interface RecipeRecommendationRequest {
  preferences: DietaryPreference;
  healthData?: HealthData;
  mealType?: string; // breakfast, lunch, dinner, snack
  count?: number;
  goalText?: string;
  analysisSummary?: string;
}

export class RecipeAgent extends BaseAgent {
  constructor() {
    super(
      'RecipeAgent',
      `你是一位专业的营养师。请根据用户需求推荐健康食谱。
      
      请以纯JSON数组格式返回推荐食谱列表。每个食谱对象必须严格包含以下字段：
      - title: (string) 食谱名称
      - description: (string) 简短描述（少于30字）
      - calories: (number) 热量（kcal）
      - protein: (number) 蛋白质（g）
      - carbs: (number) 碳水化合物（g）
      - fat: (number) 脂肪（g）
      - prepTime: (number) 准备时间（分钟）
      - cookTime: (number) 烹饪时间（分钟）
      - ingredients: (array) 食材列表，每项包含 name (string) 和 amount (number) 和 unit (string)。名称请尽量简短。
      - instructions: (array) 制作步骤，简单的字符串数组。每一步骤请控制在20字以内，避免复杂的长句。
      - difficulty: (string) 难度，仅限 "easy", "medium", "hard" 之一
      - tags: (array) 标签字符串数组
      
      重要提示：
      1. 必须返回纯JSON数组，不要包含任何markdown标记或其他文本。
      2. 字符串中严禁使用双引号，请用单引号代替。
      3. 不要输出尾随逗号。
      4. 针对中餐，请务必简化描述和步骤，不要过于详细，避免JSON过长导致格式错误。`
    );
  }

  async process(input: RecipeRecommendationRequest): Promise<AgentResponse<Recipe[]>> {
    try {
      const { preferences, healthData, mealType, count = 3, goalText, analysisSummary } = input;
      
      let prompt = `请推荐 ${count} 个${mealType ? (mealType === 'full_day' ? '全天（早中晚）' : mealType) + ' ' : ''}食谱。`;

      if (goalText) {
        prompt += `\n用户目标: ${goalText}`;
      }

      if (analysisSummary) {
        prompt += `\n健康分析摘要: ${analysisSummary}`;
      }
      
      if (preferences) {
        prompt += `\n饮食偏好:
        - 类型: ${preferences.dietType || '无限制'}
        - 过敏原: ${preferences.allergies?.map(a => a.name).join(', ') || '无'}
        - 不喜欢的食物: ${preferences.dislikedFoods?.join(', ') || '无'}
        - 喜欢的食物: ${preferences.preferredFoods?.join(', ') || '无'}`;
      }
      
      if (healthData) {
        prompt += `\n健康状况:
        - BMI: ${healthData.bmi || '未知'}
        - 目标: 根据BMI提供适合的营养建议`;
      }
      
      prompt += `\n请务必只返回一个有效的JSON数组。字符串属性值中如果需要使用引号，必须使用单引号。`;

      const response = await this.callLLM(prompt);
      
      // 尝试修复常见的JSON格式错误
      let cleanResponse = response.trim();
      // 移除可能的markdown代码块标记
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      // 修复对象之间缺失逗号的情况 (例如: }{ -> }, {)
      cleanResponse = cleanResponse.replace(/}\s*{/g, '},{');
      // 修复数组元素之间缺失逗号的情况 (例如: ] [ -> ], [) - 虽然这里期望是单个大数组，但防患未然
      cleanResponse = cleanResponse.replace(/]\s*\[/g, '],[');
      
      const result = this.parseJSON<any[]>(cleanResponse);

      if (!result || !Array.isArray(result)) {
        console.error('[RecipeAgent] Invalid result format:', result);
        return {
          success: false,
          error: 'AI响应格式不正确：必须是食谱数组',
          rawResponse: response
        };
      }

      // Validate required fields for the first item to ensure basic structure
      if (result.length > 0) {
        const firstItem = result[0];
        if (!firstItem.title || !firstItem.ingredients || !firstItem.instructions) {
          console.error('[RecipeAgent] Missing required fields in first item:', firstItem);
          return {
            success: false,
            error: 'AI响应数据缺失必要字段（如title, ingredients, instructions）',
            rawResponse: response
          };
        }
      }

      // Map to Recipe type (partial)
      const recipes: any[] = result.map((item, index) => ({
        id: `gen-${Date.now()}-${index}`,
        title: item.title,
        description: item.description,
        nutritionInfo: {
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          perServing: true,
          carbohydrates: item.carbs,
          cholesterol: 0
        },
        prepTime: item.prepTime,
        cookTime: item.cookTime,
        servings: 1,
        difficulty: item.difficulty,
        category: mealType as any || 'other',
        tags: item.tags || [],
        ingredients: item.ingredients || [],
        instructions: item.instructions || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false
      }));

      return {
        success: true,
        data: recipes as Recipe[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
