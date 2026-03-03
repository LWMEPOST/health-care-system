import { BaseAgent, AgentResponse } from './BaseAgent';

export interface HealthAnalysisResult {
  summary: string;
  risks: string[];
  recommendations: string[];
  score: number;
  categorizedRecommendations: {
    bmi?: string[];
    bloodPressure?: string[];
    heartRate?: string[];
    stress?: string[];
    exercise?: string[];
    sleep?: string[];
    diet?: string[];
  };
}

export class HealthAnalysisAgent extends BaseAgent {
  constructor() {
    super(
      'HealthAnalysisAgent',
      `你是一位专业的健康分析专家。你的任务是分析用户的健康数据，识别潜在的健康风险，并提供个性化的改进建议。
      
      请以JSON格式返回结果，包含以下字段：
      - summary: 总体健康状况摘要
      - risks: 识别出的健康风险列表（数组）
      - recommendations: 综合改进建议列表（数组）
      - score: 基于数据的综合健康评分（0-100）
      - categorizedRecommendations: 按类别分的建议（对象，包含 bmi, bloodPressure, heartRate, stress, exercise, sleep, diet 字段，每个字段为字符串数组）
      
      请确保建议科学、客观，基于医学常识（但注明非正式医疗诊断），语气亲切但专业。`
    );
  }

  async process(input: any): Promise<AgentResponse<HealthAnalysisResult>> {
    try {
      // 构建详细的输入提示
      const prompt = `请分析以下用户的详细健康数据：
      - 基本信息: 年龄 ${input.age || '未知'}, 性别 ${input.gender || '未知'}, 身高 ${input.height || '未知'}cm, 体重 ${input.weight || '未知'}kg, BMI ${input.bmi || '未知'}
      - 生理指标: 血压 ${input.systolic ? input.systolic + '/' + input.diastolic : '未知'} mmHg, 心率 ${input.heartRate || '未知'} bpm
      - 心理与生活方式: 压力水平 ${input.stressLevel || '未知'}/10, 运动频率 ${input.exerciseFrequency || '未知'}, 睡眠质量 ${input.sleepQuality || '未知'}, 睡眠时长 ${input.sleepHours || '未知'}小时
      - 饮食习惯: 偏好 [${(input.dietPreferences || []).join(', ')}], 限制 [${(input.dietaryRestrictions || []).join(', ')}]
      
      请根据以上数据进行全方位分析，并按要求返回 JSON 格式。`;

      const response = await this.callLLM(prompt);
      const result = this.parseJSON<HealthAnalysisResult>(response);

      if (!result) {
        return {
          success: false,
          error: '无法解析AI响应',
          rawResponse: response
        };
      }

      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      console.error('HealthAnalysisAgent process error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
