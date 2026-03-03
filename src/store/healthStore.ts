import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { HealthGoal, HealthAnalysis } from '../types';
import type { HealthData } from '../types/health';
import { db, supabase } from '../services/supabase';
import { useUserStore } from './userStore';

export const useHealthStore = defineStore('health', () => {
  // 响应式状态
  const currentHealthData = ref<HealthData | null>(null);
  const healthHistory = ref<HealthData[]>([]);
  const healthGoals = ref<HealthGoal[]>([]);
  const healthAnalyses = ref<HealthAnalysis[]>([]);
  const dailyCheckins = ref<any[]>([]);
  const chatSessions = ref<any[]>([]);
  const currentChatMessages = ref<any[]>([]);
  const currentSessionId = ref<string | null>(null);
  const aiAnalyses = ref<any[]>([]);
  const dailyAnalysisCount = ref(0);

  // 获取 AI 分析记录
  const fetchAIAnalyses = async () => {
    const userStore = useUserStore();
    const userId = userStore.userProfile?.id;
    if (!userId) return;

    try {
      const { data, error: err } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      aiAnalyses.value = data || [];
      
      // 计算今日分析次数
      const today = new Date().toISOString().split('T')[0];
      dailyAnalysisCount.value = aiAnalyses.value.filter(a => 
        a.created_at && a.created_at.startsWith(today)
      ).length;
    } catch (err: any) {
      console.error('获取 AI 分析失败:', err);
    }
  };

  // 保存 AI 分析
  const saveAIAnalysis = async (content: any, type: string = 'inspiration') => {
    const userStore = useUserStore();
    const userId = userStore.userProfile?.id;
    if (!userId) return null;

    try {
      const { data, error: err } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: userId,
          analysis_type: type,
          content,
          health_data_id: (currentHealthData.value as any)?.health_data_id
        })
        .select()
        .single();

      if (err) throw err;
      aiAnalyses.value.unshift(data);
      dailyAnalysisCount.value++;
      return data;
    } catch (err: any) {
      console.error('保存 AI 分析失败:', err);
      return null;
    }
  };

  // 获取对话会话列表
  const fetchChatSessions = async () => {
    try {
      const userId = userStore.userProfile?.id;
      if (!userId) return false;

      const result = await db.findAll('chat_sessions', {
        filters: { user_id: userId },
        orderBy: 'updated_at',
        ascending: false,
        useCache: false
      });

      if (result.success && result.data) {
        chatSessions.value = result.data.map(item => ({
          id: item.id,
          title: item.title,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at)
        }));
        
        // 尝试从本地加载当前会话
        if (!currentSessionId.value && chatSessions.value.length > 0) {
          const lastSessionId = localStorage.getItem('current_chat_session_id');
          if (lastSessionId && chatSessions.value.some(s => s.id === lastSessionId)) {
            currentSessionId.value = lastSessionId;
            await fetchChatMessages(lastSessionId);
          }
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('获取会话列表失败:', err);
      return false;
    }
  };

  // 获取特定会话的消息
  const fetchChatMessages = async (sessionId: string) => {
    try {
      // 先清空当前消息，避免显示上一个会话的内容
      currentChatMessages.value = [];
      
      const result = await db.findAll('chat_messages', {
        filters: { session_id: sessionId },
        orderBy: 'created_at',
        ascending: true,
        useCache: false
      });

      if (result.success && result.data) {
        currentChatMessages.value = result.data.map(item => ({
          id: item.id,
          role: item.role,
          content: item.content,
          createdAt: new Date(item.created_at)
        }));
        
        // 更新当前会话ID并持久化
        currentSessionId.value = sessionId;
        localStorage.setItem('current_chat_session_id', sessionId);
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('获取聊天记录失败:', err);
      return false;
    }
  };

  // 创建新会话
  const createChatSession = async (title: string) => {
    try {
      const userId = userStore.userProfile?.id;
      if (!userId) return null;

      const result = await db.create('chat_sessions', {
        user_id: userId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (result.success && result.data) {
        const newSession = {
          id: result.data[0].id,
          title: result.data[0].title,
          createdAt: new Date(result.data[0].created_at),
          updatedAt: new Date(result.data[0].updated_at)
        };
        chatSessions.value.unshift(newSession);
        currentSessionId.value = newSession.id;
        currentChatMessages.value = [];
        return newSession;
      }
      return null;
    } catch (err) {
      console.error('创建会话失败:', err);
      return null;
    }
  };

  // 保存消息
  const saveChatMessage = async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      const userId = userStore.userProfile?.id;
      if (!userId) return null;

      const result = await db.create('chat_messages', {
        session_id: sessionId,
        user_id: userId,
        role,
        content,
        created_at: new Date().toISOString()
      });

      if (result.success && result.data) {
        // 更新会话的 updated_at
        await db.update('chat_sessions', sessionId, {
          updated_at: new Date().toISOString()
        });
        
        // 更新本地会话列表排序
        const sessionIndex = chatSessions.value.findIndex(s => s.id === sessionId);
        if (sessionIndex > -1) {
          const session = chatSessions.value.splice(sessionIndex, 1)[0];
          session.updatedAt = new Date();
          chatSessions.value.unshift(session);
        }

        return {
          id: result.data[0].id,
          role: result.data[0].role,
          content: result.data[0].content,
          createdAt: new Date(result.data[0].created_at)
        };
      }
      return null;
    } catch (err) {
      console.error('保存消息失败:', err);
      return null;
    }
  };
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const userStore = useUserStore();
  const selectedDateRange = ref<{
    start: Date;
    end: Date;
  }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 默认30天前
    end: new Date()
  });

  const normalizeSleepQuality = (value: any) => {
    if (typeof value === 'number') {
      const qualityMap = ['很差', '较差', '一般', '良好', '优秀'];
      const index = Math.max(0, Math.min(4, value - 1));
      return qualityMap[index];
    }
    return value;
  };

  const normalizeHealthData = (record: any): HealthData & { created_at?: string; id?: string | number } => {
    const createdAt = record?.created_at || record?.createdAt || record?.recordDate;
    const height = record?.height ?? undefined;
    const weight = record?.weight ?? undefined;
    const bmi = record?.bmi ?? (height && weight ? Number((weight / Math.pow(height / 100, 2)).toFixed(2)) : undefined);

    return {
      id: record?.health_data_id ?? record?.id,
      age: record?.age ?? undefined,
      gender: record?.gender ?? undefined,
      height,
      weight,
      bmi,
      systolic: record?.systolic ?? record?.systolic_pressure ?? undefined,
      diastolic: record?.diastolic ?? record?.diastolic_pressure ?? undefined,
      heartRate: record?.heartRate ?? record?.heart_rate ?? undefined,
      stressLevel: record?.stressLevel ?? record?.stress_level ?? undefined,
      exerciseFrequency: record?.exerciseFrequency ?? record?.exercise_frequency ?? undefined,
      sleepHours: record?.sleepHours ?? record?.sleep_hours ?? undefined,
      sleepQuality: record?.sleepQuality ?? normalizeSleepQuality(record?.sleep_quality),
      dailySteps: record?.dailySteps ?? record?.steps ?? undefined,
      waterCups: record?.waterCups ?? record?.water_cups ?? undefined,
      checkinPeriod: record?.checkinPeriod ?? record?.checkin_period ?? undefined,
      dietPreferences: Array.isArray(record?.dietPreferences)
        ? record.dietPreferences
        : Array.isArray(record?.flavor_preferences)
          ? record.flavor_preferences
          : undefined,
      allergies: Array.isArray(record?.allergies) ? record.allergies : undefined,
      dietaryRestrictions: record?.dietaryRestrictions ?? undefined,
      createdAt: createdAt,
      updatedAt: record?.updated_at ?? record?.updatedAt,
      recordDate: record?.recordDate ?? undefined,
      created_at: createdAt
    };
  };

  const toNumber = (value: any) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  };

  const getLatestValue = (items: any[], key: string) => {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const value = toNumber(items[i]?.[key]);
      if (value !== null) return value;
    }
    return null;
  };

  const getAverageValue = (items: any[], key: string, digits = 0) => {
    const values = items
      .map(item => toNumber(item?.[key]))
      .filter((value): value is number => value !== null);
    if (!values.length) return null;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return digits > 0 ? Number(avg.toFixed(digits)) : Math.round(avg);
  };

  // 计算属性
  const activeGoals = computed(() => healthGoals.value.filter(goal => goal && goal.isActive));
  const completedGoals = computed(() => healthGoals.value.filter(goal => goal && !goal.isActive && 
    (goal.currentValue ?? 0) === (goal.targetValue ?? 0)));
  const progressPercentage = computed(() => {
    return (goalId: string) => {
      const goal = healthGoals.value.find(g => g.id === goalId);
      if (!goal || !goal.targetValue || goal.targetValue === 0) return 0;
      
      const currentValue = goal.currentValue || 0;
      const progress = Math.abs((currentValue - goal.targetValue) / goal.targetValue * 100);
      return Math.min(100, Math.max(0, progress));
    };
  });

  const currentBMI = computed(() => {
    if (!currentHealthData.value) return null;
    const { weight, height } = currentHealthData.value;
    if (!weight || !height) return null;
    const heightInMeters = height / 100;
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(2));
  });

  const bmiCategory = computed(() => {
    if (!currentBMI.value) return null;
    const bmi = currentBMI.value;
    if (bmi < 18.5) return 'underweight';
    if (bmi < 24) return 'normal';
    if (bmi < 28) return 'overweight';
    return 'obese';
  });

  const recentTrends = computed(() => {
    // 获取最近7天的数据
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentData = healthHistory.value
      .filter(data => new Date(data.createdAt || data.recordDate || '').getTime() >= sevenDaysAgo.getTime())
      .sort((a, b) => new Date(a.createdAt || a.recordDate || '').getTime() - new Date(b.createdAt || b.recordDate || '').getTime());

    if (recentData.length < 2) return null;

    const firstData = recentData[0];
    const lastData = recentData[recentData.length - 1];
    
    const firstWeight = firstData.weight || 0;
    const lastWeight = lastData.weight || 0;
    const firstBmi = firstData.bmi || 0;
    const lastBmi = lastData.bmi || 0;

    return {
      weight: {
        change: Number((lastWeight - firstWeight).toFixed(1)),
        trend: lastWeight < firstWeight ? 'decreasing' : 'increasing'
      },
      bmi: {
        change: Number((lastBmi - firstBmi).toFixed(1)),
        trend: lastBmi < firstBmi ? 'decreasing' : 'increasing'
      }
    };
  });

  const filteredHistory = computed(() => {
    return healthHistory.value.filter(data => {
      const recordDate = new Date(data.createdAt || data.recordDate || '');
      return recordDate >= selectedDateRange.value.start && recordDate <= selectedDateRange.value.end;
    }).sort((a, b) => new Date(b.createdAt || b.recordDate || '').getTime() - new Date(a.createdAt || a.recordDate || '').getTime());
  });

  // 动作
  const fetchCurrentHealthData = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 从数据库获取最新的健康数据
      const result = await db.findAll('health_data', { 
        filters: { user_id: userId }, 
        orderBy: 'created_at', 
        ascending: false, 
        limit: 1,
        useCache: false
      });
      
      if (result.data && result.data.length > 0) {
        currentHealthData.value = normalizeHealthData(result.data[0]);
        // 持久化到本地存储
        persistHealthData();
      } else {
        currentHealthData.value = null; // 如果没有数据，清空当前状态
      }
      
      return true;
    } catch (err) {
      console.error('获取健康数据失败:', err);
      error.value = err instanceof Error ? err.message : '获取健康数据失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchHealthHistory = async (dateRange?: { start: Date; end: Date }) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      if (dateRange) {
        selectedDateRange.value = dateRange;
      }
      
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 从数据库获取健康历史数据
      const filters = {
        user_id: userId
        // created_at: {
        //   gte: selectedDateRange.value.start.toISOString(),
        //   lte: selectedDateRange.value.end.toISOString()
        // }
      };
      
      const result = await db.findAll('health_data', { 
        filters: filters, 
        orderBy: 'created_at', 
        ascending: false,
        useCache: false
      });
      
      if (result.data) {
        healthHistory.value = result.data.map(item => normalizeHealthData(item));
        // 持久化到本地存储
        persistHealthData();
      } else {
        healthHistory.value = []; // 如果没有数据，清空历史记录
      }
      
      return true;
    } catch (err) {
      console.error('获取健康历史失败:', err);
      error.value = err instanceof Error ? err.message : '获取健康历史失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchDailyCheckins = async (date: Date = new Date()) => {
    try {
      isLoading.value = true;
      error.value = null;
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 使用本地时间格式化为 YYYY-MM-DD，避免时区偏移导致获取到前一天的数据
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const result = await db.findAll('daily_checkins', {
        filters: {
          user_id: userId,
          check_in_date: dateStr
        },
        orderBy: 'created_at',
        ascending: true,
        useCache: false
      });

      if (result.success && result.data) {
        dailyCheckins.value = result.data;
        return true;
      }

      dailyCheckins.value = [];
      if (!result.success) {
        error.value = result.error || result.message || '获取每日打卡失败';
      }
      return result.success;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取每日打卡失败';
      dailyCheckins.value = [];
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const createDailySummaryFromCheckins = async (date: Date = new Date()) => {
    try {
      isLoading.value = true;
      error.value = null;
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }
      const dateStr = date.toISOString().split('T')[0];
      const checkinsResult = await db.findAll('daily_checkins', {
        filters: {
          user_id: userId,
          check_in_date: dateStr
        },
        orderBy: 'created_at',
        ascending: true,
        useCache: false
      });

      if (!checkinsResult.success || !checkinsResult.data?.length) {
        dailyCheckins.value = [];
        error.value = checkinsResult.error || checkinsResult.message || '今日暂无打卡记录';
        return false;
      }

      dailyCheckins.value = checkinsResult.data;

      if (!currentHealthData.value) {
        await fetchCurrentHealthData();
      }

      const baseData = currentHealthData.value || {};
      const stepsValues = dailyCheckins.value
        .map(item => toNumber(item.steps))
        .filter((value): value is number => value !== null);
      const waterValues = dailyCheckins.value
        .map(item => toNumber(item.water_cups))
        .filter((value): value is number => value !== null);
      const totalSteps = stepsValues.reduce((sum, value) => sum + value, 0);
      const totalWater = waterValues.reduce((sum, value) => sum + value, 0);
      const latestWeight = getLatestValue(dailyCheckins.value, 'weight');
      const latestSleepHours = getLatestValue(dailyCheckins.value, 'sleep_hours');
      const avgSystolic = getAverageValue(dailyCheckins.value, 'systolic_pressure');
      const avgDiastolic = getAverageValue(dailyCheckins.value, 'diastolic_pressure');
      const avgHeartRate = getAverageValue(dailyCheckins.value, 'heart_rate');
      const avgStressLevel = getAverageValue(dailyCheckins.value, 'stress_level', 1);

      const summaryHealthData = {
        ...baseData,
        weight: latestWeight ?? baseData.weight,
        sleepHours: latestSleepHours ?? baseData.sleepHours,
        systolic: avgSystolic ?? baseData.systolic,
        diastolic: avgDiastolic ?? baseData.diastolic,
        heartRate: avgHeartRate ?? baseData.heartRate,
        stressLevel: avgStressLevel ?? baseData.stressLevel,
        dailySteps: stepsValues.length ? totalSteps : baseData.dailySteps,
        waterCups: waterValues.length ? totalWater : baseData.waterCups,
        checkinPeriod: 'evening'
      };

      const saved = await addHealthData(summaryHealthData);
      return saved;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '生成每日汇总失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  // 动作：添加健康数据
  const addHealthData = async (_healthData: any) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const userId = userStore.userProfile?.id;
      if (!userId) {
        throw new Error('用户未登录');
      }
      
      // 计算BMI
      const healthData = {
        user_id: userId,
        // 基础信息
        age: _healthData.age,
        gender: _healthData.gender,
        height: _healthData.height,
        weight: _healthData.weight,
        
        // 健康指标
        systolic_pressure: _healthData.systolic,
        diastolic_pressure: _healthData.diastolic,
        heart_rate: _healthData.heartRate,
        stress_level: _healthData.stressLevel,
        
        // 生活习惯
        exercise_frequency: _healthData.exerciseFrequency,
        sleep_hours: _healthData.sleepHours,
        sleep_quality: _healthData.sleepQuality,

      steps: _healthData.dailySteps ?? _healthData.steps,
      water_cups: _healthData.waterCups,
      checkin_period: _healthData.checkinPeriod,
        
        // 饮食偏好 (注意：这里将 allergies 和 dietPreferences 合并到 flavor_preferences，因为数据库只有这一个数组字段)
        flavor_preferences: [
          ...(_healthData.dietPreferences || []),
          ...(_healthData.allergies || [])
        ],
        
        // recordDate: new Date().toISOString(),
      };
      
      // 保存到数据库
      const result = await db.create('health_data', healthData);
      
      if (!result.success) {
        error.value = result.error || result.message || '创建健康数据失败';
        return false;
      }

      if (result.success && result.data) {
        const savedData = normalizeHealthData(result.data);

        currentHealthData.value = savedData;
        healthHistory.value.unshift(savedData);
        
        // 持久化到本地存储
        persistHealthData();
        
        // 同时更新用户metadata中的健康数据
        try {
          await userStore.updateUserProfile({
            metadata: {
              ...userStore.userProfile?.metadata,
              height: healthData.height,
              weight: healthData.weight
            }
          });
        } catch (updateError) {
          console.error('更新用户元数据失败:', updateError);
        }
      }
      
      return result.success;
    } catch (err) {
      console.error('添加健康数据失败:', err);
      error.value = err instanceof Error ? err.message : '添加健康数据失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchHealthGoals = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API获取数据
      // 模拟API调用
      // const response = await healthService.getHealthGoals(userId);
      // healthGoals.value = response.data;
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取健康目标失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };
// 动作：添加健康目标
  const addHealthGoal = async (_goal: Omit<HealthGoal, 'id'>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API保存数据
      // 模拟API调用
      // const response = await healthService.addHealthGoal(goal);
      // healthGoals.value.push(response.data);
      
      // 持久化
      persistHealthGoals();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加健康目标失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };
// 动作：更新健康目标
  const updateHealthGoal = async (goalId: string, _updates: Partial<HealthGoal>) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const goalIndex = healthGoals.value.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        throw new Error('目标不存在');
      }
      
      // 这里应该调用API更新数据
      // 模拟API调用
      // const response = await healthService.updateHealthGoal(goalId, updates);
      // healthGoals.value[goalIndex] = response.data;
      
      // 持久化
      persistHealthGoals();
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新健康目标失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchHealthAnalysis = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      // 这里应该调用API获取数据
      // 模拟API调用
      // const response = await healthService.getHealthAnalysis(userId);
      // healthAnalyses.value = response.data;
      
      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取健康分析失败';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 本地存储相关
  const persistHealthData = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('health_history', JSON.stringify(healthHistory.value));
        localStorage.setItem('current_health_data', JSON.stringify(currentHealthData.value));
      }
    } catch (err) {
      console.error('保存健康数据到本地存储失败:', err);
    }
  };

  const persistHealthGoals = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('health_goals', JSON.stringify(healthGoals.value));
      }
    } catch (err) {
      console.error('保存健康目标到本地存储失败:', err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const historyStr = localStorage.getItem('health_history');
        const currentDataStr = localStorage.getItem('current_health_data');
        const goalsStr = localStorage.getItem('health_goals');
        
        if (historyStr) healthHistory.value = JSON.parse(historyStr);
        if (currentDataStr) currentHealthData.value = JSON.parse(currentDataStr);
        if (goalsStr) healthGoals.value = JSON.parse(goalsStr);
      }
    } catch (err) {
      console.error('从本地存储加载健康数据失败:', err);
    }
  };

  const clearData = () => {
    currentHealthData.value = null;
    healthHistory.value = [];
    healthGoals.value = [];
    healthAnalyses.value = [];
    dailyCheckins.value = [];
    error.value = null;
    clearLocalStorage();
  };

  const clearLocalStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('health_history');
        localStorage.removeItem('current_health_data');
        localStorage.removeItem('health_goals');
      }
    } catch (err) {
      console.error('清除健康数据本地存储失败:', err);
    }
  };

  const clearHealthData = () => {
    currentHealthData.value = null;
    healthHistory.value = [];
    healthGoals.value = [];
    healthAnalyses.value = [];
    dailyCheckins.value = [];
    error.value = null;
    // 清除本地存储
    if (typeof window !== 'undefined') {
      localStorage.removeItem('health_data');
      localStorage.removeItem('health_history');
      localStorage.removeItem('health_goals');
    }
  };

  return {
    // 状态
    currentHealthData,
    healthHistory,
    healthGoals,
    healthAnalyses,
    dailyCheckins,
    chatSessions,
    currentChatMessages,
    currentSessionId,
    aiAnalyses,
    dailyAnalysisCount,
    isLoading,
    error,
    selectedDateRange,
    
    // 计算属性
    activeGoals,
    completedGoals,
    progressPercentage,
    currentBMI,
    bmiCategory,
    recentTrends,
    filteredHistory,
    
    // 动作
    fetchCurrentHealthData,
    fetchHealthHistory,
    fetchDailyCheckins,
    createDailySummaryFromCheckins,
    addHealthData,
    fetchChatSessions,
    fetchChatMessages,
    createChatSession,
    saveChatMessage,
    fetchAIAnalyses,
    saveAIAnalysis,
    fetchHealthGoals,
    addHealthGoal,
    updateHealthGoal,
    fetchHealthAnalysis,
    loadFromLocalStorage,
    clearData,
    clearHealthData
  };
});
