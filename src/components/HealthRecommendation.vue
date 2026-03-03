<template>
  <div class="health-recommendations ghibli-theme">
    <div class="cloud-decoration cloud-1"></div>
    <div class="cloud-decoration cloud-2"></div>
    
    <h2 class="recommendations-title">
      <span class="title-text">健康改进建议</span>
      <div class="title-underline"></div>
    </h2>
    
    <!-- AI 深度分析触发 -->
    <div class="ai-analysis-trigger-ghibli">
      <el-button 
        type="primary" 
        size="large" 
        :loading="isAnalyzing" 
        @click="generateAIAnalysis"
        class="ghibli-btn-primary"
        :disabled="healthStore.dailyAnalysisCount >= 5"
      >
        <el-icon class="magic-wand-icon"><MagicStick /></el-icon>
        <span>DeepSeek 灵感分析</span>
      </el-button>
      <div class="ai-usage-badge" :class="{ 'at-limit': healthStore.dailyAnalysisCount >= 5 }">
        今日已用: {{ healthStore.dailyAnalysisCount }} / 5
      </div>
      <p class="ai-hint-ghibli">让 AI 小精灵为您拨开健康的迷雾</p>
    </div>

    <!-- AI 分析结果展示 -->
    <div v-if="aiResult" class="ai-result-section-ghibli">
      <div class="ghibli-parchment-card">
        <!-- 头部标题 -->
        <div class="ghibli-report-header">
          <div class="header-main">
            <el-icon class="ghibli-icon-forest"><TrendCharts /></el-icon>
            <span class="report-title-ghibli">AI 健康评估报告</span>
          </div>
          <div class="header-score-ghibli">
            <el-progress 
              type="circle" 
              :percentage="aiResult.score" 
              :width="80" 
              :stroke-width="8"
              :color="ghibliColors"
            >
              <template #default="{ percentage }">
                <div class="ghibli-score-content">
                  <span class="ghibli-score-num">{{ percentage }}</span>
                  <span class="ghibli-score-label">健康值</span>
                </div>
              </template>
            </el-progress>
          </div>
        </div>

        <div class="ghibli-divider"></div>

        <!-- 评估结论 -->
        <div class="ghibli-section conclusion">
          <div class="ghibli-section-header">
            <el-icon class="ghibli-section-icon sky-blue"><InfoFilled /></el-icon>
            <span>森林物语 (评估结论)</span>
          </div>
          <div class="ghibli-bubble-content">
            <p>{{ aiResult.summary }}</p>
          </div>
        </div>

        <!-- 潜在风险 - 横向滚动布局 -->
        <div class="ghibli-section risks" v-if="aiResult.risks?.length">
          <div class="ghibli-section-header">
            <el-icon class="ghibli-section-icon sunset-orange"><WarningFilled /></el-icon>
            <span>荆棘提醒 (潜在风险)</span>
          </div>
          <div class="ghibli-horizontal-scroll">
            <div v-for="(risk, idx) in aiResult.risks" :key="idx" class="ghibli-risk-item horizontal-card">
              <span class="ghibli-leaf-bullet">🍃</span>
              <span class="risk-text">{{ risk }}</span>
            </div>
          </div>
        </div>

        <!-- 改进建议 - 横向滚动布局 -->
        <div class="ghibli-section advice" v-if="aiResult.recommendations?.length">
          <div class="ghibli-section-header">
            <el-icon class="ghibli-section-icon forest-green"><Opportunity /></el-icon>
            <span>生机指南 (核心建议)</span>
          </div>
          <div class="ghibli-horizontal-scroll">
            <div v-for="(rec, idx) in aiResult.recommendations" :key="idx" class="ghibli-advice-item horizontal-card">
              <el-icon class="ghibli-check-icon"><CircleCheck /></el-icon>
              <span class="advice-text">{{ rec }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史分析记录 -->
    <div class="ghibli-history-section" v-if="healthStore.aiAnalyses.length > 1">
      <div class="history-title-ghibli">
        <el-icon><Timer /></el-icon>
        <span>历史灵感记录</span>
      </div>
      <div class="history-tags-scroll">
        <div 
          v-for="history in healthStore.aiAnalyses" 
          :key="history.id"
          class="history-tag-item"
          :class="{ active: aiResult && aiResult.summary === history.content.summary }"
          @click="loadHistoryAnalysis(history)"
        >
          <span class="time">{{ new Date(history.created_at).toLocaleDateString() }}</span>
          <span class="score">健康值: {{ history.content.score }}</span>
        </div>
      </div>
    </div>

    <div class="recommendations-container">
      <!-- BMI 相关建议 -->
      <el-card class="recommendation-card" v-if="bmiRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><DataLine /></el-icon>
            <span>BMI 健康建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in bmiRecommendations"
            :key="`bmi-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 血压相关建议 -->
      <el-card class="recommendation-card" v-if="bloodPressureRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Heart /></el-icon>
            <span>血压健康建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in bloodPressureRecommendations"
            :key="`bp-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 心率相关建议 -->
      <el-card class="recommendation-card" v-if="heartRateRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Timer /></el-icon>
            <span>心率健康建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in heartRateRecommendations"
            :key="`hr-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 压力相关建议 -->
      <el-card class="recommendation-card" v-if="stressRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Warning /></el-icon>
            <span>压力管理建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in stressRecommendations"
            :key="`stress-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 运动相关建议 -->
      <el-card class="recommendation-card" v-if="exerciseRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><FitnessCenter /></el-icon>
            <span>运动建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in exerciseRecommendations"
            :key="`exercise-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 睡眠相关建议 -->
      <el-card class="recommendation-card" v-if="sleepRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Moon /></el-icon>
            <span>睡眠建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in sleepRecommendations"
            :key="`sleep-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 饮食相关建议 -->
      <el-card class="recommendation-card" v-if="dietRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Food /></el-icon>
            <span>饮食建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in dietRecommendations"
            :key="`diet-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 总体健康建议 -->
      <el-card class="recommendation-card" v-if="generalRecommendations.length > 0">
        <template #header>
          <div class="card-header">
            <el-icon><Check /></el-icon>
            <span>总体健康建议</span>
          </div>
        </template>
        <div class="recommendations-list">
          <el-alert
            v-for="(recommendation, index) in generalRecommendations"
            :key="`general-${index}`"
            :type="recommendation.type"
            :title="recommendation.title"
            :description="recommendation.description"
            show-icon
          ></el-alert>
        </div>
      </el-card>
      
      <!-- 无数据提示 -->
      <el-empty v-if="!hasRecommendations" description="暂无健康数据，无法生成建议"></el-empty>
    </div>
    
    <!-- 30天行动计划 -->
    <div class="ghibli-action-plan" v-if="hasRecommendations">
      <div class="ghibli-parchment-card action-parchment">
        <div class="ghibli-section-header">
          <el-icon class="ghibli-section-icon cherry-pink"><Setting /></el-icon>
          <span>成长的足迹 (30天行动计划)</span>
        </div>
        <div class="ghibli-action-items">
          <div class="ghibli-action-item" v-for="(item, index) in actionPlanItems" :key="index">
            <el-checkbox class="ghibli-checkbox">
              <div class="action-content-ghibli">
                <span class="action-task-ghibli">{{ item.task }}</span>
                <span class="action-benefit-ghibli">{{ item.benefit }}</span>
              </div>
            </el-checkbox>
          </div>
        </div>
        <!-- 成长植物装饰 -->
        <div class="sprout-decoration">🌱</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { 
  DataLine, 
  FirstAidKit as Heart, 
  Timer, 
  Warning, 
  Football as FitnessCenter, 
  Moon, 
  Food, 
  Check, 
  Setting,
  MagicStick,
  TrendCharts,
  WarningFilled,
  InfoFilled,
  CircleCheck,
  Opportunity
} from '@element-plus/icons-vue';
import { HealthStorageService } from '@/services/healthStorage';
import { HealthAnalysisAgent, HealthAnalysisResult } from '@/agents/HealthAnalysisAgent';
import { ElMessage, ElMessageBox } from 'element-plus/es';
import { useHealthStore } from '@/store/healthStore';

const healthStore = useHealthStore();

// ... (rest of the script)

// 定义健康数据接口
interface HealthData {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  stressLevel?: number;
  exerciseFrequency?: string;
  sleepQuality?: string;
  dietPreferences?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
}

// 定义建议接口
interface Recommendation {
  type: 'success' | 'warning' | 'info' | 'danger';
  title: string;
  description: string;
}

interface ActionItem {
  task: string;
  benefit: string;
}

// 组件属性
const props = defineProps<{
  healthData?: HealthData;
}>();

// 健康数据 - 从本地存储获取
const currentHealthData = ref<HealthData | null>(null);

// AI 分析相关状态
const isAnalyzing = ref(false);
const aiResult = ref<HealthAnalysisResult | null>(null);
const analysisAgent = new HealthAnalysisAgent();

const ghibliColors = [
  { color: '#FFA500', percentage: 20 }, // 夕阳橙
  { color: '#FFB6C1', percentage: 40 }, // 樱花粉
  { color: '#98FB98', percentage: 60 }, // 薄荷绿
  { color: '#87CEEB', percentage: 80 }, // 天空蓝
  { color: '#228B22', percentage: 100 }, // 森林绿
];

// 执行 AI 深度分析
const generateAIAnalysis = async () => {
  if (!currentHealthData.value) {
    ElMessage.warning('请先录入健康数据以进行 AI 分析');
    return;
  }

  // 检查今日额度
  if (healthStore.dailyAnalysisCount >= 5) {
    ElMessageBox.alert('今日 5 次 DeepSeek 灵感分析额度已用完，请明天再来。', '额度提醒', {
      confirmButtonText: '我知道了',
      type: 'warning'
    });
    return;
  }

  isAnalyzing.value = true;
  try {
    const response = await analysisAgent.process(currentHealthData.value);
    if (response.success && response.data) {
      aiResult.value = response.data;
      // 保存到数据库
      await healthStore.saveAIAnalysis(response.data);
      ElMessage.success(`AI 健康分析生成成功 (今日已用 ${healthStore.dailyAnalysisCount}/5)`);
    } else {
      throw new Error(response.error || '分析生成失败');
    }
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    ElMessage.error(`AI 分析失败: ${error.message || '请检查网络或 DeepSeek 配置'}`);
  } finally {
    isAnalyzing.value = false;
  }
};

// 切换历史记录
const loadHistoryAnalysis = (analysis: any) => {
  aiResult.value = analysis.content;
  ElMessage.info('已加载历史分析记录');
};

onMounted(async () => {
  loadHealthData();
  // 加载历史记录
  await healthStore.fetchAIAnalyses();
  if (healthStore.aiAnalyses.length > 0 && !aiResult.value) {
    // 默认加载最新的一条
    aiResult.value = healthStore.aiAnalyses[0].content;
  }
});

// 从本地存储加载健康数据
const loadHealthData = () => {
  try {
    const data = HealthStorageService.getCurrentHealthData();
    if (data) {
      currentHealthData.value = data;
    } else {
      // 如果没有数据，使用默认数据
      currentHealthData.value = {
        age: 35,
        gender: 'male',
        height: 175,
        weight: 78,
        bmi: 25.5,
        systolic: 130,
        diastolic: 85,
        heartRate: 78,
        stressLevel: 7,
        exerciseFrequency: '3次/周',
        sleepQuality: '一般',
        dietPreferences: ['清淡', '蔬菜', '水果'],
        allergies: [],
        dietaryRestrictions: []
      };
    }
  } catch (error) {
    console.error('加载健康数据失败:', error);
    // 出错时使用默认数据
    currentHealthData.value = {
      age: 35,
      gender: 'male',
      height: 175,
      weight: 78,
      bmi: 25.5,
      systolic: 130,
      diastolic: 85,
      heartRate: 78,
      stressLevel: 7,
      exerciseFrequency: '3次/周',
      sleepQuality: '一般',
      dietPreferences: ['清淡', '蔬菜', '水果'],
      allergies: [],
      dietaryRestrictions: []
    };
  }
};

// 计算BMI分类
const bmiCategory = computed(() => {
  const bmi = currentHealthData.value?.bmi || (currentHealthData.value?.weight && currentHealthData.value?.height 
    ? currentHealthData.value.weight / Math.pow(currentHealthData.value.height / 100, 2) 
    : null);
    
  if (!bmi) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 24) return 'normal';
  if (bmi < 28) return 'overweight';
  return 'obese';
});

