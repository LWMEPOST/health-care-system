<template>
  <div class="auth-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      size="large"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="电子邮箱" prop="email">
        <el-input
          v-model="formData.email"
          placeholder="请输入您的邮箱地址"
          prefix-icon="Message"
          type="email"
          clearable
        />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="formData.password"
          placeholder="请输入密码（至少6位）"
          prefix-icon="Lock"
          type="password"
          show-password
          clearable
        />
      </el-form-item>

      <el-form-item v-if="!isLoginMode" label="确认密码" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          placeholder="请再次输入密码"
          prefix-icon="Lock"
          type="password"
          show-password
          clearable
        />
      </el-form-item>

      <el-form-item v-if="!isLoginMode" label="昵称（可选）" prop="username">
        <el-input
          v-model="formData.username"
          placeholder="请输入您的昵称"
          prefix-icon="User"
          clearable
        />
      </el-form-item>

      <div class="form-actions">
        <el-button
          type="primary"
          native-type="submit"
          :loading="loading"
          class="submit-btn"
        >
          {{ isLoginMode ? '登录' : '注册' }}
        </el-button>
      </div>

      <div class="form-footer" v-if="isLoginMode">
        <el-button link type="info" size="small">忘记密码？</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Message, Lock, User } from '@element-plus/icons-vue';
import { useUserStore } from '../store/userStore';
import { auth } from '../services/supabase';

const props = defineProps<{
  isLoginMode: boolean;
  initialRedirect?: string;
}>();

const emit = defineEmits<{
  (e: 'update:isLoginMode', value: boolean): void;
  (e: 'auth-success'): void;
}>();

const userStore = useUserStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  username: ''
});

// 验证规则
const rules = computed<FormRules>(() => {
  const baseRules = {
    email: [
      { required: true, message: '请输入邮箱地址', trigger: 'blur' },
      { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
    ]
  };

  if (!props.isLoginMode) {
    return {
      ...baseRules,
      confirmPassword: [
        { required: true, message: '请再次输入密码', trigger: 'blur' },
        {
          validator: (rule: any, value: any, callback: any) => {
            if (value !== formData.password) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    };
  }

  return baseRules;
});

// 监听模式切换，重置表单
watch(() => props.isLoginMode, () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
});

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        if (props.isLoginMode) {
          // 登录逻辑
          const response = await auth.login(formData.email, formData.password);
          
          if (response.success && response.data) {
            // 更新 Store
            await userStore.login({
              user: {
                id: response.data.user.id,
                email: response.data.user.email || '',
                username: response.data.user.user_metadata?.name || formData.email.split('@')[0],
                role: response.data.user.user_metadata?.role || 'user',
                createdAt: new Date(response.data.user.created_at),
                updatedAt: new Date(response.data.user.updated_at || new Date()),
                displayName: response.data.user.user_metadata?.name
              },
              session: {
                token: response.data.session?.access_token || '',
                refreshToken: response.data.session?.refresh_token || '',
                expiresAt: new Date((response.data.session?.expires_in || 3600) * 1000 + Date.now())
              },
              permissions: [] // 可以根据角色设置权限
            });
            
            ElMessage.success('登录成功');
            emit('auth-success');
          } else {
            ElMessage.error(response.message || '登录失败');
          }
        } else {
          // 注册逻辑
          const response = await auth.register(formData.email, formData.password, {
            name: formData.username
          });
          
          if (response.success) {
            ElMessage.success('注册成功，请检查邮箱进行验证，或者直接登录（如果是开发环境）');
            // 如果注册成功并自动登录（Supabase配置决定），则更新Store
            if (response.data?.session) {
               await userStore.login({
                user: {
                  id: response.data.user.id,
                  email: response.data.user.email || '',
                  username: response.data.user.user_metadata?.name || formData.username || formData.email.split('@')[0],
                  role: 'user',
                  createdAt: new Date(response.data.user.created_at),
                  updatedAt: new Date(response.data.user.updated_at || new Date()),
                  displayName: formData.username
                },
                session: {
                  token: response.data.session.access_token,
                  refreshToken: response.data.session.refresh_token,
                  expiresAt: new Date((response.data.session.expires_in || 3600) * 1000 + Date.now())
                },
                permissions: []
              });
              emit('auth-success');
            } else {
              // 切换到登录模式
              emit('update:isLoginMode', true);
            }
          } else {
            ElMessage.error(response.message || '注册失败');
          }
        }
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped lang="scss">
.auth-form {
  padding: 10px;
}

.submit-btn {
  width: 100%;
  margin-top: 20px;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
}

.form-footer {
  margin-top: 15px;
  text-align: right;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 8px 15px;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  
  &:hover {
    box-shadow: 0 0 0 1px #c0c4cc inset;
  }
  
  &.is-focus {
    box-shadow: 0 0 0 1px #409eff inset;
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}
</style>
