// src/services/healthStorage.ts
// 健康数据本地存储服务

// 定义本地 HealthData 类型，避免依赖缺失的模块
interface HealthData {
  id?: string;
  userId?: string;
  heartRate?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  weight?: number;
  height?: number;
  bloodSugar?: number;
  temperature?: number;
  steps?: number;
  sleepHours?: number;
  recordDate?: string;
  updatedAt?: string;
  [key: string]: any;
}

// 存储键名常量
const STORAGE_KEYS = {
  CURRENT_HEALTH_DATA: 'health_care_system_current_data',
  HISTORICAL_HEALTH_DATA: 'health_care_system_historical_data',
  USER_PREFERENCES: 'health_care_system_preferences',
  LAST_SYNC_TIME: 'health_care_system_last_sync'
};

// 历史数据最大条目数
const MAX_HISTORICAL_RECORDS = 365;

/**
 * 健康数据存储服务
 * 提供本地数据缓存、读取、更新和删除功能
 */
export class HealthStorageService {
  /**
   * 保存当前健康数据
   * @param data 健康数据对象
   */
  static saveCurrentHealthData(data: HealthData): void {
    try {
      // 添加时间戳
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.CURRENT_HEALTH_DATA, JSON.stringify(dataWithTimestamp));
      
      // 同时添加到历史记录
      this.addToHistoricalData(dataWithTimestamp);
    } catch (error) {
      console.error('保存健康数据失败:', error);
      throw new Error('无法保存健康数据到本地存储');
    }
  }

  /**
   * 获取当前健康数据
   * @returns 健康数据对象或null
   */
  static getCurrentHealthData(): HealthData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_HEALTH_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('读取健康数据失败:', error);
      return null;
    }
  }

  /**
   * 添加数据到历史记录
   * @param data 要添加的健康数据
   */
  static addToHistoricalData(data: HealthData): void {
    try {
      const historicalData = this.getHistoricalData();
      
      // 添加当前日期作为历史记录的日期标识
      const recordWithDate = {
        ...data,
        recordDate: new Date().toISOString().split('T')[0]
      };
      
      // 添加到历史记录开头
      historicalData.unshift(recordWithDate);
      
      // 限制历史记录数量，防止存储过大
      if (historicalData.length > MAX_HISTORICAL_RECORDS) {
        historicalData.splice(MAX_HISTORICAL_RECORDS);
      }
      
      localStorage.setItem(STORAGE_KEYS.HISTORICAL_HEALTH_DATA, JSON.stringify(historicalData));
    } catch (error) {
      console.error('保存历史数据失败:', error);
    }
  }

  /**
   * 获取历史健康数据
   * @returns 历史健康数据数组
   */
  static getHistoricalData(): HealthData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORICAL_HEALTH_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('读取历史数据失败:', error);
      return [];
    }
  }

  /**
   * 获取指定时间范围的历史数据
   * @param days 天数范围
   * @returns 过滤后的历史数据
   */
  static getHistoricalDataByDays(days: number): HealthData[] {
    const historicalData = this.getHistoricalData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return historicalData.filter(record => {
      const recordDate = record.recordDate ? new Date(record.recordDate) : null;
      return recordDate && recordDate >= cutoffDate;
    });
  }

  /**
   * 保存用户偏好设置
   * @param preferences 用户偏好对象
   */
  static saveUserPreferences(preferences: Record<string, any>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('保存用户偏好失败:', error);
    }
  }

  /**
   * 获取用户偏好设置
   * @returns 用户偏好对象
   */
  static getUserPreferences(): Record<string, any> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('读取用户偏好失败:', error);
      return {};
    }
  }

  /**
   * 清除所有存储的健康数据
   */
  static clearAllHealthData(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_HEALTH_DATA);
      localStorage.removeItem(STORAGE_KEYS.HISTORICAL_HEALTH_DATA);
    } catch (error) {
      console.error('清除健康数据失败:', error);
      throw new Error('无法清除本地存储的健康数据');
    }
  }

  /**
   * 删除指定日期的历史记录
   * @param recordDate 记录日期（YYYY-MM-DD格式）
   * @returns 是否删除成功
   */
  static deleteHistoricalRecord(recordDate: string): boolean {
    try {
      const historicalData = this.getHistoricalData();
      const filteredData = historicalData.filter(record => record.recordDate !== recordDate);
      
      if (filteredData.length === historicalData.length) {
        return false; // 没有找到要删除的记录
      }
      
      localStorage.setItem(STORAGE_KEYS.HISTORICAL_HEALTH_DATA, JSON.stringify(filteredData));
      return true;
    } catch (error) {
      console.error('删除历史记录失败:', error);
      return false;
    }
  }

  /**
   * 检查本地存储是否可用
   * @returns 是否可用
   */
  static isStorageAvailable(): boolean {
    try {
      const testKey = '__health_storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取本地存储使用情况
   * @returns 使用情况信息
   */
  static getStorageInfo(): { used: number; available: boolean } {
    try {
      let totalSize = 0;
      
      // 计算所有键值对的大小
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      
      // 转换为KB
      const usedInKB = (totalSize / 1024).toFixed(2);
      
      return {
        used: parseFloat(usedInKB),
        available: true
      };
    } catch (error) {
      console.error('获取存储信息失败:', error);
      return {
        used: 0,
        available: false
      };
    }
  }

  /**
   * 设置最后同步时间
   * @param timestamp 时间戳
   */
  static setLastSyncTime(timestamp: string = new Date().toISOString()): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC_TIME, timestamp);
    } catch (error) {
      console.error('设置同步时间失败:', error);
    }
  }

  /**
   * 获取最后同步时间
   * @returns 最后同步时间字符串或null
   */
  static getLastSyncTime(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC_TIME);
    } catch (error) {
      console.error('获取同步时间失败:', error);
      return null;
    }
  }

  /**
   * 导出所有数据（用于备份）
   * @returns 包含所有数据的对象
   */
  static exportAllData(): Record<string, any> {
    return {
      currentData: this.getCurrentHealthData(),
      historicalData: this.getHistoricalData(),
      preferences: this.getUserPreferences(),
      exportDate: new Date().toISOString()
    };
  }

  /**
   * 导入数据（用于恢复）
   * @param exportedData 要导入的数据对象
   * @returns 是否导入成功
   */
  static importAllData(exportedData: Record<string, any>): boolean {
    try {
      if (exportedData.currentData) {
        this.saveCurrentHealthData(exportedData.currentData);
      }
      
      if (Array.isArray(exportedData.historicalData)) {
        localStorage.setItem(STORAGE_KEYS.HISTORICAL_HEALTH_DATA, JSON.stringify(exportedData.historicalData));
      }
      
      if (exportedData.preferences) {
        this.saveUserPreferences(exportedData.preferences);
      }
      
      this.setLastSyncTime();
      return true;
    } catch (error) {
      console.error('导入数据失败:', error);
      return false;
    }
  }
}