// 计算血压分类
const bloodPressureCategory = computed(() => {
  if (!currentHealthData.value) return null;
  const systolic = currentHealthData.value.systolic;
  const diastolic = currentHealthData.value.diastolic;
  
  if (!systolic || !diastolic) return null;
  if (systolic < 120 && diastolic < 80) return 'normal';
  if (systolic < 130 && diastolic < 80) return 'elevated';
  if (systolic < 140 || diastolic < 90) return 'hypertension1';
  return 'hypertension2';
});

// 计算心率分类
const heartRateCategory = computed(() => {
  if (!currentHealthData.value) return null;
  const heartRate = currentHealthData.value.heartRate;
  if (!heartRate) return null;
  if (heartRate < 60) return 'low';
  if (heartRate < 100) return 'normal';
  return 'high';
});

// 计算压力水平分类
const stressCategory = computed(() => {
  if (!currentHealthData.value) return null;
  const stressLevel = currentHealthData.value.stressLevel;
  if (stressLevel === undefined || stressLevel === null) return null;
  if (stressLevel <= 3) return 'low';
  if (stressLevel <= 7) return 'moderate';
  return 'high';
});

// 计算BMI建议
const bmiRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  const category = bmiCategory.value;
  
  if (!category) return recommendations;
  
  // 如果有 AI 建议，优先显示 AI 建议
  if (aiResult.value?.categorizedRecommendations?.bmi) {
    aiResult.value.categorizedRecommendations.bmi.forEach(desc => {
      recommendations.push({
        type: category === 'normal' ? 'success' : 'warning',
        title: 'AI 深度建议',
        description: desc
      });
    });
    return recommendations;
  }
  
  switch (category) {
    case 'underweight':
      recommendations.push({
        type: 'warning',
        title: '体重偏轻',
        description: '建议增加优质蛋白质摄入，如鸡肉、鱼类、豆类，保证足够热量，适当增加力量训练以增加肌肉量。'
      });
      break;
    case 'normal':
      recommendations.push({
        type: 'success',
        title: 'BMI正常',
        description: '保持当前良好状态，继续均衡饮食和规律运动。'
      });
      break;
    case 'overweight':
      recommendations.push({
        type: 'warning',
        title: '体重超重',
        description: '建议控制总热量摄入，增加蔬菜和水果比例，减少高脂高糖食物，每周至少进行150分钟中等强度有氧运动。'
      });
      break;
    case 'obese':
      recommendations.push({
        type: 'danger',
        title: '肥胖',
        description: '建议寻求专业营养师指导，制定个性化减重计划，控制饮食并增加运动量，定期监测体重变化。'
      });
      break;
  }
  
  return recommendations;
});

