<template>
  <div class="health-trend-chart-container">
    <h2 class="chart-title">健康数据历史趋势</h2>
    
    <div class="chart-controls">
      <el-select v-model="selectedMetric" placeholder="选择健康指标" class="metric-select">
        <el-option label="体重 (kg)" value="weight"></el-option>
        <el-option label="BMI" value="bmi"></el-option>
        <el-option label="收缩压 (mmHg)" value="systolic"></el-option>
        <el-option label="舒张压 (mmHg)" value="diastolic"></el-option>
        <el-option label="心率 (bpm)" value="heartRate"></el-option>
        <el-option label="压力水平 (1-10)" value="stressLevel"></el-option>
      </el-select>
      
      <el-select v-model="timeRange" placeholder="选择时间范围" class="time-range-select">
        <el-option label="最近7天" value="7"></el-option>
        <el-option label="最近30天" value="30"></el-option>
        <el-option label="最近90天" value="90"></el-option>
        <el-option label="最近1年" value="365"></el-option>
      </el-select>
      
      <el-button type="primary" @click="refreshChart">刷新图表</el-button>
    </div>
    
    <div class="chart-wrapper">
      <div ref="chartRef" class="chart"></div>
    </div>
    
    <div class="chart-summary" v-if="chartSummary">
      <el-card class="summary-card">
        <template #header>
          <div class="card-header">
            <span>趋势摘要</span>
          </div>
        </template>
        <div class="summary-content">
          <p><strong>平均值:</strong> {{ chartSummary.average.toFixed(2) }}</p>
          <p><strong>最高值:</strong> {{ chartSummary.max.toFixed(2) }} ({{ formatDate(chartSummary.maxDate) }})</p>
          <p><strong>最低值:</strong> {{ chartSummary.min.toFixed(2) }} ({{ formatDate(chartSummary.minDate) }})</p>
          <p><strong>趋势:</strong> 
            <span :class="{ 'trend-up': chartSummary.trend > 0, 'trend-down': chartSummary.trend < 0, 'trend-stable': chartSummary.trend === 0 }">
              {{ chartSummary.trendText }}
            </span>
          </p>
        </div>
      </el-card>
    </div>
    
    <div v-if="historicalData.length === 0" class="no-data-message">
      <el-empty description="暂无历史数据"></el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import { useHealthStore } from '@/store/healthStore';

// 定义健康数据接口
interface HealthDataEntry {
  recordedAt?: string;
  created_at?: string;
  weight?: number;
  height?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  stressLevel?: number;
  // 计算属性
  bmi?: number;
}

interface ChartSummary {
  average: number;
  max: number;
  maxDate: string;
  min: number;
  minDate: string;
  trend: number; // 1: 上升, -1: 下降, 0: 稳定
  trendText: string;
}

const healthStore = useHealthStore();

// 响应式数据
const selectedMetric = ref<string>('weight');
const timeRange = ref<string>('30');
const historicalData = computed(() => healthStore.healthHistory); // 直接从 store 获取历史数据
const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 计算属性
const chartSummary = computed<ChartSummary | null>(() => {
  if (historicalData.value.length === 0) return null;
  
  const values = historicalData.value
    .filter(item => {
      // 兼容两种字段名 (后端字段 vs 前端字段)
      const val = item[selectedMetric.value as keyof HealthDataEntry] ?? (item as any)[selectedMetric.value === 'systolic' ? 'systolic_pressure' : selectedMetric.value === 'diastolic' ? 'diastolic_pressure' : selectedMetric.value];
      return val !== undefined && val !== null;
    })
    .map(item => ({
      value: Number(item[selectedMetric.value as keyof HealthDataEntry] ?? (item as any)[selectedMetric.value === 'systolic' ? 'systolic_pressure' : selectedMetric.value === 'diastolic' ? 'diastolic_pressure' : selectedMetric.value]),
      date: item.created_at || item.recordedAt || ''
    }));
  
  if (values.length === 0) return null;
  
  // 计算平均值
  const sum = values.reduce((acc, curr) => acc + curr.value, 0);
  const average = sum / values.length;
  
  // 找到最大值和最小值
  const max = Math.max(...values.map(v => v.value));
  const min = Math.min(...values.map(v => v.value));
  const maxItem = values.find(v => v.value === max);
  const minItem = values.find(v => v.value === min);
  
  // 计算趋势
  let trend = 0;
  let trendText = '数据稳定';
  
  if (values.length >= 2) {
    const firstValue = values[0].value;
    const lastValue = values[values.length - 1].value;
    const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
    
    if (Math.abs(changePercentage) > 5) {
      if (changePercentage > 0) {
        trend = 1;
        trendText = `上升 ${changePercentage.toFixed(1)}%`;
      } else {
        trend = -1;
        trendText = `下降 ${Math.abs(changePercentage).toFixed(1)}%`;
      }
    }
  }
  
  return {
    average,
    max,
    maxDate: maxItem?.date || '',
    min,
    minDate: minItem?.date || '',
    trend,
    trendText
  };
});

