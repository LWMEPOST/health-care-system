<template>
  <div class="profile-view-container">
    <header class="page-header">
      <div class="header-content">
        <h1>个人资料</h1>
        <nav class="breadcrumb">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>个人资料</el-breadcrumb-item>
          </el-breadcrumb>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <!-- 个人资料管理组件 -->
      <ProfileManager />
    </main>
  </div>
</template>

<script setup lang="ts">

import ProfileManager from '../components/ProfileManager.vue';
</script>

<style scoped>
.profile-view-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.page-header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-content h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.breadcrumb {
  font-size: 14px;
  color: #909399;
}

.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 0 16px;
  }
  
  .header-content {
    padding: 16px 0;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .main-content {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0 12px;
  }
  
  .header-content {
    padding: 12px 0;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .main-content {
    padding: 12px;
  }
}
</style>