// 计算血压建议
const bloodPressureRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  const category = bloodPressureCategory.value;
  
  if (!category) return recommendations;
  
  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.bloodPressure) {
    aiResult.value.categorizedRecommendations.bloodPressure.forEach(desc => {
      recommendations.push({
        type: category === 'normal' ? 'success' : 'warning',
        title: 'AI 血压建议',
        description: desc
      });
    });
    return recommendations;
  }
  
  switch (category) {
    case 'normal':
      recommendations.push({
        type: 'success',
        title: '血压正常',
        description: '保持健康的生活方式，包括低盐饮食、规律运动和充足睡眠。'
      });
      break;
    case 'elevated':
      recommendations.push({
        type: 'warning',
        title: '血压偏高',
        description: '建议减少盐分摄入，增加钾的摄入（多吃蔬果），保持健康体重，规律监测血压。'
      });
      break;
    case 'hypertension1':
      recommendations.push({
        type: 'warning',
        title: '轻度高血压',
        description: '建议严格控制盐分摄入（每日不超过5克），增加运动，减轻压力，必要时咨询医生。'
      });
      break;
    case 'hypertension2':
      recommendations.push({
        type: 'danger',
        title: '高血压',
        description: '建议立即咨询医生，可能需要药物治疗。同时调整生活方式，包括严格低盐饮食、规律运动和压力管理。'
      });
      break;
  }
  
  return recommendations;
});

