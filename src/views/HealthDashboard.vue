<template>
  <div class="health-dashboard ghibli-container">
    <div class="dashboard-header">
      <h1 class="ghibli-title">我的健康森林</h1>
      <div class="header-actions">
        <el-button type="primary" size="large" @click="showAddDataDialog = true" class="ghibli-btn">
          <el-icon><Plus /></el-icon>
          <span>记录新数据</span>
        </el-button>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="dashboard-section">
      <HealthDataDisplay :health-data="healthStore.currentHealthData" />
    </div>

    <el-row :gutter="24">
      <!-- 趋势图表 -->
      <el-col :span="24" :xl="16">
        <div class="dashboard-section">
          <HealthTrendChart />
        </div>
      </el-col>
      
      <!-- 健康建议 -->
      <el-col :span="24" :xl="8">
        <div class="dashboard-section">
          <HealthRecommendation />
        </div>
      </el-col>
    </el-row>

    <!-- 添加数据对话框 -->
    <el-dialog
      v-model="showAddDataDialog"
      title="记录健康瞬间"
      :width="dialogWidth"
      destroy-on-close
      class="ghibli-dialog"
    >
      <HealthDataForm @submit-success="handleDataSubmitSuccess" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useHealthStore } from '../store/healthStore';
import { useUserStore } from '../store/userStore';
import { Plus } from '@element-plus/icons-vue';
import HealthDataDisplay from '../components/HealthDataDisplay.vue';
import HealthTrendChart from '../components/HealthTrendChart.vue';
import HealthRecommendation from '../components/HealthRecommendation.vue';
import HealthDataForm from '../components/HealthDataForm.vue';
import { ElMessage } from 'element-plus/es';

const healthStore = useHealthStore();
const userStore = useUserStore();
const showAddDataDialog = ref(false);

const dialogWidth = computed(() => {
  const width = window.innerWidth;
  if (width < 768) return '95%';
  if (width < 1200) return '70%';
  return '600px';
});

const loadData = async () => {
  if (userStore.isAuthenticated) {
    await healthStore.fetchCurrentHealthData();
    await healthStore.fetchHealthHistory();
    await healthStore.fetchDailyCheckins();
  }
};

onMounted(async () => {
  await loadData();
});

// 监听登录状态变化，确保登录后加载数据
watch(() => userStore.isAuthenticated, (newValue) => {
  if (newValue) {
    loadData();
  }
});

const handleDataSubmitSuccess = async () => {
  showAddDataDialog.value = false;
  ElMessage.success('健康数据记录成功');
  await loadData();
};
</script>

<style scoped lang="scss">
.ghibli-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: 100vh;
  position: relative;
  
  /* 添加背景装饰元素 */
  &::before {
    content: '🍃';
    position: absolute;
    top: 100px;
    left: 20px;
    font-size: 40px;
    opacity: 0.2;
    transform: rotate(-15deg);
  }
  
  &::after {
    content: '☁️';
    position: absolute;
    bottom: 50px;
    right: 40px;
    font-size: 60px;
    opacity: 0.1;
    animation: floatCloud 15s linear infinite alternate;
  }
}

@media (max-width: 768px) {
  .ghibli-container {
    padding: 20px 10px;
    
    &::before, &::after {
      display: none; /* 移动端隐藏装饰元素防止溢出 */
    }
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
  }
}

@keyframes floatCloud {
  from { transform: translateX(0); }
  to { transform: translateX(-50px); }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  
  .header-actions {
    display: flex;
    gap: 15px;
  }
}

.dashboard-section {
  margin-bottom: 32px;
  
  /* 深度选择器确保子组件卡片也有悬浮效果 */
  :deep(.el-card) {
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important;
    }
  }
}

.ghibli-dialog {
  :deep(.el-dialog) {
    border-radius: 24px;
    background-color: #fdfaf2;
    background-image: url('https://www.transparenttextures.com/patterns/natural-paper.png');
    border: 3px solid #e5dcc3;
    
    .el-dialog__header {
      padding: 25px 30px 10px;
      .el-dialog__title {
        font-weight: 800;
        color: #8B4513;
        font-size: 20px;
      }
    }
  }
}
</style>
