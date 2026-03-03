// 数据库连接测试脚本
import sql from './postgresService.js';

/**
 * 测试数据库连接
 * 执行一个简单的查询来验证连接是否正常工作
 */
async function testDatabaseConnection() {
  console.log('开始测试数据库连接...');
  
  try {
    // 执行一个简单的查询，返回当前时间
    const result = await sql`SELECT NOW() as current_time, version() as postgres_version`;
    
    console.log('数据库连接成功！');
    console.log('当前时间:', result[0].current_time);
    console.log('PostgreSQL版本:', result[0].postgres_version);
    
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    
    // 提供更多的错误诊断信息
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
      console.error('错误类型:', error.name);
    }
    
    return false;
  } finally {
    // 关闭连接
    await sql.end();
    console.log('数据库连接已关闭');
  }
}

// 运行测试
if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}

// 导出测试函数供其他模块使用
export { testDatabaseConnection };