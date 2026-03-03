<template>
  <div class="health-data-form">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>健康数据录入</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" class="health-tabs">
        <!-- 基础信息标签页 -->
        <el-tab-pane label="基础信息" name="basic">
          <el-form :model="basicInfo" :rules="basicInfoRules" ref="basicInfoRef" label-width="120px">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="basicInfo.age" :min="0" :max="120" placeholder="请输入年龄" />
            </el-form-item>
            
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="basicInfo.gender">
                <el-radio label="male">男</el-radio>
                <el-radio label="female">女</el-radio>
                <el-radio label="other">其他</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="身高(cm)" prop="height">
              <el-input-number v-model="basicInfo.height" :min="50" :max="250" placeholder="请输入身高" />
            </el-form-item>
            
            <el-form-item label="体重(kg)" prop="weight">
              <el-input-number v-model="basicInfo.weight" :min="10" :max="300" placeholder="请输入体重" :step="0.1" />
            </el-form-item>
            
            <el-form-item label="BMI指数" prop="bmi">
              <el-input v-model="calculatedBmi" disabled />
              <div class="bmi-category" v-if="bmiCategory">
                <span>身体质量分类: {{ bmiCategory }}</span>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 健康指标标签页 -->
        <el-tab-pane label="健康指标" name="health">
          <el-form :model="healthMetrics" :rules="healthMetricsRules" ref="healthMetricsRef" label-width="120px">
            <el-form-item label="收缩压(高压)" prop="systolicPressure">
              <el-input-number v-model="healthMetrics.systolicPressure" :min="50" :max="250" placeholder="请输入收缩压" />
            </el-form-item>
            
            <el-form-item label="舒张压(低压)" prop="diastolicPressure">
              <el-input-number v-model="healthMetrics.diastolicPressure" :min="30" :max="150" placeholder="请输入舒张压" />
            </el-form-item>
            
            <el-form-item label="心率(bpm)" prop="heartRate">
              <el-input-number v-model="healthMetrics.heartRate" :min="40" :max="200" placeholder="请输入心率" />
            </el-form-item>
            
            <el-form-item label="压力水平" prop="stressLevel">
              <el-rate 
                v-model="healthMetrics.stressLevel" 
                :max="5" 
                :texts="['很低', '低', '中等', '高', '很高']" 
                show-text 
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 生活习惯标签页 -->
        <el-tab-pane label="生活习惯" name="lifestyle">
          <el-form :model="lifestyle" :rules="lifestyleRules" ref="lifestyleRef" label-width="120px">
            <el-form-item label="运动频率" prop="exerciseFrequency">
              <el-select v-model="lifestyle.exerciseFrequency" placeholder="请选择运动频率">
                <el-option label="几乎不运动" value="rarely" />
                <el-option label="每周1-2次" value="once_twice" />
                <el-option label="每周3-4次" value="three_four" />
                <el-option label="每周5次以上" value="frequent" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="睡眠质量" prop="sleepQuality">
              <el-rate 
                v-model="lifestyle.sleepQuality" 
                :max="5" 
                :texts="['很差', '较差', '一般', '良好', '优秀']" 
                show-text 
              />
            </el-form-item>
            
            <el-form-item label="平均睡眠时间(小时)" prop="sleepHours">
              <el-slider 
                v-model="lifestyle.sleepHours" 
                :min="3" 
                :max="12" 
                :step="0.5" 
                show-stops 
              />
              <span class="slider-value">{{ lifestyle.sleepHours }} 小时</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 饮食偏好标签页 -->
        <el-tab-pane label="饮食偏好" name="diet">
          <el-form :model="dietaryPreferences" :rules="dietaryPreferencesRules" ref="dietaryPreferencesRef" label-width="120px">
            <el-form-item label="口味偏好" prop="flavorPreferences">
              <el-checkbox-group v-model="dietaryPreferences.flavorPreferences">
                <el-checkbox label="清淡" />
                <el-checkbox label="甜" />
                <el-checkbox label="酸" />
                <el-checkbox label="辣" />
                <el-checkbox label="咸" />
                <el-checkbox label="其他" />
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="食物过敏" prop="allergies">
              <el-select 
                v-model="dietaryPreferences.allergies" 
                multiple 
                placeholder="请选择或输入过敏食物"
                filterable
                allow-create
                default-first-option
              >
                <el-option label="花生" value="peanut" />
                <el-option label="牛奶" value="milk" />
                <el-option label="鸡蛋" value="egg" />
                <el-option label="海鲜" value="seafood" />
                <el-option label="小麦" value="wheat" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="饮食禁忌" prop="dietaryRestrictions">
              <el-input 
                v-model="dietaryPreferences.dietaryRestrictions" 
                type="textarea" 
                placeholder="请输入其他饮食禁忌或特殊要求"
                :rows="3"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <!-- 提交按钮 -->
      <div class="form-actions">
        <el-button type="primary" @click="submitForm">保存健康数据</el-button>
        <el-button @click="resetForm">重置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
