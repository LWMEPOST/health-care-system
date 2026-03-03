// 健康数据验证服务

/**
 * 表单验证回调类型
 */
export interface FormValidatorCallback {
  (error?: Error): void;
}

/**
 * 表单规则验证器接口
 */
export interface FormRuleValidator {
  (rule: any, value: any, callback: FormValidatorCallback): void;
}

/**
 * 健康数据验证工具类
 */
export class HealthDataValidator {
  /**
   * 验证BMI范围的合理性
   * @param bmi BMI值
   * @returns 是否在合理范围内
   */
  static isValidBMI(bmi: number): boolean {
    return bmi >= 10 && bmi <= 60;
  }

  /**
   * 验证血压的医学合理性
   * @param systolic 收缩压
   * @param diastolic 舒张压
   * @returns 错误信息，如果没有错误则返回null
   */
  static validateBloodPressure(systolic: number, diastolic: number): string | null {
    // 检查数值范围 - 仅拦截生理上不可能的数值
    if (systolic < 0 || systolic > 300) {
      return '收缩压数值无效';
    }
    
    if (diastolic < 0 || diastolic > 200) {
      return '舒张压数值无效';
    }
    
    // 收缩压必须高于舒张压
    if (systolic <= diastolic) {
      return '收缩压必须高于舒张压';
    }
    
    // 不再拦截高/低血压，允许记录不健康数据
    return null; 
  }

  /**
   * 验证心率的医学合理性
   * @param heartRate 心率值
   * @returns 错误信息，如果没有错误则返回null
   */
  static validateHeartRate(heartRate: number): string | null {
    // 基本范围检查 - 仅拦截生理上不可能的数值
    if (heartRate < 0 || heartRate > 300) {
      return '心率数值无效';
    }
    
    return null; 
  }

  /**
   * 验证年龄的合理性
   * @param age 年龄值
   * @returns 是否在合理范围内
   */
  static isValidAge(age: number): boolean {
    return age >= 0 && age <= 120;
  }

  /**
   * 验证身高的合理性
   * @param height 身高值（厘米）
   * @returns 是否在合理范围内
   */
  static isValidHeight(height: number): boolean {
    return height >= 50 && height <= 250;
  }

  /**
   * 验证体重的合理性
   * @param weight 体重值（公斤）
   * @returns 是否在合理范围内
   */
  static isValidWeight(weight: number): boolean {
    return weight >= 10 && weight <= 300;
  }

  /**
   * 基于身高计算合理体重范围
   * @param height 身高（厘米）
   * @returns 包含最低和最高合理体重的对象
   */
  static getHealthyWeightRange(height: number): { min: number; max: number } {
    const heightInM = height / 100;
    return {
      min: Math.round(18.5 * heightInM * heightInM * 10) / 10, // BMI 18.5
      max: Math.round(24 * heightInM * heightInM * 10) / 10     // BMI 24
    };
  }

  /**
   * 验证睡眠时长的合理性
   * @param hours 睡眠时长（小时）
   * @returns 错误信息，如果没有错误则返回null
   */
  static validateSleepHours(hours: number): string | null {
    if (hours < 3 || hours > 12) {
      return '睡眠时间应在3-12小时之间';
    }
    
    if (hours < 6) {
      return '睡眠时间偏少';
    }
    
    if (hours > 9) {
      return '睡眠时间偏多';
    }
    
    return null; // 没有错误
  }

  /**
   * 血压验证器（用于表单验证规则）
   */
  static createBloodPressureValidator(_systolicField: string, _diastolicField: string): FormRuleValidator {
    return (_rule: any, _value: any, callback: FormValidatorCallback) => {
      // 这里需要在组件中获取收缩压和舒张压的值
      // 由于我们不能直接访问组件数据，这个函数将在组件中被适配使用
      callback();
    };
  }
}

/**
 * 创建完整的健康数据验证规则
 */
