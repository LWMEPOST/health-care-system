<template>
  <div class="health-data-display ghibli-parchment">
    <el-card class="ghibli-main-card" v-if="healthData">
      <template #header>
        <div class="ghibli-card-header">
          <div class="header-left">
            <el-icon class="header-icon"><TrendCharts /></el-icon>
            <span>健康状态概览</span>
          </div>
          <span class="record-date">📅 记录时间: {{ formatDate(healthData.created_at || healthData.recordedAt) }}</span>
        </div>
      </template>

      <!-- 健康评分 - 吉卜力风格 -->
      <div class="ghibli-score-section">
        <div class="score-visualization">
          <el-progress
            type="dashboard"
            :value="healthScore"
            :percentage="healthScore"
            :stroke-width="12"
            :width="160"
            :color="ghibliProgressColors"
          >
            <template #default="{ percentage }">
              <div class="score-circle-inner">
                <span class="score-value">{{ percentage }}</span>
                <span class="score-label">健康活力值</span>
              </div>
            </template>
          </el-progress>
        </div>
        <div class="score-info">
          <div class="score-status" :style="{ color: getScoreColor(healthScore) }">
            {{ getScoreDescription(healthScore) }}
          </div>
          <p class="score-hint">保持自然的律动，让身体如森林般充满生机</p>
        </div>
      </div>

      <div class="ghibli-watercolor-divider"></div>

      <!-- 数据概览卡片 - 宫崎骏插画感布局 -->
      <div class="ghibli-grid">
        <!-- 基础信息 -->
        <div class="ghibli-data-card info-card">
          <div class="card-tag">基础信息</div>
          <div class="data-items">
            <div class="ghibli-item">
              <span class="label">年龄</span>
              <span class="value">{{ healthData.age }}岁</span>
            </div>
            <div class="ghibli-item">
              <span class="label">身高</span>
              <span class="value">{{ healthData.height }}cm</span>
            </div>
            <div class="ghibli-item">
              <span class="label">体重</span>
              <span class="value">{{ healthData.weight }}kg</span>
            </div>
            <div class="ghibli-item bmi-item" :class="getBMIClass(healthData.bmi)">
              <span class="label">BMI 指数</span>
              <div class="value-group">
                <span class="value">{{ healthData.bmi }}</span>
                <el-tag size="small" effect="dark" :type="getBMITagType(healthData.bmi)">{{ getBMICategory(healthData.bmi) }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 健康指标 -->
        <div class="ghibli-data-card metrics-card">
          <div class="card-tag">生理指标</div>
          <div class="data-items">
            <div class="ghibli-item">
              <span class="label">血压</span>
              <span class="value" :class="getBloodPressureClass()">
                {{ healthData.systolic }}/{{ healthData.diastolic }} <small>mmHg</small>
              </span>
            </div>
            <div class="ghibli-item">
              <span class="label">心率</span>
              <span class="value" :class="getHeartRateClass()">
                {{ healthData.heartRate }} <small>bpm</small>
              </span>
            </div>
            <div class="ghibli-item rate-item">
              <span class="label">压力感</span>
              <el-rate v-model="healthData.stressLevel" :max="5" disabled show-score text-color="#8B4513" />
            </div>
          </div>
        </div>

        <!-- 生活习惯 -->
        <div class="ghibli-data-card habits-card">
          <div class="card-tag">生活律动</div>
          <div class="data-items">
            <div class="ghibli-item">
              <span class="label">运动频率</span>
              <span class="value text-forest">{{ getExerciseFrequencyText() }}</span>
            </div>
            <div class="ghibli-item">
              <span class="label">睡眠时间</span>
              <span class="value">{{ healthData.sleepHours }}小时</span>
            </div>
            <div class="ghibli-item rate-item">
              <span class="label">睡眠质量</span>
              <el-rate v-model="healthData.sleepQualityValue" :max="5" disabled show-score text-color="#8B4513" />
            </div>
          </div>
        </div>
      </div>

      <div class="ghibli-watercolor-divider"></div>

      <!-- 今日总结与打卡 -->
      <el-row :gutter="24" class="bottom-sections">
        <el-col :span="24" :md="12">
          <div class="ghibli-summary-section">
            <div class="section-title">
              <el-icon><Calendar /></el-icon>
              <span>本月足迹</span>
            </div>
            <!-- 简化版日历展示 -->
            <div class="mini-calendar">
              <div class="calendar-header">{{ currentYear }}年{{ currentMonth }}月</div>
              <div class="calendar-stats">本月已坚持打卡 <strong>{{ checkInCount }}</strong> 天</div>
              <div class="calendar-grid-ghibli">
                <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
                <div 
                  v-for="(date, index) in calendarDays" 
                  :key="index" 
                  class="day-cell"
                  :class="{ 'is-today': isToday(date), 'has-data': hasData(date) }"
                >
                  {{ date.getDate() }}
                </div>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="24" :md="12">
          <div class="ghibli-summary-section today-summary-box" v-if="todaySummary">
            <div class="section-title">
              <el-icon><MagicStick /></el-icon>
              <span>今日健康物语</span>
            </div>
            <div class="summary-bubble">
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="icon">🚶</span>
                  <span class="label">步数</span>
                  <span class="val">{{ todaySummary.totalSteps }}</span>
                </div>
                <div class="summary-item">
                  <span class="icon">💧</span>
                  <span class="label">饮水</span>
                  <span class="val">{{ todaySummary.totalWater }}杯</span>
                </div>
                <div class="summary-item">
                  <span class="icon">💓</span>
                  <span class="label">平均心率</span>
                  <span class="val">{{ todaySummary.avgHeartRate || '-' }}</span>
                </div>
                <div class="summary-item">
                  <span class="icon">🧘</span>
                  <span class="label">平均压力</span>
                  <span class="val">{{ todaySummary.avgStressLevel || '-' }}</span>
                </div>
              </div>
              <div class="periods-tag">已打卡: {{ todaySummary.periodsText }}</div>
            </div>
          </div>
          <el-empty v-else description="今天还没有留下健康的足迹呢" :image-size="80" />
        </el-col>
      </el-row>
    </el-card>

    <el-empty v-else description="快来种下你的第一颗健康种子吧" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useHealthStore } from '@/store/healthStore';
