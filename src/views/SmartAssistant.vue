<template>
  <div class="smart-assistant-page ghibli-theme">
    <div class="ghibli-bg-decor">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
    </div>

    <div class="assistant-layout">
      <!-- 左侧：历史记录侧边栏 (桌面端) -->
      <aside class="history-sidebar" v-if="!isMobile">
        <div class="sidebar-header">
          <el-button class="new-chat-btn" @click="startNewChat">
            <el-icon><Plus /></el-icon>
            <span>开启新对话</span>
          </el-button>
        </div>
        <div class="history-list">
          <div 
            v-for="session in chatSessions" 
            :key="session.id" 
            class="history-item"
            :class="{ active: currentSessionId === session.id }"
            @click="loadSession(session.id)"
          >
            <el-icon><ChatDotRound /></el-icon>
            <span class="history-title">{{ session.title }}</span>
          </div>
        </div>
      </aside>

      <!-- 移动端侧边栏 (Drawer) -->
      <el-drawer
        v-model="showHistoryDrawer"
        direction="left"
        size="280px"
        title="历史对话"
        class="ghibli-drawer"
        v-if="isMobile"
      >
        <div class="sidebar-header">
          <el-button class="new-chat-btn" @click="startNewChat(); showHistoryDrawer = false">
            <el-icon><Plus /></el-icon>
            <span>开启新对话</span>
          </el-button>
        </div>
        <div class="history-list">
          <div 
            v-for="session in chatSessions" 
            :key="session.id" 
            class="history-item"
            :class="{ active: currentSessionId === session.id }"
            @click="loadSession(session.id); showHistoryDrawer = false"
          >
            <el-icon><ChatDotRound /></el-icon>
            <span class="history-title">{{ session.title }}</span>
          </div>
        </div>
      </el-drawer>

      <!-- 主界面：聊天区域 -->
      <main class="chat-main">
        <!-- 移动端导航栏 -->
        <div class="mobile-nav" v-if="isMobile">
          <el-button circle @click="showHistoryDrawer = true">
            <el-icon><Menu /></el-icon>
          </el-button>
          <span class="current-chat-title">{{ currentSessionTitle }}</span>
          <el-button circle @click="startNewChat">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>

        <div class="chat-layout">
          <!-- 欢迎界面 -->
          <div class="welcome-section" v-if="messages.length === 0">
            <div class="welcome-badge">森林之声</div>
            <h1 class="welcome-title">你今天在想些什么？</h1>
            <p class="welcome-subtitle">我是你的森林管家，随时为你解答健康疑惑</p>
            
            <div class="suggestions-container" v-if="suggestions.length > 0">
              <div class="suggestion-item" 
                   v-for="(sug, idx) in suggestions" 
                   :key="idx"
                   @click="handleSuggestionClick(sug)">
                <el-icon class="sug-icon"><MagicStick /></el-icon>
                <span>{{ sug }}</span>
              </div>
            </div>
            <div class="suggestions-loading" v-else-if="isLoadingSuggestions">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在为你准备灵感问题...</span>
            </div>
          </div>

          <!-- 聊天内容区域 -->
          <div class="chat-messages" ref="messagesContainer" v-else>
            <div v-for="(msg, index) in messages" :key="index" class="message-wrapper" :class="msg.role">
              <div class="message-avatar" v-if="msg.role === 'assistant'">
                <div class="avatar-ghibli assistant-avatar">
                  <el-icon><Service /></el-icon>
                </div>
              </div>
              <div class="message-content">
                <div class="message-bubble" :class="{'ghibli-parchment': msg.role === 'assistant'}">
                  <div v-if="msg.loading" class="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                  <div v-else class="markdown-body" v-html="formatMessage(msg.content)"></div>
                </div>
              </div>
              <div class="message-avatar" v-if="msg.role === 'user'">
                <div class="avatar-ghibli user-avatar">
                  <el-icon><UserFilled /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部：输入区域 -->
          <div class="input-area-wrapper">
            <div class="input-container-ghibli">
              <input 
                v-model="inputMessage" 
                class="chat-input-ghibli" 
                placeholder="有问题，尽管问" 
                @keyup.enter="sendMessage"
                :disabled="isProcessing"
              />
              <div class="right-actions">
                <el-button 
                  class="send-btn-ghibli" 
                  circle 
                  :disabled="!inputMessage.trim() || isProcessing"
                  @click="sendMessage"
                  :loading="isProcessing"
                >
                  <el-icon v-if="!isProcessing"><Position /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed, onUnmounted, watch } from 'vue';
