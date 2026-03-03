<template>
  <div class="profile-container">
    <el-card shadow="hover" class="profile-card">
      <!-- 个人信息卡片 -->
      <template #header>
        <div class="profile-header">
          <h2>个人资料</h2>
          <el-button 
            type="primary" 
            @click="toggleEditMode"
            :loading="isSubmitting"
          >
            {{ isEditMode ? '取消' : '编辑资料' }}
          </el-button>
        </div>
      </template>

      <!-- 头像上传区域 -->
      <div class="avatar-section">
        <el-upload
          v-if="isEditMode"
          class="avatar-uploader"
          :action="'#mock-upload'"
          :show-file-list="false"
          :before-upload="handleBeforeUpload"
          :http-request="handleAvatarUpload"
        >
          <img 
            v-if="userStore.userProfile?.avatarUrl" 
            :src="userStore.userProfile.avatarUrl" 
            class="avatar"
          />
          <el-icon class="avatar-placeholder" v-else><User /></el-icon>
        </el-upload>
        <div v-else class="avatar-display">
          <img 
            v-if="userStore.userProfile?.avatarUrl" 
            :src="userStore.userProfile.avatarUrl" 
            class="avatar"
          />
          <el-icon class="avatar-placeholder" v-else><User /></el-icon>
        </div>
        <div class="user-info">
          <h3>{{ userStore.displayName }}</h3>
          <p>{{ userStore.userProfile?.email }}</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="true"
        @close="errorMessage = ''"
        effect="light"
        class="error-alert"
      />

      <!-- 成功提示 -->
      <el-alert
        v-if="successMessage"
        :title="successMessage"
        type="success"
        show-icon
        :closable="true"
        @close="successMessage = ''"
        effect="light"
        class="success-alert"
      />

      <!-- 基本信息表单 -->
      <el-form
        ref="basicFormRef"
        :model="profileForm"
        :rules="basicValidationRules"
        label-width="100px"
        class="profile-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="profileForm.username"
            :disabled="!isEditMode"
            placeholder="请输入用户名"
          />
        </el-form-item>

        <el-form-item label="显示名称" prop="displayName">
          <el-input
            v-model="profileForm.displayName"
            :disabled="!isEditMode"
            placeholder="请输入显示名称"
          />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="profileForm.email"
            disabled
            placeholder="邮箱"
          />
          <div v-if="isEditMode" class="form-tip">邮箱不可修改</div>
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-select
            v-model="profileForm.gender"
            placeholder="请选择性别"
            :disabled="!isEditMode"
            :teleported="false"
          >
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
            <el-option label="保密" value="secret" />
          </el-select>
        </el-form-item>

        <el-form-item label="出生日期" prop="birthday">
          <el-date-picker
            v-model="profileForm.birthday"
            type="date"
            placeholder="选择出生日期"
            :disabled="!isEditMode"
            value-format="YYYY-MM-DD"
            :teleported="false"
          />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input
            v-model="profileForm.phone"
            :disabled="!isEditMode"
            placeholder="请输入电话号码"
          />
        </el-form-item>

        <el-form-item v-if="isEditMode">
          <el-button
            type="primary"
            @click="saveBasicInfo"
            :loading="isSubmitting"
          >
            保存信息
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { User } from '@element-plus/icons-vue';
import { useUserStore } from '../store/userStore';
import { storage, validation, db } from '../services/supabase';

const userStore = useUserStore();

// 表单状态
const isEditMode = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// 表单引用
const basicFormRef = ref();

// 个人基本信息表单
const profileForm = reactive({
  username: '',
  displayName: '',
  email: '',
  gender: '',
  birthday: '',
  phone: ''
});

// 定义验证器函数类型
interface FormValidatorCallback {
  (error?: Error | string): void;
}

