// PostgreSQL数据库连接服务 - 遵循Supabase标准格式
import postgres from 'postgres';

// 获取数据库连接字符串，确保不为undefined
const connectionString = process.env.DATABASE_URL || '';

// 检查连接字符串是否为空
if (!connectionString) {
  console.error('数据库连接字符串未配置，请在.env文件中设置DATABASE_URL');
}

// 创建数据库连接实例
const sql = postgres(connectionString);

// 导出数据库连接实例
export default sql;