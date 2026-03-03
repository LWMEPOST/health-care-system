<template>
  <div class="recipes-view">
    <div class="page-header">
      <h1>健康食谱库</h1>
      <p>探索为您量身定制的营养食谱</p>
    </div>

    <div class="ai-recipe-panel">
      <el-row :gutter="16">
        <el-col :xs="24" :md="10">
          <el-input
            v-model="goalText"
            placeholder="输入你的目标（如：增肌午餐、低脂晚餐、感冒食疗）"
            clearable
          />
        </el-col>
        <el-col :xs="12" :md="4">
          <el-select v-model="mealType" placeholder="餐次" clearable>
            <el-option label="早餐" value="breakfast" />
            <el-option label="午餐" value="lunch" />
            <el-option label="晚餐" value="dinner" />
            <el-option label="小吃" value="snack" />
            <el-option label="三餐" value="full_day" />
          </el-select>
        </el-col>
        <!-- <el-col :xs="12" :md="4">
          <el-input-number v-model="recipeCount" :min="1" :max="5" />
        </el-col> -->
        <el-col :xs="24" :md="10">
          <el-button type="primary" :loading="recipeStore.isGenerating" @click="handleGenerate">
            生成食谱
          </el-button>
        </el-col>
      </el-row>
      <div class="ai-recipe-meta">
        <span>基于健康数据与AI分析生成</span>
        <el-button v-if="recipeStore.generationRecords.length" type="primary" link @click="loadLatest">
          使用最新生成
        </el-button>
      </div>
      <div v-if="recipeStore.generationRecords.length" class="generation-history">
        <span class="history-label">最近生成</span>
        <div class="history-list">
          <el-tag
            v-for="record in recipeStore.generationRecords.slice(0, 5)"
            :key="record.id"
            class="history-item"
            effect="plain"
            @click="selectGeneration(record)"
          >
            {{ formatHistoryTitle(record) }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 搜索和过滤区域 -->
    <!-- <div class="filter-section">
      ...
    </div> -->

    <!-- 食谱列表 -->
    <div class="recipes-grid" v-loading="recipeStore.isLoading">
      <el-empty v-if="!recipeStore.isLoading && recipeStore.filteredRecipes.length === 0" description="没有找到相关食谱" />
      
      <el-row :gutter="20" v-else>
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="recipe in recipeStore.filteredRecipes" :key="recipe.id">
          <el-card class="recipe-card" shadow="hover" @click="navigateToDetail(recipe.id)">
            <div class="recipe-image-wrapper">
              <div class="recipe-cover" :style="getRecipeCoverStyle(recipe)"></div>
              <div class="recipe-badges">
                <el-tag size="small" effect="dark" type="success">{{ formatTime(recipe.cookTime + recipe.prepTime) }}分钟</el-tag>
                <el-tag size="small" effect="dark" :type="getDifficultyType(recipe.difficulty)">{{ getDifficultyLabel(recipe.difficulty) }}</el-tag>
              </div>
            </div>
            <div class="recipe-content">
              <h3 class="recipe-title">{{ recipe.title }}</h3>
              <p class="recipe-desc">{{ truncateText(recipe.description, 60) }}</p>
              <div class="recipe-footer">
                <div class="nutrition-summary">
                  <span>{{ recipe.nutritionInfo.calories }} kcal</span>
                </div>
                <div class="footer-actions">
                  <el-button type="danger" link :icon="Delete" @click.stop="handleDelete(recipe.id)"></el-button>
                  <el-button class="detail-btn" @click.stop="navigateToDetail(recipe.id)">查看详情</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRecipeStore } from '../store/recipeStore';
import { useHealthStore } from '../store/healthStore';
import { ElMessage, ElMessageBox } from 'element-plus/es';
import { Delete } from '@element-plus/icons-vue';

const router = useRouter();
const recipeStore = useRecipeStore();
const healthStore = useHealthStore();

const goalText = ref('');
const mealType = ref('');
const recipeCount = ref(1);

onMounted(async () => {
  recipeStore.loadFromLocalStorage();
  await healthStore.fetchCurrentHealthData();
  await healthStore.fetchAIAnalyses();
  await recipeStore.fetchGeneratedRecipes();
});

// const handleSearch = () => {
//   recipeStore.filters.searchQuery = searchQuery.value;
// };

// const handleFilterChange = () => {
//   recipeStore.filters.category = selectedCategory.value ? [selectedCategory.value] : undefined;
//   recipeStore.filters.difficulty = selectedDifficulty.value ? [selectedDifficulty.value] : undefined;
//   recipeStore.filters.dietaryTags = selectedDietary.value.length > 0 ? selectedDietary.value : undefined;
// };

const navigateToDetail = (id: string) => {
  router.push(`/recipes/${id}`);
};

const buildAnalysisSummary = (analysis: any) => {
  if (!analysis) return undefined;
  const content = analysis.content;
  if (!content) return undefined;
  if (typeof content === 'string') return content;
  if (content.summary) return content.summary;
  if (Array.isArray(content.recommendations)) return content.recommendations.join('；');
  return undefined;
};

