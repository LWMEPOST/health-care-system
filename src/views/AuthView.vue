<template>
  <div class="auth-container ghibli-theme">
    <div class="ghibli-bg-decor">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
    </div>
    
    <div class="ghibli-parchment-card auth-parchment">
      <div class="auth-header">
        <h1 class="ghibli-title-main">健康森林</h1>
        <p class="auth-subtitle">{{ isLoginMode ? '欢迎回到这片森林' : '种下你的第一颗健康种子' }}</p>
      </div>
      
      <!-- 认证表单组件 -->
      <AuthForm 
        v-model:is-login-mode="isLoginMode"
        :initial-redirect="redirectPath"
        @auth-success="handleAuthSuccess"
      />
      
      <!-- 切换登录/注册模式 -->
      <div class="auth-footer-ghibli">
        <span>
          {{ isLoginMode ? '还没有森林护照？' : '已有森林护照？' }}
          <el-button 
            type="text" 
            @click="toggleMode"
            class="ghibli-mode-btn"
          >
            {{ isLoginMode ? '立即开启' : '前往登录' }}
          </el-button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import AuthForm from '../components/AuthForm.vue';

const route = useRoute();
const router = useRouter();

// 登录/注册模式
const isLoginMode = ref(true);

// 从路由查询参数中获取重定向路径
const redirectPath = computed(() => {
  return route.query.redirect as string || '/';
});

// 切换登录/注册模式
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
};

// 处理认证成功
const handleAuthSuccess = () => {
  // 认证成功后重定向到指定页面或首页
  router.push(redirectPath.value).catch((error: any) => {
    console.error('重定向失败:', error);
    router.push('/');
  });
};
</script>

<style scoped lang="scss">
.auth-container {
  min-height: calc(100vh - 200px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  position: relative;
}

.auth-parchment {
  width: 100%;
  max-width: 450px;
  padding: 40px !important;
  background-color: #fefcf0 !important;
  border: 3px solid #e5dcc3 !important;
  box-shadow: 0 20px 50px rgba(139, 69, 19, 0.1) !important;
}

.auth-header {
  text-align: center;
  margin-bottom: 35px;
}

.ghibli-title-main {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--ghibli-earth, #8B4513);
  text-shadow: 2px 2px 0px white;
  margin-bottom: 10px;
  letter-spacing: 2px;
}

.auth-subtitle {
  color: #8b7355;
  font-weight: 600;
  font-style: italic;
  opacity: 0.8;
}

.auth-footer-ghibli {
  margin-top: 30px;
  text-align: center;
  border-top: 2px dashed #f0e6d2;
  padding-top: 20px;
  color: #a09680;
  font-weight: 600;
}

.ghibli-mode-btn {
  color: #228B22 !important;
  font-weight: 800 !important;
  font-size: 16px !important;
  text-decoration: underline !important;
  
  &:hover {
    color: #2d5a27 !important;
    transform: scale(1.05);
  }
}

/* 复用 App.vue 的云朵样式 */
.ghibli-bg-decor {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: -1;
  pointer-events: none;
}

.cloud {
  position: absolute;
  background: white;
  border-radius: 50px;
  opacity: 0.4;
  filter: blur(8px);
  animation: floatCloud 25s linear infinite;
}

.cloud-1 { width: 150px; height: 45px; top: 15%; left: -200px; }
.cloud-2 { width: 200px; height: 60px; top: 40%; left: -250px; animation-delay: -12s; }

@keyframes floatCloud {
  to { transform: translateX(calc(100vw + 300px)); }
}
</style>