import { TrendCharts, Calendar, MagicStick } from '@element-plus/icons-vue';

const healthStore = useHealthStore();

// 健康数据映射
const healthData = computed(() => {
  const data = healthStore.currentHealthData as any;
  if (!data) return null;
  
  // 转换睡眠质量为评分
  const qualityMap: Record<string, number> = { '优秀': 5, '良好': 4, '一般': 3, '较差': 2, '很差': 1 };
  return {
    ...data,
    sleepQualityValue: qualityMap[data.sleepQuality] || 3
  };
});

const healthHistory = computed(() => healthStore.healthHistory as any[]);
// const dailyCheckins = computed(() => healthStore.dailyCheckins as any[]);

// 日历相关逻辑
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

const calendarDays = computed(() => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const days: Date[] = [];
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
});

const isToday = (date: Date) => date.toDateString() === today.toDateString();
const hasData = (date: Date) => healthHistory.value.some(r => new Date(r.created_at || r.recordedAt).toDateString() === date.toDateString());

const checkInCount = computed(() => {
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const uniqueDays = new Set(healthStore.dailyCheckins
    .filter(r => {
      const date = new Date(r.check_in_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .map(r => new Date(r.check_in_date).getDate())
  );
  return uniqueDays.size;
});

const todaySummary = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  
  const todayCheckins = healthStore.dailyCheckins.filter(r => r.check_in_date === todayStr);
  
  if (!todayCheckins.length) return null;
  
  const totalSteps = todayCheckins.reduce((s, i) => s + (Number(i.steps) || 0), 0);
  const totalWater = todayCheckins.reduce((s, i) => s + (Number(i.water_cups) || 0), 0);
  const periods = Array.from(new Set(todayCheckins.map(i => i.checkin_period))).filter(Boolean);
  const periodMap: any = { morning: '早', noon: '中', evening: '晚' };
  
  return {
    totalSteps,
    totalWater,
    periodsText: periods.map(p => periodMap[p] || p).join('/'),
    avgHeartRate: Math.round(todayCheckins.reduce((s, i) => s + (i.heart_rate || 0), 0) / todayCheckins.length) || null,
    avgStressLevel: (todayCheckins.reduce((s, i) => s + (i.stress_level || 0), 0) / todayCheckins.length).toFixed(1) || null
  };
});

const ghibliProgressColors = [
  { color: '#FFA500', percentage: 20 },
  { color: '#FFB6C1', percentage: 40 },
  { color: '#98FB98', percentage: 60 },
  { color: '#87CEEB', percentage: 80 },
  { color: '#228B22', percentage: 100 },
];

const healthScore = ref(0);

// 更新健康评分
const updateHealthScore = () => {
  if (!healthData.value) {
    healthScore.value = 0;
    return;
  }
  
  let score = 100;
  
  // BMI评分 (30分)
  const currentBmi = healthData.value.bmi || 0;
  if (currentBmi < 18.5 || currentBmi >= 28) score -= 15;
  else if (currentBmi < 19 || currentBmi >= 24) score -= 5;
  
  // 血压评分 (25分)
  const systolic = healthData.value.systolic || 0;
  const diastolic = healthData.value.diastolic || 0;
  if (systolic > 140 || diastolic > 90) score -= 20;
  else if (systolic > 130 || diastolic > 85) score -= 10;
  else if (systolic < 90 || diastolic < 60) score -= 15;
  
  // 心率评分 (20分)
  const heartRate = healthData.value.heartRate || 0;
  if (heartRate > 100 || heartRate < 60) score -= 15;
  else if (heartRate > 90 || heartRate < 65) score -= 5;
  
  // 压力评分 (10分)
  const stressLevel = healthData.value.stressLevel || 0;
  if (stressLevel >= 7) score -= 8; // 高压力（7-10）
  else if (stressLevel >= 4) score -= 4; // 中等压力（4-6）
  
  // 睡眠评分 (15分)
  const sleepHours = healthData.value.sleepHours || 0;
  if (sleepHours < 6 || sleepHours > 9) score -= 10;
  else if (sleepHours < 7 || sleepHours > 8) score -= 5;
  
  healthScore.value = Math.max(0, score);
};

// 监听数据变化，更新评分
watch(healthData, () => {
  updateHealthScore();
}, { immediate: true });

const getScoreColor = (s: number) => s > 80 ? '#228B22' : '#FFA500';
const getScoreDescription = (s: number) => s > 80 ? '生机勃勃' : '需要呵护';
const formatDate = (d: any) => d ? new Date(d).toLocaleString() : '未知';

// 获取BMI对应的样式类
const getBMIClass = (bmi?: number): string => {
  if (bmi === undefined || bmi === null || isNaN(bmi)) return '';
  if (bmi < 18.5) return 'underweight';
  if (bmi < 24) return 'normal';
  if (bmi < 28) return 'overweight';
  return 'obese';
};

// 获取BMI分类
const getBMICategory = (bmi?: number): string => {
  if (bmi === undefined || bmi === null || isNaN(bmi)) return '未计算';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
};

const getBMITagType = (bmi?: number) => {
  if (!bmi) return 'info';
  if (bmi < 18.5) return 'warning';
  if (bmi < 24) return 'success';
  if (bmi < 28) return 'warning';
  return 'danger';
};

// 获取血压对应的样式类
const getBloodPressureClass = (): string => {
  if (!healthData.value) return '';
  const systolic = healthData.value.systolic || 0;
  const diastolic = healthData.value.diastolic || 0;
  
  if (systolic > 140 || diastolic > 90) return 'bp-high';
  if (systolic < 90 || diastolic < 60) return 'bp-low';
  return 'bp-normal';
};

// 获取心率对应的样式类
const getHeartRateClass = (): string => {
  if (!healthData.value) return '';
  const heartRate = healthData.value.heartRate || 0;
  
  if (heartRate < 60 || heartRate > 100) return 'hr-abnormal';
  return 'hr-normal';
};

const getExerciseFrequencyText = () => {
  const freq = healthData.value?.exerciseFrequency;
  const freqMap: Record<string, string> = {
    'once_twice': '1-2次/周',
    'three_four': '3-4次/周',
    'five_plus': '5次以上/周',
    'rarely': '偶尔运动',
    'never': '从不运动'
  };
  return freqMap[freq] || freq || '暂无数据';
};

// 设置组件名称
// @ts-ignore
defineOptions({
  name: 'HealthDataDisplay'
});
</script>

<style scoped lang="scss">
.health-data-display {
  padding: 20px;
  position: relative;
}

.ghibli-main-card {
  background-color: #fefcf0; /* 更暖的底色 */
  background-image: url('https://www.transparenttextures.com/patterns/natural-paper.png');
  border-radius: 24px !important;
  border: 3px solid #e5dcc3 !important;
  box-shadow: 0 15px 40px rgba(139, 69, 19, 0.08) !important;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at top right, rgba(135, 206, 235, 0.05), transparent);
    pointer-events: none;
  }
}

