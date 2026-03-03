<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus/es';
import { useHealthStore } from '../store/healthStore';
import { useUserStore } from '../store/userStore';
import { db } from '../services/supabase';
import { TrendCharts, MagicStick } from '@element-plus/icons-vue';

const router = useRouter();
const healthStore = useHealthStore();
const userStore = useUserStore();

const isSubmitting = ref(false);

const form = reactive({
  weight: 0,
  sleepHours: 7,
  checkinPeriod: '' as '' | 'morning' | 'noon' | 'evening',
  steps: 0,
  waterCups: 0,
  mood: 3,
  energyLevel: 5,
  systolic: undefined as number | undefined,
  diastolic: undefined as number | undefined,
  heartRate: undefined as number | undefined,
  stressLevel: 3,
  notes: ''
});

// 加载最近一次的体重作为默认值
// 实际开发中可以从 store 获取

const submitCheckIn = async () => {
  isSubmitting.value = true;
  try {
    const notes = `步数: ${form.steps}, 饮水: ${form.waterCups}, 心情: ${form.mood}, 能量: ${form.energyLevel}. ${form.notes}`;

    const userId = userStore.userProfile?.id;
    if (!userId) {
      throw new Error('用户未登录');
    }

    const checkinPayload = {
      user_id: userId,
      check_in_date: new Date().toISOString().split('T')[0],
      weight: form.weight || null,
      sleep_hours: form.sleepHours || null,
      steps: form.steps || null,
      water_cups: form.waterCups || null,
      mood: String(form.mood),
      energy_level: form.energyLevel || null,
      systolic_pressure: form.systolic || null,
      diastolic_pressure: form.diastolic || null,
      heart_rate: form.heartRate || null,
      stress_level: form.stressLevel || null,
      checkin_period: form.checkinPeriod || null,
      notes
    };

    const checkinResult = await db.create('daily_checkins', checkinPayload);
    if (!checkinResult.success) {
      throw new Error(checkinResult.error || checkinResult.message || '打卡保存失败');
    }
    const shouldSummarize = form.checkinPeriod === 'evening' || (!form.checkinPeriod && new Date().getHours() >= 18);
    if (shouldSummarize) {
      const summarySaved = await healthStore.createDailySummaryFromCheckins();
      if (!summarySaved) {
        throw new Error(healthStore.error || '生成汇总失败');
      }
      ElMessage.success('打卡成功，已生成今日汇总。');
      router.push('/health');
      return;
    }

    await healthStore.fetchDailyCheckins();
    ElMessage.success('打卡成功！已记录今日状态。');
    router.push('/health');
  } catch (error) {
    console.error('打卡失败', error);
    ElMessage.error(error instanceof Error ? error.message : '打卡失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="daily-check-in ghibli-container">
    <div class="dashboard-header">
      <h1 class="ghibli-title">森林晨露 (每日打卡)</h1>
      <p class="ghibli-subtitle">记录此刻的生机，让健康如森林般茂盛</p>
    </div>

    <div class="ghibli-parchment-card check-in-parchment">
      <el-form :model="form" label-width="100px" @submit.prevent="submitCheckIn" label-position="top">
        
        <!-- 今日指标 -->
        <div class="ghibli-section-header">
          <el-icon class="forest-green"><TrendCharts /></el-icon>
          <span>今日律动</span>
        </div>
        
        <el-row :gutter="24">
          <el-col :span="24" :sm="12">
            <el-form-item label="体重 (kg)">
              <el-input-number v-model="form.weight" :precision="1" :step="0.1" :min="20" :max="300" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="12">
            <el-form-item label="睡眠 (小时)">
              <el-input-number v-model="form.sleepHours" :precision="1" :step="0.5" :min="0" :max="24" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="打卡时段">
          <el-select v-model="form.checkinPeriod" placeholder="请选择时段" class="ghibli-select">
            <el-option label="早晨的清新" value="morning" />
            <el-option label="午后的暖阳" value="noon" />
            <el-option label="静谧的夜晚" value="evening" />
          </el-select>
        </el-form-item>

        <el-row :gutter="24">
          <el-col :span="24" :sm="12">
            <el-form-item label="收缩压 (mmHg)">
              <el-input-number v-model="form.systolic" :min="50" :max="250" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="12">
            <el-form-item label="舒张压 (mmHg)">
              <el-input-number v-model="form.diastolic" :min="30" :max="150" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24" :sm="12">
            <el-form-item label="心率 (bpm)">
              <el-input-number v-model="form.heartRate" :min="40" :max="200" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="12">
            <el-form-item label="压力感受">
              <el-rate v-model="form.stressLevel" :max="5" class="ghibli-rate" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24" :sm="12">
            <el-form-item label="森林漫步 (步数)">
              <el-input-number v-model="form.steps" :step="500" :min="0" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :sm="12">
            <el-form-item label="甘甜泉水 (杯)">
              <el-input-number v-model="form.waterCups" :step="1" :min="0" class="ghibli-input-number" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 心情与状态 -->
        <div class="ghibli-section-header mt-lg">
          <el-icon class="sunset-orange"><MagicStick /></el-icon>
          <span>心情物语</span>
        </div>
        
        <el-form-item label="当前心情">
          <el-rate v-model="form.mood" :texts="['极差', '差', '一般', '好', '极好']" show-text class="ghibli-rate" />
        </el-form-item>
        
        <el-form-item label="能量等级">
          <el-slider v-model="form.energyLevel" :min="1" :max="10" show-stops class="ghibli-slider" />
        </el-form-item>

        <el-form-item label="森林日记 (备注)">
          <el-input type="textarea" v-model="form.notes" placeholder="今天有什么特别的发现吗？" class="ghibli-textarea" />
        </el-form-item>

        <div class="form-actions-ghibli">
          <el-button type="primary" native-type="submit" :loading="isSubmitting" class="ghibli-btn-large">
            记录此刻
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ghibli-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.ghibli-subtitle {
  text-align: center;
  color: #8b7355;
  font-style: italic;
  margin-top: -20px;
  margin-bottom: 40px;
}

.check-in-parchment {
  background-color: #fefcf0 !important;
  border: 3px solid #e5dcc3 !important;
  padding: 40px !important;
  box-shadow: 0 15px 45px rgba(139, 69, 19, 0.1) !important;
}

.ghibli-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 800;
  color: #5d3a1a;
  margin-bottom: 20px;
  border-bottom: 2px dashed #f0e6d2;
  padding-bottom: 10px;
  
  .forest-green { color: #228B22; }
  .sunset-orange { color: #FFA500; }
}

.ghibli-input-number, .ghibli-select, .ghibli-textarea {
  width: 100% !important;
}

:deep(.el-input-number__increase), :deep(.el-input-number__decrease) {
  background-color: #fdfaf2 !important;
  border-color: #f0e6d2 !important;
}

:deep(.el-input__wrapper) {
  background-color: white !important;
  border: 2px solid #f0e6d2 !important;
  box-shadow: none !important;
  border-radius: 12px !important;
}

.ghibli-btn-large {
  width: 100%;
  height: 50px !important;
  font-size: 1.2rem !important;
  margin-top: 20px;
}

.form-actions-ghibli {
  margin-top: 40px;
}

.mt-lg { margin-top: 30px; }

@media (max-width: 768px) {
  .check-in-parchment { padding: 20px !important; }
}
</style>