// 正确导入Element Plus的消息和对话框组件
import { ElMessage } from 'element-plus/es';
import { ElMessageBox } from 'element-plus/es';
import { HealthDataValidator, createHealthDataValidationRules, validateCompleteHealthData } from '../services/healthValidator';
import { HealthStorageService } from '@/services/healthStorage';
import { useHealthStore } from '../store/healthStore';
import { useUserStore } from '../store/userStore';
import type { HealthData } from '@/types/health';

// 标签页状态
const activeTab = ref('basic');
const healthStore = useHealthStore();
const userStore = useUserStore();

// 表单引用
const basicInfoRef = ref();
const healthMetricsRef = ref();
const lifestyleRef = ref();
const dietaryPreferencesRef = ref();

// 基础信息表单数据
const basicInfo = reactive<{
  age: number | null;
  gender: 'male' | 'female' | 'other';
  height: number | null;
  weight: number | null;
  bmi: number | null;
}>({
  age: null,
  gender: 'other', // 默认值改为合法的联合类型值
  height: null,
  weight: null,
  bmi: null
});

// 健康指标表单数据
const healthMetrics = reactive<{
  systolicPressure: number | null | undefined;
  diastolicPressure: number | null | undefined;
  heartRate: number | null | undefined;
  stressLevel: number;
}>({
  systolicPressure: null,
  diastolicPressure: null,
  heartRate: null,
  stressLevel: 3 // 默认中等
});

// 生活习惯表单数据
const lifestyle = reactive<{
  exerciseFrequency: string;
  sleepQuality: number; // 1-5的数字值
  sleepHours: number;
}>({
  exerciseFrequency: '',
  sleepQuality: 3, // 默认一般
  sleepHours: 7 // 默认7小时
});

// 将数字睡眠质量转换为字符串枚举
const getSleepQualityText = (value: number): '很差' | '较差' | '一般' | '良好' | '优秀' => {
  const qualityMap = [
    '很差', '较差', '一般', '良好', '优秀'
  ];
  // 确保值在1-5范围内
  const index = Math.max(0, Math.min(4, value - 1));
  return qualityMap[index] as '很差' | '较差' | '一般' | '良好' | '优秀';
};

// 将字符串睡眠质量转换为数字值
const getSleepQualityValue = (text: string): number => {
  const qualityMap: Record<string, number> = {
    '很差': 1,
    '较差': 2,
    '一般': 3,
    '良好': 4,
    '优秀': 5
  };
  // 默认返回3（一般）
  return qualityMap[text] || 3;
};

const dietaryPreferences = reactive({
  flavorPreferences: [] as string[],
  allergies: [] as string[],
  dietaryRestrictions: ''
});

// 计算BMI指数
const calculatedBmi = computed(() => {
  if (!basicInfo.height || !basicInfo.weight) return '';
  const heightInM = basicInfo.height / 100;
  const bmi = basicInfo.weight / (heightInM * heightInM);
  return bmi.toFixed(1);
});

// 计算BMI类别
const bmiCategory = computed(() => {
  if (!calculatedBmi.value) return '';
  const bmi = parseFloat(calculatedBmi.value);
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
});

// 监听BMI变化，更新到表单数据
watch(calculatedBmi, (newVal) => {
  if (newVal) {
    basicInfo.bmi = parseFloat(newVal);
  }
});

// 获取表单验证规则
const validationRules = createHealthDataValidationRules();