// 计算心率建议
const heartRateRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  const category = heartRateCategory.value;
  
  if (!category) return recommendations;
  
  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.heartRate) {
    aiResult.value.categorizedRecommendations.heartRate.forEach(desc => {
      recommendations.push({
        type: category === 'normal' ? 'success' : 'warning',
        title: 'AI 心率建议',
        description: desc
      });
    });
    return recommendations;
  }
  
  switch (category) {
    case 'low':
      recommendations.push({
        type: 'info',
        title: '心率偏低',
        description: '对于运动员或经常锻炼的人来说可能是正常的。但如果伴有头晕或疲劳，建议咨询医生。'
      });
      break;
    case 'normal':
      recommendations.push({
        type: 'success',
        title: '心率正常',
        description: '保持健康的生活方式，继续规律运动和均衡饮食。'
      });
      break;
    case 'high':
      recommendations.push({
        type: 'warning',
        title: '心率偏高',
        description: '建议减少咖啡因摄入，学会放松技巧，保证充足睡眠。如持续偏高，建议咨询医生。'
      });
      break;
  }
  
  return recommendations;
});

// 计算压力建议
const stressRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  const category = stressCategory.value;
  
  if (!category) return recommendations;
  
  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.stress) {
    aiResult.value.categorizedRecommendations.stress.forEach(desc => {
      recommendations.push({
        type: category === 'low' ? 'success' : 'warning',
        title: 'AI 压力管理建议',
        description: desc
      });
    });
    return recommendations;
  }
  
  switch (category) {
    case 'low':
      recommendations.push({
        type: 'success',
        title: '压力水平良好',
        description: '继续保持积极的心态和健康的生活习惯。'
      });
      break;
    case 'moderate':
      recommendations.push({
        type: 'info',
        title: '压力水平适中',
        description: '建议每天进行15-20分钟的放松活动，如深呼吸、冥想或瑜伽，保证充足睡眠。'
      });
      break;
    case 'high':
      recommendations.push({
        type: 'warning',
        title: '压力水平较高',
        description: '建议学习压力管理技巧，增加体育锻炼，保证充足睡眠，必要时寻求心理咨询。每天留出时间做自己喜欢的事情。'
      });
      break;
  }
  
  return recommendations;
});

