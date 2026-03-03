<template>
  <div class="recipe-detail-container" v-loading="loading">
    <div v-if="recipe" class="recipe-content">
      <!-- 顶部横幅 -->
      <div class="recipe-hero">
        <div class="hero-image-wrapper" :style="getRecipeCoverStyle(recipe)"></div>
        <div class="hero-overlay">
          <div class="nav-bar">
            <el-button class="back-btn" circle :icon="ArrowLeft" @click="goBack" />
          </div>
          <h1 class="recipe-title">{{ recipe.title }}</h1>
          <div class="recipe-meta">
            <span><el-icon><Timer /></el-icon> 准备: {{ recipe.prepTime }}分钟</span>
            <span><el-icon><Watch /></el-icon> 烹饪: {{ recipe.cookTime }}分钟</span>
            <span><el-icon><Dish /></el-icon> {{ recipe.servings }}人份</span>
            <span><el-icon><Trophy /></el-icon> 难度: {{ formatDifficulty(recipe.difficulty) }}</span>
          </div>
        </div>
      </div>

      <el-row :gutter="40" class="main-content">
        <!-- 左侧：食材和步骤 -->
        <el-col :xs="24" :md="16">
          <section class="detail-section">
            <h2><el-icon><ShoppingBag /></el-icon> 食材清单</h2>
            <ul class="ingredients-list">
              <li v-for="item in ingredients" :key="item.id" class="ingredient-item">
                <el-checkbox v-model="item.checked">
                  <span class="amount">{{ item.amount }} {{ item.unit }}</span>
                  <span class="name">{{ item.name }}</span>
                  <span v-if="item.notes" class="notes">({{ item.notes }})</span>
                </el-checkbox>
              </li>
            </ul>
          </section>

          <section class="detail-section">
            <h2><el-icon><List /></el-icon> 制作步骤</h2>
            <div class="steps-list">
              <div 
                v-for="(step, index) in recipe.instructions" 
                :key="index" 
                class="step-item"
              >
                <div class="step-index">{{ index + 1 }}</div>
                <div class="step-content">{{ step }}</div>
              </div>
            </div>
          </section>
        </el-col>

        <!-- 右侧：营养信息和标签 -->
        <el-col :xs="24" :md="8">
          <el-card class="nutrition-card">
            <template #header>
              <div class="card-header">
                <span>营养成分 (每份)</span>
              </div>
            </template>
            <div class="nutrition-grid">
              <div class="nutrition-item highlight">
                <span class="label">热量</span>
                <span class="value">{{ recipe.nutritionInfo.calories }}</span>
                <span class="unit">kcal</span>
              </div>
              <div class="nutrition-item">
                <span class="label">蛋白质</span>
                <span class="value">{{ recipe.nutritionInfo.protein }}</span>
                <span class="unit">g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">碳水</span>
                <span class="value">{{ (recipe.nutritionInfo as any).carbs || (recipe.nutritionInfo as any).carbohydrates }}</span>
                <span class="unit">g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">脂肪</span>
                <span class="value">{{ recipe.nutritionInfo.fat }}</span>
                <span class="unit">g</span>
              </div>
            </div>
          </el-card>

          <div class="tags-section">
            <el-tag 
              v-for="tag in recipe.tags" 
              :key="tag" 
              class="recipe-tag"
              effect="plain"
            >
              #{{ tag }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-empty v-else description="未找到食谱信息" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRecipeStore } from '../store/recipeStore';
import { Timer, Watch, Dish, Trophy, ShoppingBag, List, ArrowLeft } from '@element-plus/icons-vue';
import type { Recipe } from '../types';

interface ExtendedIngredient {
  id?: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
  checked?: boolean;
}

const route = useRoute();
const router = useRouter();
const recipeStore = useRecipeStore();
const loading = ref(true);
const recipe = ref<Recipe | null>(null);
const ingredients = ref<ExtendedIngredient[]>([]);