.ghibli-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    font-weight: 900;
    color: #5d3a1a; /* 更深的棕色 */
    text-shadow: 1px 1px 0px white;
  }
  
  .record-date {
    font-size: 14px;
    color: #8b7355;
    font-weight: 600;
  }
}

.ghibli-score-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
  padding: 40px 0;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  
  .score-circle-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1;
    
    .score-value {
      font-size: 48px;
      font-weight: 900;
      color: #5d3a1a;
    }
    
    .score-label {
      font-size: 13px;
      color: #8b7355;
      margin-top: 10px;
      font-weight: 700;
    }
  }
  
  .score-info {
    .score-status {
      font-size: 28px;
      font-weight: 900;
      margin-bottom: 12px;
      text-shadow: 1px 1px 0px white;
    }
    
    .score-hint {
      font-size: 15px;
      color: #5d3a1a;
      opacity: 0.8;
      font-style: italic;
      max-width: 300px;
      line-height: 1.5;
    }
  }
}

.ghibli-watercolor-divider {
  height: 6px;
  background: linear-gradient(90deg, transparent, rgba(34, 139, 34, 0.3), transparent);
  margin: 40px 60px;
  border-radius: 10px;
  filter: blur(1px);
}

.ghibli-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 30px;
}

.ghibli-data-card {
  padding: 35px 24px 25px;
  border-radius: 24px;
  position: relative;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  
  /* 增强对比度的背景色方案 */
  &.info-card { 
    background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); 
    border: 2px solid #7dd3fc;
  }
  &.metrics-card { 
    background: linear-gradient(135deg, #fff1f2 0%, #fecaca 100%); 
    border: 2px solid #fda4af;
  }
  &.habits-card { 
    background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%); 
    border: 2px solid #86efac;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 35px rgba(139, 69, 19, 0.12) !important;
    z-index: 2;
  }
  
  .card-tag {
    position: absolute;
    top: -14px;
    left: 24px;
    background: #5d3a1a;
    color: #fdfaf2;
    padding: 5px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 800;
    box-shadow: 3px 3px 0px rgba(0,0,0,0.1);
    letter-spacing: 1px;
  }
}