const handleGenerate = async () => {
  const trimmedGoal = goalText.value.trim();
  if (!trimmedGoal) {
    ElMessage.warning('请先输入目标');
    return;
  }

  const latestAnalysis = healthStore.aiAnalyses?.[0];
  const analysisSummary = buildAnalysisSummary(latestAnalysis);
  const success = await recipeStore.generateRecipesFromAgent({
    goalText: trimmedGoal,
    mealType: mealType.value || undefined,
    count: recipeCount.value,
    healthData: healthStore.currentHealthData ? { ...healthStore.currentHealthData } : undefined,
    healthDataId: healthStore.currentHealthData && 'id' in healthStore.currentHealthData ? Number(healthStore.currentHealthData.id) : null,
    analysisId: latestAnalysis?.id || null,
    analysisSummary
  });

  if (success) {
    ElMessage.success('食谱已生成');
  } else {
    ElMessage.error(recipeStore.error || '生成失败');
  }
};

const loadLatest = () => {
  const latest = recipeStore.generationRecords[0];
  if (latest) {
    recipeStore.applyGenerationRecord(latest);
  }
};

const selectGeneration = (record: any) => {
  recipeStore.applyGenerationRecord(record);
};

const formatHistoryTitle = (record: any) => {
  const time = record.created_at ? new Date(record.created_at).toLocaleDateString() : '';
  return time ? `${record.goal_text} · ${time}` : record.goal_text;
};

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
};

const getDifficultyType = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'success';
    case 'medium': return 'warning';
    case 'hard': return 'danger';
    default: return 'info';
  }
};

const getDifficultyLabel = (difficulty: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return map[difficulty] || difficulty;
};

const truncateText = (text: string, length: number) => {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
};

// 吉卜力风格色板
const ghibliColors = [
  { bg: 'linear-gradient(135deg, #87CEEB 0%, #E0FFFF 100%)', icon: '☁️' }, // 天空蓝
  { bg: 'linear-gradient(135deg, #98FB98 0%, #F0FFF0 100%)', icon: '🌿' }, // 草地绿
  { bg: 'linear-gradient(135deg, #FFB6C1 0%, #FFF0F5 100%)', icon: '🌸' }, // 樱花粉
  { bg: 'linear-gradient(135deg, #F0E68C 0%, #FFFFE0 100%)', icon: '🌾' }, // 麦田黄
  { bg: 'linear-gradient(135deg, #D8BFD8 0%, #E6E6FA 100%)', icon: '🍇' }, // 葡萄紫
  { bg: 'linear-gradient(135deg, #FFA07A 0%, #FFEFD5 100%)', icon: '🍊' }, // 暖阳橙
];

const getRecipeCoverStyle = (recipe: any) => {
  // 基于 ID 生成确定性的索引
  let hash = 0;
  const str = recipe.id || recipe.title || 'default';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ghibliColors.length;
  const theme = ghibliColors[index];
  
  return {
    background: theme.bg,
    '--cover-icon': `"${theme.icon}"`
  };
};

const handleDelete = async (recipeId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个食谱吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const success = await recipeStore.deleteRecipe(recipeId);
    if (success) {
      ElMessage.success('删除成功');
    } else {
      ElMessage.error(recipeStore.error || '删除失败');
    }
  } catch (err) {
    // Cancelled
  }
};
</script>

<style scoped lang="scss">
.recipes-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    color: #303133;
    margin-bottom: 10px;
  }

  p {
    color: #606266;
    font-size: 16px;
  }
}

.filter-section {
  margin-bottom: 30px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .filter-group {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    align-items: center;
  }

  .dietary-checkboxes {
    margin-left: auto;
  }
}

.ai-recipe-panel {
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-recipe-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #909399;
  font-size: 13px;
}

.generation-history {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .history-label {
    color: #606266;
    font-size: 13px;
  }

  .history-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .history-item {
    cursor: pointer;
  }
}

.recipes-grid {
  min-height: 400px;
  
  .recipe-card {
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.3s;
    border: none;
    overflow: hidden;

    &:hover {
      transform: translateY(-5px);
    }

    :deep(.el-card__body) {
      padding: 0;
    }
  }

  .recipe-image-wrapper {
    position: relative;
    height: 180px;
    overflow: hidden;
    
    .recipe-cover {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
      
      &::after {
        content: var(--cover-icon);
        font-size: 48px;
        opacity: 0.8;
      }
    }

    .recipe-badges {
      position: absolute;
      top: 10px;
      right: 10px;
      display: flex;
      gap: 5px;
    }
  }

  .recipe-content {
    padding: 15px;

    .recipe-title {
      margin: 0 0 10px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .recipe-desc {
      color: #606266;
      font-size: 14px;
      line-height: 1.5;
      height: 42px;
      overflow: hidden;
      margin-bottom: 15px;
    }

    .recipe-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #EBEEF5;
      padding-top: 10px;
      
      .nutrition-summary {
        color: #909399;
        font-size: 13px;
      }

      .footer-actions {
      display: flex;
      gap: 8px;
      
      .detail-btn {
        border-radius: 20px;
        padding: 6px 16px;
        font-size: 13px;
        border: 1px solid #409EFF;
        color: #409EFF;
        background: transparent;
        transition: all 0.3s;
        
        &:hover {
          background: #409EFF;
          color: white;
        }
      }
    }
  }
}
}
</style>