import { Service, UserFilled, Plus, Position, MagicStick, Loading, ChatDotRound, Menu } from '@element-plus/icons-vue';
import { marked } from 'marked';
import { SmartAssistantAgent } from '@/agents/SmartAssistantAgent';
import { useHealthStore } from '@/store/healthStore';
import { ElMessage } from 'element-plus/es';
import { storeToRefs } from 'pinia';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

const healthStore = useHealthStore();
const { currentChatMessages: messages, chatSessions, currentSessionId } = storeToRefs(healthStore);
const agent = new SmartAssistantAgent();

const inputMessage = ref('');
const isProcessing = ref(false);
const isLoadingSuggestions = ref(false);
const showHistoryDrawer = ref(false);
const messagesContainer = ref<HTMLElement | null>(null);

const suggestions = ref<string[]>([]);

// 响应式判断
const isMobile = ref(window.innerWidth < 768);
const handleResize = () => { isMobile.value = window.innerWidth < 768; };

const currentSessionTitle = computed(() => {
  const session = chatSessions.value.find(s => s.id === currentSessionId.value);
  return session ? session.title : '智能健康管家';
});

// 监听消息变化，自动滚动到底部
watch(() => messages.value.length, () => {
  scrollToBottom();
}, { deep: true });

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await loadInitialData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const loadInitialData = async () => {
  try {
    isLoadingSuggestions.value = true;
    
    // 1. 获取会话列表
    await healthStore.fetchChatSessions();
    
    // 2. 获取健康数据以生成建议
    if (!healthStore.currentHealthData) {
      await healthStore.fetchCurrentHealthData();
    }
    const healthData = healthStore.currentHealthData || {};
    const res = await agent.generateSuggestions(healthData);
    suggestions.value = res;
  } catch (error) {
    console.error('加载初始数据失败:', error);
  } finally {
    isLoadingSuggestions.value = false;
  }
};

const startNewChat = () => {
  healthStore.currentSessionId = null;
  healthStore.currentChatMessages = [];
};

const loadSession = async (sessionId: string | null) => {
  if (!sessionId) return;
  
  // 1. 设置当前会话 ID
  healthStore.currentSessionId = sessionId;
  
  // 2. 拉取消息
  await healthStore.fetchChatMessages(sessionId);
  
  if (isMobile.value) {
    showHistoryDrawer.value = false;
  }
};

const scrollToBottom = () => {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, 100);
};

const formatMessage = (content: string) => {
  if (!content) return '';
  return marked.parse(content);
};

const handleSuggestionClick = (sug: string) => {
  inputMessage.value = sug;
  sendMessage();
};

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isProcessing.value) return;

  const userMsg = inputMessage.value;
  inputMessage.value = '';
  
  // 1. 确保有会话，没有则创建
  let sessionId = currentSessionId.value;
  if (!sessionId) {
    const newSession = await healthStore.createChatSession(userMsg.slice(0, 20) + (userMsg.length > 20 ? '...' : ''));
    if (!newSession) {
      ElMessage.error('创建对话失败');
      return;
    }
    sessionId = newSession.id;
  }

  // 2. 保存并展示用户消息
  if (sessionId) {
    const savedUserMsg = await healthStore.saveChatMessage(sessionId, 'user', userMsg);
    if (savedUserMsg) {
      healthStore.currentChatMessages.push(savedUserMsg);
    } else {
      healthStore.currentChatMessages.push({ role: 'user', content: userMsg });
    }
  }
  scrollToBottom();

  // 3. AI 处理
  isProcessing.value = true;
  const aiPlaceholder: Message = { role: 'assistant', content: '', loading: true };
  healthStore.currentChatMessages.push(aiPlaceholder);
  scrollToBottom();

  try {
    const healthData = healthStore.currentHealthData || {};
    const history = messages.value.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await agent.process({
      message: userMsg,
      history,
      healthData
    });

    const lastMsgIndex = healthStore.currentChatMessages.length - 1;
    if (response.success && response.data && sessionId) {
      // 保存 AI 消息
      const savedAiMsg = await healthStore.saveChatMessage(sessionId, 'assistant', response.data.answer);
      if (savedAiMsg) {
        healthStore.currentChatMessages[lastMsgIndex] = savedAiMsg;
      } else {
        healthStore.currentChatMessages[lastMsgIndex] = { role: 'assistant', content: response.data.answer };
      }
    } else {
      healthStore.currentChatMessages[lastMsgIndex] = { 
        role: 'assistant', 
        content: `抱歉，森林信号不太好：${response.error || '未知错误'}` 
      };
    }
    
  } catch (error: any) {
    const lastMsgIndex = healthStore.currentChatMessages.length - 1;
    healthStore.currentChatMessages[lastMsgIndex] = { 
      role: 'assistant', 
      content: '哎呀，魔法失效了，请稍后再试。' 
    };
    ElMessage.error('对话请求失败');
  } finally {
    isProcessing.value = false;
    scrollToBottom();
  }
};
</script>