.data-items {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 10px;
}

.ghibli-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(139, 69, 19, 0.05);
  padding-bottom: 8px;
  
  .label {
    font-size: 15px;
    color: #5d3a1a;
    font-weight: 700;
    opacity: 0.7;
  }
  
  .value {
    font-size: 18px;
    font-weight: 800;
    color: #2d3748; /* 更深的颜色提升可读性 */
    
    small {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.6;
      margin-left: 2px;
    }
  }
}

.bmi-item {
  flex-direction: column;
  align-items: flex-start; 
  gap: 8px;
  
  .value-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.rate-item {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.text-forest { color: #228B22; }

.bottom-sections {
  padding: 20px;
}

.ghibli-summary-section {
  background: white;
  padding: 20px;
  border-radius: 20px;
  border: 2px solid #f0e6d2;
  height: 100%;
  margin-bottom: 20px;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 800;
    color: #8B4513;
    margin-bottom: 20px;
  }
}

.mini-calendar {
  width: 100%;
  overflow: hidden;
  
  .calendar-header {
    font-weight: 700;
    color: #4a453a;
    margin-bottom: 5px;
  }
  
  .calendar-stats {
    font-size: 13px;
    color: #a09680;
    margin-bottom: 15px;
    
    strong { color: #228B22; }
  }
}

.calendar-grid-ghibli {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  width: 100%;
  
  .weekday {
    font-size: 11px;
    text-align: center;
    color: #a09680;
    padding-bottom: 5px;
    font-weight: 700;
  }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    border-radius: 50%;
    color: #d2cebc;
    min-width: 0;
    
    &.has-data {
      background-color: #98FB98;
      color: #228B22;
      font-weight: 700;
    }
    
    &.is-today {
      border: 2px solid #87CEEB;
      color: #87CEEB;
    }
  }
}

.summary-bubble {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 20px;
  border: 2px solid #e0f2fe;
  
  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .summary-item {
    display: flex;
    flex-direction: column;
    
    .icon { font-size: 18px; margin-bottom: 2px; }
    .label { font-size: 11px; color: #718096; }
    .val { font-size: 16px; font-weight: 800; color: #2d3748; }
  }
  
  .periods-tag {
    margin-top: 12px;
    font-size: 11px;
    color: #87CEEB;
    font-weight: 700;
    text-align: right;
  }
}

@media (max-width: 768px) {
  .health-data-display {
    padding: 10px;
  }
  
  .ghibli-main-card {
    border-radius: 16px !important;
  }
  
  .ghibli-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    
    .header-left { font-size: 18px; }
  }
  
  .ghibli-score-section {
    gap: 24px;
    padding: 20px 0;
    
    .score-circle-inner .score-value { font-size: 36px; }
    .score-info .score-status { font-size: 22px; }
  }
  
  .ghibli-watercolor-divider {
    margin: 20px 30px;
  }
  
  .ghibli-grid {
    grid-template-columns: 1fr !important; /* 强制单列显示 */
    padding: 15px;
    gap: 20px;
  }
  
  .bottom-sections {
    padding: 15px;
  }
}
</style>
