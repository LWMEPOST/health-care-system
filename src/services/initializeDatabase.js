// 数据库初始化脚本 - 创建健康数据表结构
require('dotenv').config();
const postgres = require('postgres');

async function initializeDatabase() {
  console.log('开始初始化数据库...');
  
  try {
    // 获取数据库连接字符串
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    console.log('连接到数据库:', connectionString);
    
    // 创建数据库连接
    const sql = postgres(connectionString);
    
    try {
      // 创建用户表
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          user_id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('用户表 (users) 创建成功');
      
      // 创建健康数据表 - 包含所有健康指标
      await sql`
        CREATE TABLE IF NOT EXISTS health_data (
          health_data_id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(user_id),
          
          -- 基础信息
          age INTEGER CHECK (age >= 0 AND age <= 120),
          gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
          height INTEGER CHECK (height >= 50 AND height <= 250),  -- 厘米
          weight NUMERIC(5,2) CHECK (weight >= 10 AND weight <= 300),  -- 公斤
          
          -- 健康指标
          systolic_pressure INTEGER CHECK (systolic_pressure >= 50 AND systolic_pressure <= 250),  -- 收缩压
          diastolic_pressure INTEGER CHECK (diastolic_pressure >= 30 AND diastolic_pressure <= 150),  -- 舒张压
          heart_rate INTEGER CHECK (heart_rate >= 40 AND heart_rate <= 200),  -- 心率
          stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
          
          -- 生活习惯
          exercise_frequency VARCHAR(50) CHECK (exercise_frequency IN ('daily', 'weekly', 'monthly', 'rarely', 'never')),
          sleep_hours NUMERIC(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),  -- 小时
          sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
          steps INTEGER,
          water_cups INTEGER,
          checkin_period VARCHAR(10),
          
          -- 饮食偏好（使用数组存储多选）
          flavor_preferences TEXT[],
          
          -- 记录元数据
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('健康数据表 (health_data) 创建成功');
      
      // 创建索引
      await sql`CREATE INDEX IF NOT EXISTS idx_health_data_user_id ON health_data(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_health_data_created_at ON health_data(created_at)`;
      console.log('索引创建成功');
      
      // 创建健康建议表
      await sql`
        CREATE TABLE IF NOT EXISTS health_recommendations (
          recommendation_id SERIAL PRIMARY KEY,
          health_data_id INTEGER REFERENCES health_data(health_data_id),
          recommendation_type VARCHAR(50),  -- 'diet', 'exercise', 'lifestyle', 'medical'
          content TEXT NOT NULL,
          priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('健康建议表 (health_recommendations) 创建成功');
      
      // 插入示例数据（可选）
      try {
        // 检查是否已有用户数据
        const existingUsers = await sql`SELECT COUNT(*) FROM users`;
        if (existingUsers[0].count === 0) {
          // 插入测试用户
          await sql`
            INSERT INTO users (email, password_hash) 
            VALUES ('test@example.com', '$2a$10$testpasswordhash')
          `;
          console.log('已插入测试用户数据');
          
          // 为测试用户插入示例健康数据
          await sql`
            INSERT INTO health_data (user_id, age, gender, height, weight, systolic_pressure, diastolic_pressure, heart_rate, exercise_frequency, sleep_hours, flavor_preferences)
            VALUES (
              1, 
              30, 
              'male', 
              175, 
              70.5, 
              120, 
              80, 
              72, 
              'weekly', 
              7.5, 
              ARRAY['spicy', 'sweet']
            )
          `;
          console.log('已插入示例健康数据');
        } else {
          console.log('用户表中已存在数据，跳过示例数据插入');
        }
      } catch (insertError) {
        console.warn('插入示例数据时出错（可能是因为表结构不匹配或其他原因）:', insertError.message);
      }
      
      console.log('\n数据库初始化成功完成！');
      console.log('创建的表结构:');
      console.log('1. users - 存储用户基本信息');
      console.log('2. health_data - 存储健康数据指标');
      console.log('3. health_recommendations - 存储健康建议');
      
      return true;
    } catch (sqlError) {
      console.error('数据库操作错误:', sqlError.message);
      return false;
    } finally {
      // 关闭数据库连接
      await sql.end();
      console.log('数据库连接已关闭');
    }
  } catch (error) {
    console.error('初始化数据库时发生错误:', error.message);
    return false;
  }
}

// 运行初始化
initializeDatabase().then(success => {
  console.log('\n初始化结果:', success ? '成功 ✓' : '失败 ✗');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('初始化过程中出现未捕获错误:', err);
  process.exit(1);
});