// 计算运动建议
const exerciseRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  if (!currentHealthData.value) return recommendations;
  
  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.exercise) {
    aiResult.value.categorizedRecommendations.exercise.forEach(desc => {
      recommendations.push({
        type: 'info',
        title: 'AI 运动建议',
        description: desc
      });
    });
    return recommendations;
  }
  
  const exercise = currentHealthData.value.exerciseFrequency;
  
  if (!exercise || exercise.includes('少于')) {
    recommendations.push({
      type: 'warning',
      title: '运动量不足',
      description: '建议每周至少进行150分钟中等强度有氧运动，如快走、游泳或骑自行车，同时进行2-3次力量训练。'
    });
  } else if (exercise.includes('3-5')) {
    recommendations.push({
      type: 'info',
      title: '运动量适中',
      description: '保持当前运动频率，建议增加运动多样性，结合有氧运动和力量训练。'
    });
  } else {
    recommendations.push({
      type: 'success',
      title: '运动充足',
      description: '运动量良好，注意运动后充分休息和恢复，避免过度训练。'
    });
  }
  
  return recommendations;
});

// 计算睡眠建议
const sleepRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  if (!currentHealthData.value) return recommendations;

  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.sleep) {
    aiResult.value.categorizedRecommendations.sleep.forEach(desc => {
      recommendations.push({
        type: currentHealthData.value?.sleepQuality === '优秀' ? 'success' : 'info',
        title: 'AI 睡眠建议',
        description: desc
      });
    });
    return recommendations;
  }

  const sleep = currentHealthData.value.sleepQuality;
  
  if (!sleep || sleep === '较差' || sleep === '很差') {
    recommendations.push({
      type: 'warning',
      title: '睡眠质量不佳',
      description: '建议保持规律的睡眠时间，睡前避免使用电子设备，创建舒适的睡眠环境，睡前可尝试冥想或热水浴。'
    });
  } else if (sleep === '一般') {
    recommendations.push({
      type: 'info',
      title: '睡眠质量一般',
      description: '建议优化睡眠环境，保持规律作息，避免睡前摄入咖啡因或大量食物。'
    });
  } else {
    recommendations.push({
      type: 'success',
      title: '睡眠质量良好',
      description: '继续保持良好的睡眠习惯，这对整体健康非常重要。'
    });
  }
  
  return recommendations;
});

