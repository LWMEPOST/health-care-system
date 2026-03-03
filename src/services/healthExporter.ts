import { HealthStorageService } from './healthStorage';
import type { HealthData } from '@/types/health';

/**
 * 健康数据导出服务
 * 提供将健康数据导出为CSV和JSON格式的功能
 */
export class HealthExporterService {
  /**
   * 将健康数据导出为JSON格式
   */
  static exportAsJSON(): void {
    try {
      // 获取当前健康数据
      const currentData = HealthStorageService.getCurrentHealthData();
      // 获取历史健康数据
      const historicalData = HealthStorageService.getHistoricalData();
      
      // 准备导出数据
      const exportData = {
        currentData,
        historicalData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      // 转换为JSON字符串
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // 创建下载
      this.downloadFile(
        jsonString,
        `health-data-${this.getFormattedDate()}.json`,
        'application/json'
      );
    } catch (error) {
      console.error('导出JSON失败:', error);
      throw new Error('导出健康数据失败');
    }
  }
  
  /**
   * 将健康数据导出为CSV格式
   * 主要导出历史数据，因为CSV适合表格数据
   */
  static exportAsCSV(): void {
    try {
      // 获取历史健康数据
      const historicalData = HealthStorageService.getHistoricalData();
      
      if (historicalData.length === 0) {
        throw new Error('没有可导出的历史数据');
      }
      
      // CSV头部
      const headers = ['日期', '体重(kg)', '身高(cm)', 'BMI', '收缩压(mmHg)', '舒张压(mmHg)', '心率(bpm)', '压力水平'];
      
      // 生成CSV行
      const rows = [
        headers.join(','), // 头部行
        ...historicalData.map(entry => this.formatCsvRow(entry)) // 数据行
      ];
      
      // 组合CSV内容
      const csvContent = rows.join('\n');
      
      // 创建下载
      this.downloadFile(
        csvContent,
        `health-data-${this.getFormattedDate()}.csv`,
        'text/csv;charset=utf-8;'
      );
    } catch (error) {
      console.error('导出CSV失败:', error);
      throw error;
    }
  }
  
  /**
   * 生成CSV数据行
   */
  private static formatCsvRow(entry: HealthData): string {
    const values = [
      this.escapeCsvField(entry.recordDate || '') ,
      (entry.weight || '').toString(),
      (entry.height || '').toString(),
      (entry.bmi || '').toString(),
      (entry.systolic || '').toString(),
      (entry.diastolic || '').toString(),
      (entry.heartRate || '').toString(),
      (entry.stressLevel || '').toString()
    ];
    
    return values.join(',');
  }
  
  /**
   * 转义CSV字段，处理包含逗号、引号或换行符的字段
   */
  private static escapeCsvField(field: string): string {
    if (typeof field !== 'string') {
      return field === undefined || field === null ? '' : String(field);
    }
    
    // 如果字段包含逗号、引号或换行符，需要用引号包围并转义内部的引号
    if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    
    return field;
  }
  
  /**
   * 下载文件
   */
  private static downloadFile(content: string, filename: string, contentType: string): void {
    // 创建Blob对象
    const blob = new Blob([content], { type: contentType });
    
    // 创建下载链接
    const link = document.createElement('a');
    
    // 创建URL
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // 添加到文档并触发点击
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * 获取格式化的日期字符串，用于文件名
   */
  private static getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}-${hours}${minutes}`;
  }
  
  /**
   * 验证是否有可导出的数据
   */
  static hasDataToExport(): boolean {
    try {
      const currentData = HealthStorageService.getCurrentHealthData();
      const historicalData = HealthStorageService.getHistoricalData();
      
      return !!(currentData || (historicalData && historicalData.length > 0));
    } catch (error) {
      console.error('检查导出数据失败:', error);
      return false;
    }
  }
}