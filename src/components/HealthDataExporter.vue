<template>
  <div class="health-exporter">
    <el-card class="export-card">
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
        </div>
      </template>
      
      <div class="export-content">
        <p class="export-description">
          导出您的健康数据，支持多种格式选择。数据导出功能可以帮助您备份健康记录或在其他系统中使用。
        </p>
        
        <div class="export-options">
          <el-radio-group v-model="selectedFormat" class="format-selector">
            <el-radio-button label="json">JSON格式</el-radio-button>
            <el-radio-button label="csv">CSV格式</el-radio-button>
          </el-radio-group>
          
          <el-checkbox v-model="includeHistorical" class="include-historical">
            包含历史数据
          </el-checkbox>
        </div>
        
        <div v-if="selectedFormat === 'csv'" class="format-info">
          <el-alert
            title="CSV格式说明"
            type="info"
            description="CSV格式主要导出健康指标数据，适合在电子表格软件中查看和分析。"
            :closable="false"
          />
        </div>
        
        <div v-if="selectedFormat === 'json'" class="format-info">
          <el-alert
            title="JSON格式说明"
            type="info"
            description="JSON格式导出完整的健康数据，包括当前数据和历史记录，适合数据备份和系统间传输。"
            :closable="false"
          />
        </div>
        
        <div class="export-actions">
          <el-button 
            type="primary" 
            @click="handleExport"
            :loading="isExporting"
            :disabled="isExporting || !hasData"
          >
            导出数据
          </el-button>
          
          <el-button @click="handleCancel" :disabled="isExporting">
            取消
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// 正确导入Element Plus的消息组件
import { ElMessage } from 'element-plus/es';
import { HealthExporterService } from '@/services/healthExporter';

// 响应式数据
const selectedFormat = ref<'json' | 'csv'>('json');
const includeHistorical = ref(true);
const isExporting = ref(false);
const hasData = ref(false);

/**
 * 处理导出操作
 */
const handleExport = async () => {
  isExporting.value = true;
  
  try {
    // 根据选择的格式导出数据
    if (selectedFormat.value === 'json') {
      HealthExporterService.exportAsJSON();
      ElMessage.success('健康数据已成功导出为JSON格式');
    } else if (selectedFormat.value === 'csv') {
      HealthExporterService.exportAsCSV();
      ElMessage.success('健康数据已成功导出为CSV格式');
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败，请稍后重试');
  } finally {
    isExporting.value = false;
  }
};

/**
 * 处理取消操作
 */
const handleCancel = () => {
  // 重置选择
  selectedFormat.value = 'json';
  includeHistorical.value = true;
};

/**
 * 检查是否有可导出的数据
 */
const checkDataAvailability = () => {
  hasData.value = HealthExporterService.hasDataToExport();
};

// 组件挂载时检查数据可用性
onMounted(() => {
  checkDataAvailability();
});
</script>

<style scoped>
.health-exporter {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.export-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.export-content {
  padding: 20px 0;
}

.export-description {
  color: #606266;
  margin-bottom: 24px;
  line-height: 1.6;
}

.export-options {
  margin-bottom: 24px;
}

.format-selector {
  margin-bottom: 16px;
}

.include-historical {
  margin-left: 16px;
}

.format-info {
  margin-bottom: 24px;
}

.export-actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .health-exporter {
    padding: 10px;
  }
  
  .export-actions {
    flex-direction: column;
  }
  
  .export-actions .el-button {
    width: 100%;
  }
}
</style>