// 计算饮食建议
const dietRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  if (!currentHealthData.value) return recommendations;

  // AI 建议优先
  if (aiResult.value?.categorizedRecommendations?.diet) {
    aiResult.value.categorizedRecommendations.diet.forEach(desc => {
      recommendations.push({
        type: 'info',
        title: 'AI 饮食建议',
        description: desc
      });
    });
    return recommendations;
  }

  const preferences = currentHealthData.value.dietPreferences || [];
  
  if (preferences.includes('清淡')) {
    recommendations.push({
      type: 'success',
      title: '饮食清淡',
      description: '清淡饮食有助于控制血压和体重，建议继续保持。'
    });
  } else {
    recommendations.push({
      type: 'info',
      title: '饮食调整',
      description: '建议减少盐分和油脂摄入，增加蔬菜、水果和全谷物的比例。'
    });
  }
  
  if (!preferences.includes('蔬菜') || !preferences.includes('水果')) {
    recommendations.push({
      type: 'warning',
      title: '蔬果摄入不足',
      description: '建议每天摄入至少5份蔬果，以获取足够的维生素、矿物质和膳食纤维。'
    });
  }
  
  if (preferences.includes('油腻') || preferences.includes('辛辣')) {
    recommendations.push({
      type: 'info',
      title: '减少刺激性食物',
      description: '过多油腻或辛辣食物可能对消化系统造成负担，建议适量食用。'
    });
  }
  
  return recommendations;
});

// 计算总体建议
const generalRecommendations = computed<Recommendation[]>(() => {
  const recommendations: Recommendation[] = [];
  
  // 如果有 AI 结果，添加 AI 核心建议
  if (aiResult.value?.recommendations) {
    aiResult.value.recommendations.forEach(rec => {
      recommendations.push({
        type: 'success',
        title: 'AI 核心建议',
        description: rec
      });
    });
  }

  // 根据多个指标综合给出建议
  const hasMultipleWarnings = 
    (bloodPressureCategory.value === 'hypertension1' || bloodPressureCategory.value === 'hypertension2') ||
    (bmiCategory.value === 'obese') ||
    (stressCategory.value === 'high');
  
  if (hasMultipleWarnings) {
    recommendations.push({
      type: 'warning',
      title: '健康风险提示',
      description: '您有多项健康指标需要关注，建议尽快咨询医生或健康管理师，制定综合改善计划。'
    });
  }
  
  // 积极的生活方式建议
  recommendations.push({
    type: 'info',
    title: '健康生活方式',
    description: '无论当前健康状况如何，保持均衡饮食、规律运动、充足睡眠和积极心态都是维持健康的基础。'
  });
  
  return recommendations;
});

// 判断是否有建议
const hasRecommendations = computed(() => {
  return bmiRecommendations.value.length > 0 ||
         bloodPressureRecommendations.value.length > 0 ||
         heartRateRecommendations.value.length > 0 ||
         stressRecommendations.value.length > 0 ||
         exerciseRecommendations.value.length > 0 ||
         sleepRecommendations.value.length > 0 ||
         dietRecommendations.value.length > 0 ||
         generalRecommendations.value.length > 0;
});

// 生成30天行动计划
const actionPlanItems = computed<ActionItem[]>(() => {
  const items: ActionItem[] = [];
  
  // 基于健康数据生成个性化行动计划
  if (bmiCategory.value === 'overweight' || bmiCategory.value === 'obese') {
    items.push({
      task: '每天进行30分钟快走或慢跑',
      benefit: '帮助控制体重，改善心血管健康'
    });
    items.push({
      task: '减少精制碳水化合物摄入',
      benefit: '稳定血糖，减少脂肪堆积'
    });
  }
  
  if (bloodPressureCategory.value !== 'normal') {
    items.push({
      task: '每天测量并记录血压',
      benefit: '及时了解血压变化，调整生活方式'
    });
    items.push({
      task: '减少钠盐摄入，每日不超过5克',
      benefit: '帮助降低血压'
    });
  }
  
  if (stressCategory.value === 'high') {
    items.push({
      task: '每天进行15分钟冥想或深呼吸练习',
      benefit: '缓解压力，改善心理健康'
    });
    items.push({
      task: '保证每晚7-8小时睡眠',
      benefit: '恢复精力，减轻压力'
    });
  }
  
  // 通用健康行动项
  items.push({
    task: '每天饮用8杯水',
    benefit: '保持身体水分，促进新陈代谢'
  });
  items.push({
    task: '每天摄入至少5份蔬果',
    benefit: '提供丰富的维生素和矿物质'
  });
  items.push({
    task: '每周进行2-3次力量训练',
    benefit: '增强肌肉，提高基础代谢率'
  });
  items.push({
    task: '减少久坐时间，每小时起身活动5分钟',
    benefit: '改善血液循环，减少健康风险'
  });
  
  return items;
});