// 验证规则
const basicValidationRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3-20个字符之间', trigger: 'blur' }
  ],
  displayName: [
    { required: true, message: '请输入显示名称', trigger: 'blur' },
    { min: 2, max: 30, message: '显示名称长度在2-30个字符之间', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { 
      validator: (_rule: any, value: string, callback: FormValidatorCallback) => {
        if (validation.isValidEmail(value)) {
          callback();
        } else {
          callback(new Error('请输入有效的邮箱地址'));
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { 
      validator: (_rule: any, value: string, callback: FormValidatorCallback) => {
        if (!value) {
          callback();
        } else if (/^1[3-9]\d{9}$/.test(value)) {
          callback();
        } else {
          callback(new Error('请输入有效的手机号码'));
        }
      },
      trigger: 'blur'
    }
  ]
};

// 初始化表单数据
const initFormData = async () => {
  // 尝试重新加载用户数据，确保获取最新的元数据
  try {
    await userStore.loadFromLocalStorage();
  } catch (error) {
    console.error('加载用户数据失败:', error);
  }
  
  const profile = userStore.userProfile;
  if (profile) {
    // 基本信息
    profileForm.username = profile.username || '';
    profileForm.displayName = profile.displayName || '';
    profileForm.email = profile.email || '';
    profileForm.gender = profile.metadata?.gender || '';
    profileForm.birthday = profile.metadata?.birthday || '';
    profileForm.phone = profile.metadata?.phone || '';
  }
};

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!isEditMode.value) {
    // 取消编辑时重置表单
    initFormData();
    // 重置表单验证
    if (basicFormRef.value) basicFormRef.value.clearValidate();
  }
};

// 保存基本信息
const saveBasicInfo = async () => {
  if (!basicFormRef.value || !userStore.userProfile) return;
  
  try {
    await basicFormRef.value.validate();
    isSubmitting.value = true;
    errorMessage.value = '';
    
    // 构建完整的元数据对象，确保保留所有现有字段
    const metadata = {
      ...userStore.userProfile.metadata,
      gender: profileForm.gender,
      birthday: profileForm.birthday,
      phone: profileForm.phone
    };
    
    // 直接通过database服务更新users表
    const userId = userStore.userProfile.id;
    // 确保不包含display_name字段，因为它不在schema中
    const updateData = {
      username: profileForm.username,
      display_name: profileForm.displayName,
      metadata: metadata,
      updated_at: new Date().toISOString()
    };
    
    const dbResult = await db.update('users', userId, updateData);
    
    if (dbResult.success) {
      // 更新store中的用户信息
      await userStore.updateUserProfile({
        username: profileForm.username,
        displayName: profileForm.displayName,
        metadata
      });
      
      successMessage.value = '基本信息保存成功';
      toggleEditMode();
    } else {
      errorMessage.value = dbResult.message || '数据库更新失败';
    }
  } catch (error: any) {
    console.error('保存基本信息失败:', error);
    errorMessage.value = error.message || '保存过程中发生错误';
  } finally {
    isSubmitting.value = false;
  }
};

// 处理头像上传前验证
const handleBeforeUpload = (rawFile: File) => {
  const isImage = rawFile.type.startsWith('image/');
  if (!isImage) {
    errorMessage.value = '请上传图片文件';
    return false;
  }
  
  const isLt2M = rawFile.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    errorMessage.value = '图片大小不能超过2MB';
    return false;
  }
  
  return true;
};

// 定义上传选项接口
interface UploadOptions {
  file: File;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
}

// 处理头像上传
const handleAvatarUpload = async (options: UploadOptions) => {
  try {
    isSubmitting.value = true;
    errorMessage.value = '';
    
    const file = options.file;
    const userId = userStore.userProfile?.id;
    
    if (!userId) {
      throw new Error('用户未登录');
    }
    
    // 上传到Supabase Storage
    const fileName = `avatars/${userId}/${Date.now()}_${file.name}`;
    const result = await storage.upload('user-avatars', fileName, file, {
      cacheControl: '3600',
      upsert: true,
      onProgress: (progress: number) => {
        console.log(`上传进度: ${progress}%`);
      }
    });
    
    if (result.success && result.data) {
      // 更新用户头像URL
      const success = await userStore.updateUserProfile({
        avatarUrl: result.data.url
      });
      
      if (success) {
        options.onSuccess?.(result);
        successMessage.value = '头像上传成功';
      } else {
        throw new Error('更新头像失败');
      }
    } else {
      throw new Error(result.message || '上传失败');
    }
  } catch (error: any) {
    console.error('头像上传失败:', error);
    errorMessage.value = error.message || '上传过程中发生错误';
    options.onError?.(error);
  } finally {
    isSubmitting.value = false;
  }
};

// 监听用户状态变化
watch(() => userStore.userProfile, async () => {
  await initFormData();
}, { deep: true });

// 组件挂载时初始化数据
onMounted(() => {
  initFormData();
});
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
  overflow: visible !important; /* 允许子元素溢出，解决日历/下拉框被裁剪 */
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.avatar-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px 0;
  border-bottom: 1px solid #ebeef5;
}

.avatar-uploader {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-display {
  width: 120px;
  height: 120px;
  position: relative;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  line-height: 120px;
  border-radius: 50%;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 40px;
  text-align: center;
}

.avatar-uploader .el-upload {
  border: 1px dashed #dcdfe6;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.user-info {
  margin-left: 30px;
}

.user-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.user-info p {
  margin: 0;
  color: #909399;
}

.error-alert,
.success-alert {
  margin-bottom: 20px;
}

.profile-form {
  margin-top: 20px;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    text-align: center;
  }
  
  .user-info {
    margin-left: 0;
    margin-top: 20px;
  }
}

/* 确保所有下拉框都有合适的宽度 */
.el-select {
  width: 100%;
}

/* 性别选择器的特定宽度 */
.el-form-item[prop="gender"] .el-select {
  max-width: 200px;
}</style>