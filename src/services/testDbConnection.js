// 数据库连接测试脚本 - JavaScript版本
const { readFileSync } = require('fs');
const path = require('path');

// 读取环境变量
require('dotenv').config();

// 动态导入postgres模块
async function testConnection() {
  console.log('开始测试数据库连接...');
  
  try {
    // 导入postgres模块
    const postgres = (await import('postgres')).default;
    
    // 获取连接字符串
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL环境变量未设置');
    }
    
    console.log('使用连接字符串:', connectionString);
    
    // 创建连接
    const sql = postgres(connectionString);
    
    // 执行简单查询
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    console.log('数据库连接成功！');
    console.log('当前时间:', result[0].current_time);
    console.log('PostgreSQL版本:', result[0].postgres_version);
    
    // 关闭连接
    await sql.end();
    console.log('数据库连接已关闭');
    
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error.message || error);
    return false;
  }
}

// 运行测试
testConnection().catch(err => {
  console.error('测试运行失败:', err);
  process.exit(1);
});