// 基础信息验证规则
const basicInfoRules = {
  ...validationRules.basicInfo,
  // 添加血压的实时验证
  height: [
    ...validationRules.basicInfo.height,
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (value && basicInfo.weight) {
          const weightRange = HealthDataValidator.getHealthyWeightRange(value);
          if (basicInfo.weight < weightRange.min || basicInfo.weight > weightRange.max) {
            ElMessage.warning(`根据身高${value}cm，建议体重范围为${weightRange.min}-${weightRange.max}kg`);
          }
        }
        callback();
      },
      trigger: 'change'
    }
  ],
  weight: [
    ...validationRules.basicInfo.weight,
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (value && basicInfo.height) {
          const weightRange = HealthDataValidator.getHealthyWeightRange(basicInfo.height);
          if (value < weightRange.min || value > weightRange.max) {
            ElMessage.warning(`根据身高${basicInfo.height}cm，建议体重范围为${weightRange.min}-${weightRange.max}kg`);
          }
        }
        callback();
      },
      trigger: 'change'
    }
  ]
};

// 健康指标验证规则
const healthMetricsRules = {
  ...validationRules.healthMetrics,
  diastolicPressure: [
    ...validationRules.healthMetrics.diastolicPressure,
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (healthMetrics.systolicPressure && value) {
          const bpError = HealthDataValidator.validateBloodPressure(healthMetrics.systolicPressure, value);
          if (bpError) {
            callback(new Error(bpError));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  systolicPressure: [
    ...validationRules.healthMetrics.systolicPressure,
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (value && healthMetrics.diastolicPressure) {
          const bpError = HealthDataValidator.validateBloodPressure(value, healthMetrics.diastolicPressure);
          if (bpError) {
            callback(new Error(bpError));
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
};

// 生活习惯验证规则
const lifestyleRules = validationRules.lifestyle;

// 饮食偏好验证规则
const dietaryPreferencesRules = validationRules.dietaryPreferences;

// 表单提交
const submitForm = async () => {
    try {
      // 按顺序验证所有表单
      const results = await Promise.all([
        new Promise((resolve) => basicInfoRef.value.validate((valid: boolean) => resolve(valid))),
        new Promise((resolve) => healthMetricsRef.value.validate((valid: boolean) => resolve(valid))),
        new Promise((resolve) => lifestyleRef.value.validate((valid: boolean) => resolve(valid))),
        new Promise((resolve) => dietaryPreferencesRef.value.validate((valid: boolean) => resolve(valid)))
      ]);
      
      const allValid = results.every(result => result === true);
      
      if (allValid) {
        // 整合所有表单数据
        const healthData: HealthData = {
          // 转换null值为undefined以匹配HealthData接口类型
          age: basicInfo.age ?? undefined,
          gender: basicInfo.gender,
          height: basicInfo.height ?? undefined,
          weight: basicInfo.weight ?? undefined,
          bmi: basicInfo.bmi ?? undefined,
          // 扁平化健康指标数据
          systolic: healthMetrics.systolicPressure ?? undefined,
          diastolic: healthMetrics.diastolicPressure ?? undefined,
          heartRate: healthMetrics.heartRate ?? undefined,
          stressLevel: healthMetrics.stressLevel,
          // 扁平化生活习惯数据
          exerciseFrequency: lifestyle.exerciseFrequency,
          sleepQuality: getSleepQualityText(lifestyle.sleepQuality), // 将数字值转换为字符串枚举
          sleepHours: lifestyle.sleepHours,
          // 扁平化饮食偏好数据
          dietPreferences: dietaryPreferences.flavorPreferences,
          allergies: dietaryPreferences.allergies,
          dietaryRestrictions: [dietaryPreferences.dietaryRestrictions],
          // recordDate: new Date().toISOString()
        };
        
        // 进行完整的健康数据验证
        const validationResult = validateCompleteHealthData(healthData);
        
        // 修复：validationResult.messages 可能是 undefined，确保它是一个字符串或数组
        const errorMessages = validationResult.messages 
          ? (Array.isArray(validationResult.messages) ? validationResult.messages.join('\n') : validationResult.messages) 
          : '数据可能存在异常，请确认是否继续';

        if (!validationResult.isValid) {
          // 显示警告但允许用户确认保存
          const confirmResult = await ElMessageBox.confirm(
            `检测到以下健康数据异常：\n${errorMessages}\n\n是否仍要保存？`,
            '健康数据警告',
            {
              confirmButtonText: '继续保存',
              cancelButtonText: '取消',
              type: 'warning'
            }
          );
          
          if (confirmResult !== 'confirm') {
            return;
          }
        }
        
        // 准备完整的健康数据对象，包含必要的userId和recordedAt
        const completeHealthData = {
          ...healthData,
          userId: userStore.userProfile?.id || '',
          // recordedAt: new Date()
        };
        
        // 保存到数据库
        // 将 sleepQuality 从字符串枚举转换为数字值
        const healthDataToSave = {
          ...completeHealthData,
          sleepQuality: lifestyle.sleepQuality // 保持数字值
        };
        const saved = await healthStore.addHealthData(healthDataToSave);
        
        if (saved) {
          // 保存到本地存储作为备份
          HealthStorageService.saveCurrentHealthData(healthData);
          ElMessage.success('健康数据保存成功！');
        } else {
          ElMessage.error(healthStore.error || '保存健康数据失败，请重试');
          return;
        }
        
        // 发出保存成功事件，让父组件可以响应
        emit('health-data-saved', healthData);
        
        // 重置表单
        resetForm();
      } else {
        ElMessage.error('请检查并完善所有表单信息');
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      if (error !== 'cancel') {
        ElMessage.error('表单验证失败，请检查输入内容');
      }
    }
  };
  
  // 从本地存储加载数据
  const loadFromStorage = () => {
    try {
      const savedData = HealthStorageService.getCurrentHealthData();
      if (savedData) {
        // 加载基础信息
        if (savedData.age) basicInfo.age = savedData.age;
        if (savedData.gender) basicInfo.gender = savedData.gender;
        if (savedData.height) basicInfo.height = savedData.height;
        if (savedData.weight) basicInfo.weight = savedData.weight;
        
        // 加载健康指标
        if (savedData.systolic) healthMetrics.systolicPressure = savedData.systolic;
        if (savedData.diastolic) healthMetrics.diastolicPressure = savedData.diastolic;
        if (savedData.heartRate) healthMetrics.heartRate = savedData.heartRate;
        if (savedData.stressLevel) healthMetrics.stressLevel = savedData.stressLevel;
        
        // 加载生活习惯
        if (savedData.exerciseFrequency) lifestyle.exerciseFrequency = savedData.exerciseFrequency;
        if (savedData.sleepQuality) lifestyle.sleepQuality = typeof savedData.sleepQuality === 'string' ? getSleepQualityValue(savedData.sleepQuality) : savedData.sleepQuality;
        if (savedData.sleepHours) lifestyle.sleepHours = savedData.sleepHours;
        
        // 加载饮食偏好
        if (savedData.dietPreferences) dietaryPreferences.flavorPreferences = savedData.dietPreferences;
        if (savedData.allergies) dietaryPreferences.allergies = savedData.allergies;
        if (savedData.dietaryRestrictions) dietaryPreferences.dietaryRestrictions = savedData.dietaryRestrictions.join(', ');
        
        ElMessage.info('已加载上次保存的数据');
      }
    } catch (error) {
      console.error('加载保存的数据失败:', error);
    }
  };


// 表单重置
const resetForm = () => {
  basicInfoRef.value.resetFields();
  healthMetricsRef.value.resetFields();
  lifestyleRef.value.resetFields();
  dietaryPreferencesRef.value.resetFields();
};

// 从本地存储加载数据
onMounted(() => {
  loadFromStorage();
});

// 定义组件事件
const emit = defineEmits(['health-data-saved']);

// 设置组件名称
// @ts-ignore
defineOptions({
  name: 'HealthDataForm'
});
</script>

<style scoped>
.health-data-form {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.form-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-tabs {
  margin-top: 20px;
}

.bmi-category {
  margin-top: 8px;
  padding: 4px 12px;
  background-color: #f0f9eb;
  color: #67c23a;
  border-radius: 4px;
  display: inline-block;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.slider-value {
  margin-left: 10px;
  color: #606266;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .health-data-form {
    padding: 10px;
  }
  
  .el-form-item__label {
    width: 100px !important;
  }
  
  .el-form-item__content {
    margin-left: 110px !important;
  }
}

@media (max-width: 480px) {
  .el-form-item__label {
    width: 100% !important;
  }
  
  .el-form-item__content {
    margin-left: 0 !important;
    margin-top: 5px;
  }
}
</style>
