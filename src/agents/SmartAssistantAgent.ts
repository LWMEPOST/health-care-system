import { BaseAgent, AgentResponse } from './BaseAgent';

export interface SmartAssistantResult {
  answer: string;
  suggestedQuestions?: string[];
}

export class SmartAssistantAgent extends BaseAgent {
  constructor() {
    super(
      'SmartAssistantAgent',
      `你是一位专业的智能健康管家。你的任务是协助用户管理健康，回答健康相关问题，并根据用户的健康数据提供针对性的建议。
      
      你的回复风格：
      - 亲切、温暖，像宫崎骏电影里的老管家或小精灵。
      - 专业、科学，但不过于教条。
      - 简洁明了，避免过长的段落。
      
      特别说明：
      - 如果用户询问医疗诊断或用药建议，请注明你只是 AI 助手，非专业医生，建议咨询医疗机构。
      - 当提供健康建议时，优先考虑用户已有的健康数据（如 BMI、血压、心率等）。`
    );
  }

  /**
   * 生成初始建议问题
   */
  async generateSuggestions(healthData: any): Promise<string[]> {
    const prompt = `根据以下用户的健康数据，生成 4 个用户可能最想询问的、具有针对性的健康问题。
    
    用户数据：
    - 年龄: ${healthData.age || '未知'}
    - BMI: ${healthData.bmi || '未知'}
    - 血压: ${healthData.systolic ? healthData.systolic + '/' + healthData.diastolic : '未知'}
    - 心率: ${healthData.heartRate || '未知'}
    - 压力水平: ${healthData.stressLevel || '未知'}/5
    - 运动频率: ${healthData.exerciseFrequency || '未知'}
    - 睡眠时长: ${healthData.sleepHours || '未知'}小时
    
    请以 JSON 数组格式返回，仅包含问题字符串列表。例如：["我的血压偏高，饮食上该注意什么？", "..."]`;

    try {
      const response = await this.callLLM(prompt, "你的任务是生成建议问题列表。");
      const suggestions = this.parseJSON<string[]>(response);
      return suggestions || [
        "我目前的健康状况如何？",
        "如何通过饮食改善我的 BMI？",
        "有哪些适合我的运动建议？",
        "如何缓解最近的压力？"
      ];
    } catch (error) {
      console.error('生成建议问题失败:', error);
      return ["我目前的健康状况如何？", "如何改善我的饮食？", "运动建议有哪些？", "如何提高睡眠质量？"];
    }
  }

  /**
   * 处理对话
   */
  async process(input: { message: string; history: any[]; healthData: any }): Promise<AgentResponse<SmartAssistantResult>> {
    try {
      const context = `用户信息背景：
      - 基本指标: 年龄 ${input.healthData.age || '未知'}, BMI ${input.healthData.bmi || '未知'}
      - 生理指标: 血压 ${input.healthData.systolic ? input.healthData.systolic + '/' + input.healthData.diastolic : '未知'}, 心率 ${input.healthData.heartRate || '未知'}
      - 生活习惯: 睡眠 ${input.healthData.sleepHours || '未知'}小时, 压力 ${input.healthData.stressLevel || '未知'}/5
      
      历史对话摘要：${input.history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`;

      const prompt = `用户问：${input.message}\n\n请作为健康管家给出回答。`;

      const response = await this.callLLM(prompt, context);

      return {
        success: true,
        data: {
          answer: response
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