// 方法
const formatDate = (dateString?: string): string => {
  if (!dateString) return '未知时间';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '无效日期';
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch (e) {
    return '日期错误';
  }
};

// 获取历史数据
const loadHistoricalData = async () => {
  // 数据现在通过 computed 属性从 store 获取，并在 store 中由 fetchHealthHistory 更新
  // 这里我们只需要触发 store 的 action
  const days = parseInt(timeRange.value);
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  await healthStore.fetchHealthHistory({ start, end });
  updateChart();
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;
  
  if (historicalData.value.length === 0) {
    chartInstance.clear();
    return;
  }
  
  // 处理数据用于图表
  const chartData = historicalData.value
    .map(item => {
      // 兼容字段映射
      const val = item[selectedMetric.value as keyof HealthDataEntry] ?? (item as any)[selectedMetric.value === 'systolic' ? 'systolic_pressure' : selectedMetric.value === 'diastolic' ? 'diastolic_pressure' : selectedMetric.value];
      return {
        date: formatDate(item.created_at || item.recordedAt),
        value: val !== undefined && val !== null ? Number(val) : null,
        fullDate: item.created_at || item.recordedAt
      };
    })
    .filter(item => item.value !== null)
    .sort((a, b) => new Date(a.fullDate || '').getTime() - new Date(b.fullDate || '').getTime()); // 确保按时间正序排列
    
  const dates = chartData.map(item => item.date);
  const values = chartData.map(item => item.value);
  // 设置图表配置
  chartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: {c}'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: values,
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  });
};

const refreshChart = () => {
  loadHistoricalData();
  updateChart();
};

// 监听时间范围变化
watch(timeRange, () => {
  loadHistoricalData();
});

// 监听指标变化
watch(selectedMetric, () => {
  updateChart();
});

// 监听 store 中的历史数据变化
watch(() => healthStore.healthHistory, () => {
  updateChart();
}, { deep: true });

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);
    loadHistoricalData();
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      chartInstance?.resize();
    });
  }
});

// 组件卸载逻辑可以在组件销毁时添加
</script>

<style scoped>
.health-trend-chart-container {
  padding: 30px;
  background-color: #fefcf0;
  background-image: url('https://www.transparenttextures.com/patterns/natural-paper.png');
  border-radius: 24px;
  border: 3px solid #e5dcc3;
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.05);
}

.chart-title {
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 25px;
  color: #5d3a1a;
  text-shadow: 1px 1px 0px white;
  text-align: center;
}

.chart-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  justify-content: center;
}

.metric-select,
.time-range-select {
  width: 180px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px !important;
  border: 2px solid #f0e6d2 !important;
  box-shadow: none !important;
}

.chart-wrapper {
  height: 400px;
  margin-bottom: 25px;
  background-color: white;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid #f0e6d2;
  box-shadow: inset 0 0 15px rgba(139, 69, 19, 0.02);
}

.chart {
  width: 100%;
  height: 100%;
}

.chart-summary {
  margin-top: 25px;
}

.summary-card {
  border-radius: 20px !important;
  border: 2px solid #f0e6d2 !important;
  background: rgba(255, 255, 255, 0.5) !important;
}

:deep(.el-card__header) {
  padding: 12px 20px !important;
  font-weight: 800 !important;
  color: #5d3a1a !important;
  border-bottom: 2px dashed #f0e6d2 !important;
}

.summary-content p {
  margin: 10px 0;
  color: #4a453a;
  font-weight: 600;
  font-size: 15px;
}

.trend-up {
  color: #f56c6c;
  font-weight: 800;
}

.trend-down {
  color: #228B22;
  font-weight: 800;
}

.trend-stable {
  color: #8b7355;
}

.no-data-message {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a09680;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
  }
  
  .metric-select,
  .time-range-select {
    width: 100%;
  }
  
  .chart-wrapper {
    height: 300px;
  }
}
</style>