<style scoped lang="scss">
.smart-assistant-page {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.assistant-layout {
  display: flex;
  height: 100%;
  width: 100%;
}

/* 侧边栏样式 */
.history-sidebar {
  width: 260px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-right: 2px solid #f0e6d2;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
}

.new-chat-btn {
  width: 100%;
  height: 45px;
  border-radius: 12px;
  border: 2px dashed var(--ghibli-forest);
  background: white;
  color: var(--ghibli-forest);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  
  &:hover {
    background: var(--ghibli-forest);
    color: white;
    transform: translateY(-2px);
  }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.history-item {
  padding: 12px 15px;
  border-radius: 12px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #5d3a1a;
  font-weight: 600;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(34, 139, 34, 0.1);
  }
  
  &.active {
    background: var(--ghibli-forest);
    color: white;
  }

  .history-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }
}

/* 主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.mobile-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: white;
  border-bottom: 1px solid #f0e6d2;
  
  .current-chat-title {
    font-weight: 800;
    color: #5d3a1a;
    max-width: 200px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.chat-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 关键：防止布局溢出 */
}

.welcome-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  overflow-y: auto;
  
  .welcome-badge {
    background: var(--ghibli-forest);
    color: white;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 800;
    margin-bottom: 20px;
  }

  .welcome-title {
    font-size: 32px;
    font-weight: 900;
    color: #5d3a1a;
    text-shadow: 2px 2px 0 white;
    margin-bottom: 10px;
  }

  .welcome-subtitle {
    color: #8b7355;
    font-style: italic;
    margin-bottom: 40px;
  }
}

.suggestions-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 15px;
  width: 100%;
  max-width: 700px;
}

.suggestion-item {
  background: white;
  padding: 15px 20px;
  border-radius: 16px;
  border: 2px solid #f0e6d2;
  color: #5d3a1a;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  text-align: left;
  
  &:hover {
    transform: translateY(-3px) scale(1.02);
    background: #f0f9ff;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0; /* 关键：允许 flex 项目收缩 */
  
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background-color: rgba(139, 69, 19, 0.1); border-radius: 3px; }
}

.message-wrapper {
  display: flex;
  margin-bottom: 25px;
  align-items: flex-start;
  
  &.user {
    justify-content: flex-end;
    .message-bubble {
      background: var(--ghibli-forest);
      color: white;
      border-radius: 20px 20px 0 20px;
    }
  }
  
  &.assistant {
    justify-content: flex-start;
    .message-bubble {
      border-radius: 20px 20px 20px 0;
    }
  }
}

.avatar-ghibli {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  flex-shrink: 0;
  
  &.assistant-avatar { background: var(--ghibli-sky); color: white; }
  &.user-avatar { background: var(--ghibli-cherry-pink); color: white; }
}

.message-content {
  max-width: 75%;
}

.message-bubble {
  padding: 15px 20px;
  font-size: 16px;
  line-height: 1.7;
  word-break: break-word;
  
  &.ghibli-parchment {
    background-color: #fdfaf2;
    background-image: url('https://www.transparenttextures.com/patterns/natural-paper.png');
    border: 2px solid #e5dcc3;
    color: #4a453a;
  }
}

.input-area-wrapper {
  padding: 20px;
  background: transparent;
  flex-shrink: 0;
}

.input-container-ghibli {
  background-color: white;
  border: 3px solid #e5dcc3;
  border-radius: 30px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 30px rgba(139, 69, 19, 0.1);
  max-width: 800px;
  margin: 0 auto;
}

.chat-input-ghibli {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 15px;
  font-size: 16px;
  background: transparent;
  min-width: 0;
}

.send-btn-ghibli {
  background: var(--ghibli-forest) !important;
  color: white !important;
  width: 45px !important;
  height: 45px !important;
  flex-shrink: 0;
}

.markdown-body {
  :deep(p) { margin-bottom: 10px; &:last-child { margin-bottom: 0; } }
}

.typing-indicator {
  display: flex;
  gap: 5px;
  span { width: 8px; height: 8px; background: #a09680; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out; }
}

@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }

@media (max-width: 768px) {
  .assistant-layout { flex-direction: column; }
  .chat-messages { padding: 15px; }
  .message-content { max-width: 85%; }
  .input-area-wrapper { padding: 10px; }
}
</style>
