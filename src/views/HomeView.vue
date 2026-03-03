<template>
  <div class="home-container ghibli-theme">
    <!-- 英雄区域 -->
    <section class="ghibli-hero">
      <div class="hero-content">
        <h1 class="hero-title">开启你的健康森林旅程</h1>
        <p class="hero-subtitle">在这里，每一份数据都是成长的种子，由 AI 守护你的身心健康</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="navigateToRecipes" v-if="userStore.isLoggedIn" class="ghibli-btn-primary">
            探索食谱
          </el-button>
          <div v-else>
            <el-button type="primary" size="large" @click="navigateToAuth" class="ghibli-btn-primary">
              开启旅程
            </el-button>
          </div>
        </div>
      </div>
      <!-- 装饰元素 -->
      <div class="hero-decor sprout">🌱</div>
      <div class="hero-decor bird">🕊️</div>
    </section>

    <!-- 功能介绍 -->
    <section class="ghibli-features">
      <div class="section-header">
        <h2 class="ghibli-title">森林的馈赠</h2>
        <p class="section-subtitle">科学、智能、个性化的健康守护方案</p>
      </div>
      
      <div class="features-grid">
        <div class="ghibli-parchment-card feature-card">
          <el-icon class="feature-icon forest-green"><TrendCharts /></el-icon>
          <h3>健康深度分析</h3>
          <p>记录并利用 AI 拨开迷雾，深入了解您的身体律动与变化趋势</p>
        </div>
        
        <div class="ghibli-parchment-card feature-card">
          <el-icon class="feature-icon sky-blue"><Food /></el-icon>
          <h3>灵感食谱推荐</h3>
          <p>根据您的独特体质，由营养小精灵为您定制最天然的美味方案</p>
        </div>
        
        <div class="ghibli-parchment-card feature-card">
          <el-icon class="feature-icon sunset-orange"><Calendar /></el-icon>
          <h3>森林足迹追踪</h3>
          <p>轻松记录每日生活点滴，自动规划膳食，让健康生活变得自然而然</p>
        </div>
      </div>
    </section>

    <!-- 用户统计 -->
    <section class="ghibli-stats">
      <div class="stats-parchment">
        <div class="stat-item">
          <div class="stat-value">{{ recipesCount }}</div>
          <div class="stat-label">自然食谱</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ usersCount }}</div>
          <div class="stat-label">森林旅人</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ mealsPlanned }}</div>
          <div class="stat-label">已种下的种子</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/userStore';
import { TrendCharts, Food, Calendar } from '@element-plus/icons-vue';

const router = useRouter();
const userStore = useUserStore();

// 统计数据
const recipesCount = ref('1000+');
const usersCount = ref('5000+');
const mealsPlanned = ref('10000+');

// 导航方法
const navigateToAuth = () => {
  router.push('/auth');
};

const navigateToRecipes = () => {
  router.push('/recipes');
};
</script>

<style scoped lang="scss">
.home-container {
  padding-bottom: 60px;
}

.ghibli-hero {
  padding: 80px 20px;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  border: 3px solid white;
  margin-bottom: 60px;
  position: relative;
  overflow: hidden;
}

.hero-title {
  font-size: 3rem;
  font-weight: 900;
  color: #5d3a1a;
  text-shadow: 2px 2px 0 white;
  margin-bottom: 20px;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: #8b7355;
  font-style: italic;
  margin-bottom: 40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-decor {
  position: absolute;
  font-size: 40px;
  opacity: 0.2;
}

.sprout { bottom: 20px; left: 10%; transform: rotate(-10deg); }
.bird { top: 20px; right: 10%; transform: rotate(10deg); }

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-subtitle {
  color: #a09680;
  font-weight: 600;
  margin-top: -20px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-bottom: 60px;
}

.feature-card {
  padding: 40px !important;
  text-align: center;
  transition: all 0.4s ease;
  
  &:hover {
    transform: translateY(-10px) rotate(1deg);
  }
  
  .feature-icon {
    font-size: 48px;
    margin-bottom: 20px;
  }
  
  h3 {
    font-size: 1.5rem;
    color: #5d3a1a;
    margin-bottom: 15px;
  }
  
  p {
    color: #8b7355;
    line-height: 1.6;
  }
}

.ghibli-stats {
  margin-top: 40px;
}

.stats-parchment {
  background: #fdfaf2;
  border: 2px dashed #e5dcc3;
  border-radius: 20px;
  padding: 40px;
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30px;
}

.stat-item {
  text-align: center;
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 900;
    color: #228B22;
    text-shadow: 2px 2px 0 white;
  }
  
  .stat-label {
    font-size: 1rem;
    color: #a09680;
    font-weight: 700;
    margin-top: 5px;
  }
}

.forest-green { color: #228B22; }
.sky-blue { color: #87CEEB; }
.sunset-orange { color: #FFA500; }

@media (max-width: 768px) {
  .hero-title { font-size: 2rem; }
  .stats-parchment { flex-direction: column; }
}
</style>
