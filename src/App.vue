<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from './store/userStore';
import { supabase } from './services/supabase';
import { UserFilled } from '@element-plus/icons-vue';
const auth = supabase.auth;

const router = useRouter();
const userStore = useUserStore();

// 计算用户是否已登录
const isLoggedIn = computed(() => userStore.isAuthenticated);
const currentUser = computed(() => userStore.userProfile);

// 处理注销
  const handleLogout = async () => {
    try {
      await auth.signOut();
      userStore.logout();
      router.push('/');
    } catch (error) {
      console.error('注销失败:', error);
    }
  };

  const goToHome = () => {
    router.push('/');
  };

// 初始化时检查用户会话
onMounted(async () => {
  if (!userStore.isInitialized) {
    await userStore.initialize();
  }
  
  // 关键：确保当前登录用户在公共 users 表中存在
  if (userStore.isLoggedIn && userStore.userProfile?.id) {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userStore.userProfile.id)
        .single();
        
      if (!existingUser) {
        console.log('用户在 users 表中不存在，正在同步...');
        await supabase.from('users').insert({
          id: userStore.userProfile.id,
          email: userStore.userProfile.email,
          username: userStore.userProfile.username || userStore.userProfile.email.split('@')[0],
          display_name: userStore.userProfile.displayName || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('用户表同步失败:', error);
    }
  }
});
</script>

<template>
  <div class="health-app-container ghibli-theme">
    <!-- 背景装饰 -->
    <div class="ghibli-bg-decor">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="leaf leaf-1">🍃</div>
      <div class="leaf leaf-2">🍃</div>
    </div>

    <!-- 应用头部 -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title" @click="goToHome">
          <span class="title-main">健康森林</span>
          <span class="title-sub">数据采集系统</span>
        </h1>
        <div class="header-subtitle">全面记录、分析和改善您的健康状况</div>
      </div>
      <!-- 用户操作区 -->
      <div class="user-actions" v-if="isLoggedIn">
        <div class="user-info-badge">
          <el-avatar :size="32" :src="currentUser?.avatarUrl" v-if="currentUser?.avatarUrl" />
          <el-icon v-else><UserFilled /></el-icon>
          <span class="user-greeting">{{ currentUser?.displayName || currentUser?.username }}</span>
        </div>
        <button class="logout-button ghibli-btn-mini" @click="handleLogout">退出森林</button>
      </div>
      <div class="user-actions" v-else>
        <router-link to="/auth" class="login-button ghibli-btn-primary">开启旅程</router-link>
      </div>
    </header>

    <!-- 导航菜单 -->
    <nav class="app-nav" v-if="isLoggedIn">
      <div class="nav-container">
        <router-link to="/" class="nav-item" active-class="active">首页</router-link>
        <router-link to="/health" class="nav-item" active-class="active">健康数据</router-link>
        <router-link to="/assistant" class="nav-item" active-class="active">智能管家</router-link>
        <router-link to="/recipes" class="nav-item" active-class="active">健康食谱</router-link>
        <router-link to="/check-in" class="nav-item" active-class="active">每日打卡</router-link>
        <router-link to="/profile" class="nav-item" active-class="active">我的资料</router-link>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade-transform" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-content">
        <p>© 2024 健康森林 - 守护您的每一刻生机</p>
        <div class="footer-divider"></div>
        <p class="footer-note">数据仅存储在您的设备本地，让健康更私密、更纯粹</p>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
/* 吉卜力全局基础样式 */
:root {
  --ghibli-forest: #228B22;
  --ghibli-sky: #87CEEB;
  --ghibli-earth: #8B4513;
  --ghibli-cream: #fdfaf2;
  --ghibli-leaf: #98FB98;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  background-color: #f0f9ff;
  color: #4a453a;
  overflow-x: hidden;
}

.health-app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 背景装饰 */
.ghibli-bg-decor {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50px;
  opacity: 0.4;
  filter: blur(8px);
  animation: floatCloud 25s linear infinite;
}

.cloud-1 { width: 150px; height: 45px; top: 10%; left: -200px; }
.cloud-2 { width: 200px; height: 60px; top: 25%; left: -250px; animation-delay: -12s; }

@keyframes floatCloud {
  to { transform: translateX(calc(100vw + 300px)); }
}

.leaf {
  position: absolute;
  font-size: 24px;
  opacity: 0.1;
  animation: leafFall 10s linear infinite;
}

.leaf-1 { top: -50px; left: 20%; animation-delay: -2s; }
.leaf-2 { top: -50px; left: 80%; animation-delay: -7s; }

@keyframes leafFall {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.2; }
  90% { opacity: 0.2; }
  100% { transform: translate(100px, 100vh) rotate(360deg); opacity: 0; }
}