// 数据同步管理（模拟云端同步功能）
export class HealthDataSyncManager {
  /**
   * 模拟数据同步
   * 实际应用中，这里应该调用真实的API接口
   */
  static async syncData(): Promise<boolean> {
    try {
      // 模拟网络请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 在实际应用中，这里应该：
      // 1. 获取本地最新数据
      // 2. 调用API上传数据
      // 3. 处理服务器返回的结果
      // 4. 更新本地同步状态
      
      // 更新最后同步时间
      HealthStorageService.setLastSyncTime();
      
      console.log('数据同步成功');
      return true;
    } catch (error) {
      console.error('数据同步失败:', error);
      return false;
    }
  }

  /**
   * 获取同步状态信息
   * @returns 同步状态
   */
  static getSyncStatus(): { lastSync: string | null; status: 'synced' | 'pending' | 'error' } {
    const lastSync = HealthStorageService.getLastSyncTime();
    
    if (!lastSync) {
      return { lastSync: null, status: 'pending' };
    }
    
    // 检查是否在过去24小时内同步过
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const hoursSinceLastSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
    
    return {
      lastSync,
      status: hoursSinceLastSync < 24 ? 'synced' : 'pending'
    };
  }

  /**
   * 自动同步数据（可在应用启动时调用）
   */
  static async autoSync(): Promise<void> {
    const syncStatus = this.getSyncStatus();
    
    if (syncStatus.status === 'pending') {
      await this.syncData();
    }
  }
}

// 默认导出
export default {
  storage: HealthStorageService,
  sync: HealthDataSyncManager
};