// 监听属性变化
watch(() => props.healthData, (newData: HealthData | undefined) => {
  if (newData) {
    currentHealthData.value = newData;
  }
}, { deep: true });

// 生命周期钩子
onMounted(() => {
  // 加载健康数据
  loadHealthData();
});
</script>

<style scoped>
.ghibli-theme {
  --ghibli-sky-blue: #87CEEB;
  --ghibli-forest-green: #228B22;
  --ghibli-sunset-orange: #FFA500;
  --ghibli-cherry-pink: #FFB6C1;
  --ghibli-earth-brown: #8B4513;
  --ghibli-mint-green: #98FB98;
  --ghibli-parchment: #fdfaf2;
  
  padding: 40px 20px;
  background-color: #f0f9ff; /* 浅蓝天色 */
  background-image: radial-gradient(circle at 50% 50%, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 装饰性云朵 */
.cloud-decoration {
  position: absolute;
  background: white;
  border-radius: 50px;
  opacity: 0.6;
  filter: blur(10px);
  z-index: 0;
  animation: floatCloud 20s linear infinite;
}

.cloud-1 {
  width: 120px;
  height: 40px;
  top: 50px;
  left: -150px;
}

.cloud-2 {
  width: 180px;
  height: 50px;
  top: 150px;
  right: -200px;
  animation-delay: -10s;
}

@keyframes floatCloud {
  from { transform: translateX(0); }
  to { transform: translateX(calc(100vw + 300px)); }
}

.recommendations-title {
  position: relative;
  z-index: 1;
  margin-bottom: 40px;
  text-align: center;
}

.title-text {
  font-size: 28px;
  font-weight: 800;
  color: var(--ghibli-earth-brown);
  letter-spacing: 2px;
  text-shadow: 2px 2px 0px rgba(255,255,255,0.8);
}

.title-underline {
  width: 120px;
  height: 6px;
  background: var(--ghibli-forest-green);
  margin: 8px auto 0;
  border-radius: 10px;
  opacity: 0.6;
}

/* AI 触发按钮 - 吉卜力风格 */
.ai-analysis-trigger-ghibli {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.ghibli-btn-primary {
  height: auto !important;
  padding: 16px 40px !important;
  font-size: 20px !important;
  font-weight: 700 !important;
  border-radius: 50px !important;
  background: linear-gradient(135deg, var(--ghibli-forest-green) 0%, #2d5a27 100%) !important;
  border: 4px solid var(--ghibli-parchment) !important;
  box-shadow: 0 10px 20px rgba(34, 139, 34, 0.3) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  color: white !important;
}

.ghibli-btn-primary:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 30px rgba(34, 139, 34, 0.4) !important;
}

.magic-wand-icon {
  margin-right: 10px;
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2) rotate(10deg); }
}

.ai-hint-ghibli {
  margin-top: 15px;
  color: var(--ghibli-earth-brown);
  font-style: italic;
  font-size: 15px;
  opacity: 0.8;
}

/* AI 分析结果 - 羊皮纸卡片 */
.ai-result-section-ghibli {
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.ghibli-parchment-card {
  background-color: #fefcf0; /* 与仪表盘同步的暖底色 */
  background-image: url('https://www.transparenttextures.com/patterns/natural-paper.png');
  padding: 35px;
  border-radius: 24px;
  border: 3px solid #e5dcc3;
  box-shadow: 
    0 15px 45px rgba(139, 69, 19, 0.1),
    inset 0 0 80px rgba(139, 69, 19, 0.05);
  position: relative;
}

.ghibli-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.4);
  padding: 15px 20px;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.report-title-ghibli {
  font-size: 26px;
  font-weight: 900;
  color: #5d3a1a;
  text-shadow: 1px 1px 0px white;
}

.ghibli-bubble-content p {
  background: white;
  padding: 22px;
  border-radius: 24px 24px 24px 8px;
  font-size: 16px;
  line-height: 1.8;
  color: #2d3748; /* 更深的颜色提升可读性 */
  border: 2px solid #f0e6d2;
  box-shadow: 6px 6px 0px rgba(139, 69, 19, 0.05);
}

.ai-usage-badge {
  display: inline-block;
  margin-top: 10px;
  background: #fdfaf2;
  border: 1px solid #e5dcc3;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  color: #8b7355;
  
  &.at-limit {
    color: #f56c6c;
    border-color: #fecaca;
    background: #fff1f2;
  }
}

.ghibli-horizontal-scroll {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding: 10px 5px 20px;
  
  /* 隐藏滚动条但保留功能 */
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(139, 69, 19, 0.1); border-radius: 10px; }
}