// 吉卜力风格色板 (与 Recipes.vue 保持一致)
const ghibliColors = [
  { bg: 'linear-gradient(135deg, #87CEEB 0%, #E0FFFF 100%)', icon: '☁️' }, // 天空蓝
  { bg: 'linear-gradient(135deg, #98FB98 0%, #F0FFF0 100%)', icon: '🌿' }, // 草地绿
  { bg: 'linear-gradient(135deg, #FFB6C1 0%, #FFF0F5 100%)', icon: '🌸' }, // 樱花粉
  { bg: 'linear-gradient(135deg, #F0E68C 0%, #FFFFE0 100%)', icon: '🌾' }, // 麦田黄
  { bg: 'linear-gradient(135deg, #D8BFD8 0%, #E6E6FA 100%)', icon: '🍇' }, // 葡萄紫
  { bg: 'linear-gradient(135deg, #FFA07A 0%, #FFEFD5 100%)', icon: '🍊' }, // 暖阳橙
];

const getRecipeCoverStyle = (recipe: Recipe) => {
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

const goBack = () => {
  router.back();
};

onMounted(async () => {
  const id = route.params.id as string;
  let foundRecipe: Recipe | undefined;

  // 1. 尝试从缓存获取
  if (recipeStore.recipes[id]) {
    foundRecipe = recipeStore.recipes[id];
  } 
  // 2. 尝试从推荐列表获取
  else {
    foundRecipe = recipeStore.recommendedRecipes.find(r => r.id === id);
  }

  if (foundRecipe) {
    recipe.value = foundRecipe;
    // 初始化带 checked 状态的食材列表
    ingredients.value = foundRecipe.ingredients.map((ing, index) => ({
      ...ing,
      id: ing.id || `ing-${index}`,
      checked: false
    }));
  }
  
  loading.value = false;
});

const formatDifficulty = (val: string) => {
  const map: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return map[val] || val;
};
</script>

<style scoped lang="scss">
.recipe-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 60px;
}

.recipe-hero {
  position: relative;
  height: 400px;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  margin-bottom: 40px;

  .hero-image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::after {
      content: var(--cover-icon);
      font-size: 120px;
      opacity: 0.6;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
    }
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 40px 40px;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1), transparent 30%, rgba(0,0,0,0.6));
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .nav-bar {
      display: flex;
      justify-content: flex-start;
      
      .back-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 20px;
        width: 40px;
        height: 40px;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }
      }
    }

    h1 {
      margin: 0 0 16px;
      font-size: 36px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .recipe-meta {
      display: flex;
      gap: 24px;
      font-size: 16px;
      
      span {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
}

.main-content {
  padding: 0 20px;
}

.detail-section {
  margin-bottom: 40px;

  h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    font-size: 24px;
    color: #303133;
    border-bottom: 2px solid #409EFF;
    padding-bottom: 10px;
    display: inline-block;
  }
}

.ingredients-list {
  list-style: none;
  padding: 0;
  
  .ingredient-item {
    padding: 12px 0;
    border-bottom: 1px solid #EBEEF5;

    .amount {
      font-weight: bold;
      margin-right: 8px;
      color: #409EFF;
    }

    .notes {
      color: #909399;
      font-size: 13px;
      margin-left: 8px;
    }
  }
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .step-item {
    display: flex;
    gap: 20px;
    padding: 20px;
    background: #F5F7FA;
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      background: #ECF5FF;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .step-index {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      background: #409EFF;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }

    .step-content {
      font-size: 16px;
      line-height: 1.6;
      color: #303133;
      flex-grow: 1;
    }
  }
}

.nutrition-card {
  margin-bottom: 24px;
  
  .nutrition-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .nutrition-item {
    text-align: center;
    padding: 10px;
    background: #F5F7FA;
    border-radius: 8px;

    &.highlight {
      background: #ECF5FF;
      color: #409EFF;
    }

    .label {
      display: block;
      font-size: 12px;
      color: #909399;
      margin-bottom: 4px;
    }

    .value {
      font-size: 18px;
      font-weight: bold;
    }

    .unit {
      font-size: 12px;
      margin-left: 2px;
    }
  }
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