export const createHealthDataValidationRules = () => {
  return {
    // 基础信息验证规则
    basicInfo: {
      age: [
        { required: true, message: '请输入年龄', trigger: 'blur' },
        { type: 'number', min: 0, max: 120, message: '年龄应在0-120之间', trigger: 'blur' },
        {
          validator: (_rule: any, value: number, callback: FormValidatorCallback) => {
            if (value && !HealthDataValidator.isValidAge(value)) {
              callback(new Error('请输入合理的年龄'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
      ],
      height: [
        { required: true, message: '请输入身高', trigger: 'blur' },
        { type: 'number', min: 50, max: 250, message: '身高应在50-250厘米之间', trigger: 'blur' },
        {
          validator: (_rule: any, value: number, callback: FormValidatorCallback) => {
            if (value && !HealthDataValidator.isValidHeight(value)) {
              callback(new Error('请输入合理的身高'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ],
      weight: [
        { required: true, message: '请输入体重', trigger: 'blur' },
        { type: 'number', min: 10, max: 300, message: '体重应在10-300公斤之间', trigger: 'blur' },
        {
          validator: (_rule: any, value: number, callback: FormValidatorCallback) => {
            if (value && !HealthDataValidator.isValidWeight(value)) {
              callback(new Error('请输入合理的体重'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    },
    
    // 健康指标验证规则
    healthMetrics: {
      systolicPressure: [
        { required: true, message: '请输入收缩压', trigger: 'blur' },
        { type: 'number', min: 50, max: 250, message: '收缩压应在50-250之间', trigger: 'blur' }
      ],
      diastolicPressure: [
        { required: true, message: '请输入舒张压', trigger: 'blur' },
        { type: 'number', min: 30, max: 150, message: '舒张压应在30-150之间', trigger: 'blur' }
      ],
      heartRate: [
        { required: true, message: '请输入心率', trigger: 'blur' },
        { type: 'number', min: 40, max: 200, message: '心率应在40-200之间', trigger: 'blur' },
        {
          validator: (_rule: any, value: number, callback: FormValidatorCallback) => {
            if (value) {
              const error = HealthDataValidator.validateHeartRate(value);
              if (error && error !== '心率偏低' && error !== '心率偏高') {
                callback(new Error(error));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    },
    
    // 生活习惯验证规则
    lifestyle: {
      exerciseFrequency: [
        { required: true, message: '请选择运动频率', trigger: 'change' }
      ],
      sleepHours: [
        {
          validator: (_rule: any, value: number, callback: FormValidatorCallback) => {
            if (value) {
              const error = HealthDataValidator.validateSleepHours(value);
              if (error && error !== '睡眠时间偏少' && error !== '睡眠时间偏多') {
                callback(new Error(error));
              } else {
                callback();
              }
            } else {
              callback();
            }
          },
          trigger: 'change'
        }
      ]
    },
    
    // 饮食偏好验证规则
    dietaryPreferences: {
      flavorPreferences: [
        { required: true, message: '请至少选择一种口味偏好', trigger: 'change' },
        {
          validator: (_rule: any, value: string[], callback: FormValidatorCallback) => {
            if (value && value.length === 0) {
              callback(new Error('请至少选择一种口味偏好'));
            } else {
              callback();
            }
          },
          trigger: 'change'
        }
      ]
    }
  };
};

/**
 * 进行完整健康数据验证并返回所有错误
 * @param healthData 健康数据对象
 * @returns 包含错误信息的对象，键为字段名，值为错误消息
 */
export const validateCompleteHealthData = (healthData: any): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // 验证基础信息
  if (healthData.age && !HealthDataValidator.isValidAge(healthData.age)) {
    errors['age'] = '请输入合理的年龄';
  }
  
  if (!healthData.gender) {
    errors['gender'] = '请选择性别';
  }
  
  if (healthData.height && !HealthDataValidator.isValidHeight(healthData.height)) {
    errors['height'] = '请输入合理的身高';
  }
  
  if (healthData.weight && !HealthDataValidator.isValidWeight(healthData.weight)) {
    errors['weight'] = '请输入合理的体重';
  }
  
  // 验证血压
  if (healthData.healthMetrics) {
    const bpError = HealthDataValidator.validateBloodPressure(
      healthData.healthMetrics.systolicPressure,
      healthData.healthMetrics.diastolicPressure
    );
    if (bpError) {
      errors['bloodPressure'] = bpError;
    }
    
    // 验证心率
    if (healthData.healthMetrics.heartRate) {
      const hrError = HealthDataValidator.validateHeartRate(healthData.healthMetrics.heartRate);
      if (hrError) {
        errors['heartRate'] = hrError;
      }
    }
  }
  
  // 验证睡眠
  if (healthData.lifestyle && healthData.lifestyle.sleepHours) {
    const sleepError = HealthDataValidator.validateSleepHours(healthData.lifestyle.sleepHours);
    if (sleepError) {
      errors['sleepHours'] = sleepError;
    }
  }
  
  // 验证饮食偏好
  if (healthData.dietaryPreferences && 
      (!healthData.dietaryPreferences.flavorPreferences || 
       healthData.dietaryPreferences.flavorPreferences.length === 0)) {
    errors['flavorPreferences'] = '请至少选择一种口味偏好';
  }
  
  return errors;
};