.horizontal-card {
  flex: 0 0 280px; /* 固定宽度，防止在 flex 中被挤压 */
  min-height: 100px;
}

/* 历史记录样式 */
.ghibli-history-section {
  margin: 30px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  border-radius: 20px;
  border: 2px dashed #f0e6d2;
}

.history-title-ghibli {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  color: #8b7355;
  margin-bottom: 15px;
  font-size: 15px;
}

.history-tags-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 5px 5px 15px;
  
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(139, 69, 19, 0.1); border-radius: 10px; }
}

.history-tag-item {
  flex-shrink: 0;
  background: white;
  border: 2px solid #f0e6d2;
  padding: 10px 18px;
  border-radius: 15px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  
  &:hover {
    border-color: var(--ghibli-forest);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 8px 20px rgba(34, 139, 34, 0.1);
    background: #f0fdf4;
  }
  
  &.active {
    border-color: var(--ghibli-forest);
    background: var(--ghibli-forest);
    .time, .score { color: white; }
  }
  
  .time { font-size: 13px; font-weight: 800; color: #5d3a1a; }
  .score { font-size: 11px; color: #8b7355; font-weight: 600; }
}

.ghibli-risk-list, .ghibli-advice-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

@media (max-width: 480px) {
  .ghibli-risk-list, .ghibli-advice-list {
    grid-template-columns: 1fr;
  }
}

.ghibli-risk-item {
  background: linear-gradient(135deg, #fff5f5 0%, #ffe4e6 100%);
  padding: 18px;
  border-radius: 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 2px dashed #fda4af;
  box-shadow: 2px 2px 8px rgba(245, 108, 108, 0.05);
}

.ghibli-advice-item {
  background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
  padding: 18px;
  border-radius: 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 2px solid #86efac;
  box-shadow: 2px 2px 8px rgba(34, 139, 34, 0.05);
}

.risk-text, .advice-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.6;
  color: #2d3748;
}

/* 原始卡片适配 */
.recommendations-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  position: relative;
  z-index: 1;
}

:deep(.recommendation-card) {
  border-radius: 20px !important;
  border: 2px solid rgba(139, 69, 19, 0.1) !important;
  background-color: white !important;
  transition: all 0.3s ease !important;
}

:deep(.recommendation-card:hover) {
  transform: rotate(1deg) translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
}

:deep(.card-header) {
  border-bottom: 2px dashed #f0e6d2 !important;
  padding: 15px 20px !important;
  font-weight: 800 !important;
  color: var(--ghibli-earth-brown) !important;
}

/* 行动计划吉卜力风格 */
.ghibli-action-plan {
  margin-top: 40px;
}

.action-parchment {
  background-color: #fff9f0 !important; /* 更暖一点的色调 */
  border: 3px solid var(--ghibli-cherry-pink) !important;
}

.ghibli-action-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.ghibli-action-item {
  background: white;
  padding: 15px;
  border-radius: 15px;
  border: 2px solid #fef2f2;
  transition: all 0.3s;
}

.ghibli-action-item:hover {
  border-color: var(--ghibli-cherry-pink);
  transform: scale(1.02);
}

.action-content-ghibli {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
}

.action-task-ghibli {
  font-weight: 700;
  color: var(--ghibli-earth-brown);
  font-size: 15px;
}

.action-benefit-ghibli {
  font-size: 12px;
  color: #a09680;
  margin-top: 4px;
}

.sprout-decoration {
  position: absolute;
  bottom: -15px;
  right: 20px;
  font-size: 40px;
  filter: drop-shadow(2px 2px 0 white);
}

.cherry-pink { color: var(--ghibli-cherry-pink); }

@media (max-width: 768px) {
  .ghibli-theme { 
    padding: 20px 12px; 
    border-radius: 16px;
  }
  
  .title-text {
    font-size: 22px;
  }
  
  .ghibli-parchment-card {
    padding: 20px 15px;
    border-radius: 16px;
  }
  
  .ghibli-report-header {
    flex-direction: column;
    align-items: center;
    gap: 15px;
    padding: 15px;
  }
  
  .report-title-ghibli { font-size: 20px; }
  .ghibli-risk-list, .ghibli-advice-list { grid-template-columns: 1fr !important; }
}
</style>