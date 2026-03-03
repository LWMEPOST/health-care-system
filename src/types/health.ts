// src/types/health.ts
// 健康数据类型定义

/**
 * 健康数据接口
 * 包含用户的所有健康相关信息
 */
export interface HealthData {
  // 基础信息
  age?: number;             // 年龄
  gender?: 'male' | 'female' | 'other'; // 性别
  height?: number;          // 身高（厘米）
  weight?: number;          // 体重（公斤）
  bmi?: number;             // 体质指数（可选，可计算得出）
  
  // 健康指标
  systolic?: number;        // 收缩压（mmHg）
  diastolic?: number;       // 舒张压（mmHg）
  heartRate?: number;       // 心率（bpm）
  stressLevel?: number;     // 压力水平（1-10）
  
  // 生活习惯
  exerciseFrequency?: string; // 运动频率（如："3次/周"）
  exerciseType?: string[];   // 运动类型
  sleepQuality?: '很差' | '较差' | '一般' | '良好' | '优秀'; // 睡眠质量
  sleepHours?: number;       // 睡眠时间（小时）
  smokingStatus?: '不吸烟' | '已戒烟' | '偶尔吸烟' | '经常吸烟'; // 吸烟状态
  alcoholIntake?: '不饮酒' | '偶尔饮酒' | '经常饮酒'; // 饮酒情况
  dailySteps?: number;
  waterCups?: number;
  checkinPeriod?: 'morning' | 'noon' | 'evening';
  
  // 饮食偏好
  dietPreferences?: string[];  // 饮食偏好（如："清淡", "辛辣", "素食"等）
  allergies?: string[];        // 食物过敏
  dietaryRestrictions?: string[]; // 饮食禁忌
  waterIntake?: number;        // 每日饮水量（升）
  
  // 时间戳和元数据
  createdAt?: string;        // 创建时间
  updatedAt?: string;        // 更新时间
  recordDate?: string;       // 记录日期（YYYY-MM-DD格式，用于历史记录）
  
  // 其他可选字段
  notes?: string;            // 备注信息
  healthScore?: number;      // 健康评分（可选，可计算得出）
}

/**
 * 表单验证回调函数类型
 */
export type FormValidatorCallback = (error?: Error | string) => void;

/**
 * 表单规则验证器类型
 */
export interface FormRuleValidator {
  validator: (rule: any, value: any, callback: FormValidatorCallback) => void;
  trigger?: string | string[];
  message?: string;
}

/**
 * 健康指标参考范围接口
 */
export interface HealthReferenceRange {
  metric: string;        // 指标名称
  unit: string;          // 单位
  min: number;           // 最小值
  max: number;           // 最大值
  idealMin?: number;     // 理想最小值（可选）
  idealMax?: number;     // 理想最大值（可选）
  description?: string;  // 描述
}

/**
 * BMI分类接口
 */
export interface BMICategory {
  range: string;         // 范围描述
  min: number;           // 最小值
  max?: number;          // 最大值
  healthStatus: string;  // 健康状态
  recommendations: string[]; // 建议
}

/**
 * 血压分类接口
 */
export interface BloodPressureCategory {
  category: string;      // 分类名称
  systolicMin: number;   // 收缩压最小值
  systolicMax?: number;  // 收缩压最大值
  diastolicMin: number;  // 舒张压最小值
  diastolicMax?: number; // 舒张压最大值
  description: string;   // 描述
}

/**
 * 健康评分计算结果接口
 */
export interface HealthScoreResult {
  totalScore: number;          // 总分（0-100）
  scoreLevel: '优秀' | '良好' | '一般' | '较差' | '很差'; // 评分等级
  breakdown: {
    bmiScore?: number;         // BMI评分
    bloodPressureScore?: number; // 血压评分
    heartRateScore?: number;   // 心率评分
    lifestyleScore?: number;   // 生活方式评分
    dietScore?: number;        // 饮食评分
  };
  suggestions: string[];       // 改进建议
}

/**
 * 健康趋势数据点接口
 */
export interface HealthTrendPoint {
  date: string;          // 日期
  value: number;         // 数值
  unit: string;          // 单位
}

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto'; // 主题设置
  notificationEnabled?: boolean;     // 是否启用通知
  autoSyncEnabled?: boolean;         // 是否启用自动同步
  reminderTime?: string;             // 提醒时间
  measurementUnit?: 'metric' | 'imperial'; // 测量单位系统
  preferredLanguage?: string;        // 首选语言
}

/**
 * 导出数据接口
 */
export interface ExportData {
  currentData?: HealthData;        // 当前健康数据
  historicalData?: HealthData[];   // 历史健康数据
  preferences?: UserPreferences;   // 用户偏好设置
  exportDate: string;              // 导出日期
  version: string;                 // 数据版本
}
