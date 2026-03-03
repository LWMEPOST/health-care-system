// PostgreSQL数据库使用示例
import sql from './postgresService';

/**
 * 数据库查询示例
 * 展示如何使用postgres连接执行基本查询
 */
export const dbExample = {
  /**
   * 测试数据库连接
   */
  async testConnection() {
    try {
      console.log('正在测试PostgreSQL连接...');
      
      // 执行简单查询测试连接
      const result = await sql`SELECT 1 AS connected`;
      console.log('连接成功:', result);
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      return false;
    }
  },

  /**
   * 查询示例 - 获取用户列表
   */
  async getUsers() {
    try {
      // 使用postgres的模板字符串语法执行查询
      const users = await sql`
        SELECT id, username, email 
        FROM users 
        LIMIT 10
      `;
      return users;
    } catch (error) {
      console.error('查询用户失败:', error);
      return [];
    }
  },

  /**
   * 插入示例 - 创建新用户
   */
  async createUser(username: string, email: string) {
    try {
      // 参数化查询，防止SQL注入
      const newUser = await sql`
        INSERT INTO users (username, email, created_at)
        VALUES (${username}, ${email}, NOW())
        RETURNING *
      `;
      return newUser[0]; // 返回插入的用户记录
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    }
  }
};

/**
 * 使用说明：
 * 1. 导入sql实例：import sql from './postgresService';
 * 2. 使用模板字符串语法编写SQL：sql`SELECT * FROM table WHERE id = ${id}`
 * 3. 参数自动转义，防止SQL注入
 * 4. 查询结果自动转换为JavaScript对象
 */