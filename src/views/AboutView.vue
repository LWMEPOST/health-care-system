<template>
  <div class="about">
    <h1>关于个性化健康食谱推荐平台</h1>
    <p>这是一个基于Vue3 + TypeScript + Vite构建的现代化个性化健康食谱推荐平台，为用户提供专属的健康饮食方案。</p>
    <el-button type="default" @click="goToHome">返回首页</el-button>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
// @ts-ignore
import { ElButton } from 'element-plus'

const router = useRouter()

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.about {
  padding: 20px;
  h1 {
    color: #333;
    margin-bottom: 10px;
  }
  p {
    color: #666;
    margin-bottom: 20px;
  }
}
</style>