/* 头部样式 */
.app-header {
  background: linear-gradient(to bottom, rgba(135, 206, 235, 0.7) 0%, rgba(34, 139, 34, 0.6) 100%), 
              url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80');
  background-size: cover;
  background-position: center 30%;
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 6px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 25px rgba(0,0,0,0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(to top, rgba(240, 249, 255, 1) 0%, transparent 20%);
    pointer-events: none;
  }
}

.header-content {
  position: relative;
  z-index: 2;
  font-family: 'Comic Sans MS', 'Varela Round', 'PingFang SC', sans-serif;
}

.app-title {
  cursor: pointer;
  margin: 0;
  display: flex;
  flex-direction: column;
  
  .title-main {
    font-size: 2.8rem;
    font-weight: 900;
    color: white;
    text-shadow: 4px 4px 0px var(--ghibli-forest),
                 -1px -1px 0px var(--ghibli-forest),
                 1px -1px 0px var(--ghibli-forest),
                 -1px 1px 0px var(--ghibli-forest),
                 1px 1px 0px var(--ghibli-forest);
    letter-spacing: 4px;
  }
  
  .title-sub {
    font-size: 1rem;
    color: white;
    background: var(--ghibli-earth);
    padding: 2px 12px;
    border-radius: 10px;
    width: fit-content;
    margin-top: 5px;
    letter-spacing: 2px;
    box-shadow: 2px 2px 0px white;
  }
}

.header-subtitle {
  color: white;
  font-size: 1.1rem;
  margin-top: 15px;
  font-weight: 700;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.3);
  background: rgba(34, 139, 34, 0.4);
  padding: 5px 15px;
  border-radius: 20px;
  width: fit-content;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 2;
}

.user-info-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.3);
  padding: 5px 15px;
  border-radius: 30px;
  border: 1px solid white;
  color: var(--ghibli-earth);
  font-weight: 700;
  backdrop-filter: blur(5px);
}

.ghibli-btn-primary {
  background: linear-gradient(135deg, var(--ghibli-forest) 0%, #2d5a27 100%) !important;
  color: white !important;
  border: 3px solid white !important;
  padding: 12px 30px !important;
  border-radius: 30px !important;
  font-size: 18px !important;
  font-weight: 800 !important;
  text-decoration: none !important;
  box-shadow: 0 8px 20px rgba(34, 139, 34, 0.4) !important;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 12px 25px rgba(34, 139, 34, 0.5) !important;
    background: linear-gradient(135deg, #2d5a27 0%, var(--ghibli-forest) 100%) !important;
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.ghibli-btn-mini {
  background: var(--ghibli-forest);
  color: white;
  border: 2px solid white;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    background: #2d5a27;
    transform: scale(1.05);
  }
}

/* 导航栏 */
.app-nav {
  background: white;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 2px solid #f0e6d2;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 5px;
}

.nav-item {
  padding: 15px 25px;
  color: #8b7355;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s;
  border-bottom: 4px solid transparent;
  
  &:hover {
    color: var(--ghibli-forest);
    background: #fdfaf2;
  }
  
  &.active {
    color: var(--ghibli-forest);
    border-bottom-color: var(--ghibli-forest);
    background: #f0fdf4;
  }
}

/* 主内容 */
.app-main {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  box-sizing: border-box;
}

/* 动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 页脚 */
.app-footer {
  background: white;
  padding: 40px 20px;
  border-top: 4px solid #f0e6d2;
  text-align: center;
  
  .footer-content {
    color: #a09680;
    
    p { margin: 5px 0; font-weight: 600; }
    
    .footer-divider {
      width: 40px;
      height: 3px;
      background: var(--ghibli-leaf);
      margin: 15px auto;
      border-radius: 5px;
    }
    
    .footer-note {
      font-size: 0.85rem;
      font-style: italic;
      opacity: 0.7;
    }
  }
}

@media (max-width: 768px) {
  .app-header { padding: 20px; flex-direction: column; gap: 20px; }
  .nav-container { flex-wrap: wrap; }
  .nav-item { padding: 10px 15px; font-size: 14px; }
}
</style>
