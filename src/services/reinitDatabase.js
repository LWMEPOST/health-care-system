// 数据库初始化脚本 - 创建健康数据表结构
require('dotenv').config();
const postgres = require('postgres');

async function reinitDatabase() {
  console.log('开始重新初始化数据库...');
  
  try {
    // 获取数据库连接字符串
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    console.log('连接到数据库:', connectionString);
    
    // 创建数据库连接
    const sql = postgres(connectionString);
    
    try {
      // 1. 删除旧表（如果有）
      console.log('正在删除旧表...');
      await sql`DROP TABLE IF EXISTS health_recommendations CASCADE`;
      await sql`DROP TABLE IF EXISTS health_data CASCADE`;
      await sql`DROP TABLE IF EXISTS daily_checkins CASCADE`;
      await sql`DROP TABLE IF EXISTS chat_messages CASCADE`;
      await sql`DROP TABLE IF EXISTS users CASCADE`;
      
      // 2. 创建用户表 - 使用UUID作为主键，匹配Supabase Auth
      console.log('正在创建用户表 (users)...');
      await sql`
        CREATE TABLE users (
          id UUID PRIMARY KEY,  -- 对应 auth.users.id
          email VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255),
          display_name VARCHAR(255),
          avatar_url TEXT,
          metadata JSONB,       -- 存储额外的用户元数据
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP WITH TIME ZONE
        )
      `;
      
      // 3. 创建健康数据表 - 包含所有健康指标
      console.log('正在创建健康数据表 (health_data)...');
      await sql`
        CREATE TABLE health_data (
          health_data_id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          
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
          exercise_frequency VARCHAR(50),
          sleep_hours NUMERIC(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),  -- 小时
          sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
          steps INTEGER,
          water_cups INTEGER,
          checkin_period VARCHAR(10),
          
          -- 饮食偏好（使用数组存储多选）
          flavor_preferences TEXT[],
          
          -- 记录元数据
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      // 4. 创建索引
      console.log('正在创建索引...');
      await sql`CREATE INDEX idx_health_data_user_id ON health_data(user_id)`;
      await sql`CREATE INDEX idx_health_data_created_at ON health_data(created_at)`;
      
      // 5. 创建健康建议表
      console.log('正在创建健康建议表 (health_recommendations)...');
      await sql`
        CREATE TABLE health_recommendations (
          recommendation_id SERIAL PRIMARY KEY,
          health_data_id INTEGER REFERENCES health_data(health_data_id) ON DELETE CASCADE,
          recommendation_type VARCHAR(50),  -- 'diet', 'exercise', 'lifestyle', 'medical'
          content TEXT NOT NULL,
          priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 6. 创建每日打卡表
      console.log('正在创建每日打卡表 (daily_checkins)...');
      await sql`
        CREATE TABLE daily_checkins (
          checkin_id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          check_in_date DATE DEFAULT CURRENT_DATE,
          weight NUMERIC(5,2),
          sleep_hours NUMERIC(3,1),
          steps INTEGER,
          water_cups INTEGER,
          mood VARCHAR(50),
          energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
          systolic_pressure INTEGER,
          diastolic_pressure INTEGER,
          heart_rate INTEGER,
          stress_level INTEGER,
          checkin_period VARCHAR(10),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 7. 创建对话会话表
      console.log('正在创建对话会话表 (chat_sessions)...');
      await sql`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 8. 创建对话记录表
      console.log('正在创建对话记录表 (chat_messages)...');
      await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // 9. 启用 RLS (Row Level Security) 以允许前端访问
      console.log('正在为新表启用 RLS 并设置策略...');
      await sql`ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY`;
      await sql`ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY`;
      
      // 为 chat_sessions 设置策略
      await sql`DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions`;
      await sql`CREATE POLICY "Users can view their own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id)`;
      await sql`DROP POLICY IF EXISTS "Users can create their own chat sessions" ON chat_sessions`;
      await sql`CREATE POLICY "Users can create their own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id)`;
      await sql`DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions`;
      await sql`CREATE POLICY "Users can update their own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id)`;

      // 为 chat_messages 设置策略
      await sql`DROP POLICY IF EXISTS "Users can view their own chat messages" ON chat_messages`;
      await sql`CREATE POLICY "Users can view their own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id)`;
      await sql`DROP POLICY IF EXISTS "Users can insert their own chat messages" ON chat_messages`;
      await sql`CREATE POLICY "Users can insert their own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id)`;
      
      // 10. 创建 AI 分析记录表
      console.log('正在创建 AI 分析记录表 (ai_analyses)...');
      await sql`
        CREATE TABLE IF NOT EXISTS ai_analyses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          health_data_id INTEGER REFERENCES health_data(health_data_id) ON DELETE SET NULL,
          analysis_type VARCHAR(50), -- 'inspiration', 'general'
          content JSONB NOT NULL,    -- 存储结构化的分析结果
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('正在为 ai_analyses 启用 RLS 并设置策略...');
      await sql`ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY`;
      await sql`DROP POLICY IF EXISTS "Users can view their own AI analyses" ON ai_analyses`;
      await sql`CREATE POLICY "Users can view their own AI analyses" ON ai_analyses FOR SELECT USING (auth.uid() = user_id)`;
      await sql`DROP POLICY IF EXISTS "Users can insert their own AI analyses" ON ai_analyses`;
      await sql`CREATE POLICY "Users can insert their own AI analyses" ON ai_analyses FOR INSERT WITH CHECK (auth.uid() = user_id)`;

      console.log('正在创建 AI 食谱生成记录表 (ai_recipe_generations)...');
      await sql`
        CREATE TABLE IF NOT EXISTS ai_recipe_generations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          health_data_id INTEGER REFERENCES health_data(health_data_id) ON DELETE SET NULL,
          analysis_id UUID REFERENCES ai_analyses(id) ON DELETE SET NULL,
          goal_text TEXT NOT NULL,
          meal_type VARCHAR(20),
          count INTEGER,
          recipes JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('正在为 ai_recipe_generations 启用 RLS 并设置策略...');
      await sql`ALTER TABLE ai_recipe_generations ENABLE ROW LEVEL SECURITY`;
      await sql`DROP POLICY IF EXISTS "Users can view their own recipe generations" ON ai_recipe_generations`;
      await sql`CREATE POLICY "Users can view their own recipe generations" ON ai_recipe_generations FOR SELECT USING (auth.uid() = user_id)`;
      await sql`DROP POLICY IF EXISTS "Users can insert their own recipe generations" ON ai_recipe_generations`;
      await sql`CREATE POLICY "Users can insert their own recipe generations" ON ai_recipe_generations FOR INSERT WITH CHECK (auth.uid() = user_id)`;

      console.log('\n数据库重新初始化成功！');
      console.log('表结构已更新：增加了 daily_checkins, chat_sessions, chat_messages 和 ai_analyses 表。');
      
      return true;
    } catch (sqlError) {
      console.error('数据库操作错误:', sqlError.message);
      console.error(sqlError);
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
reinitDatabase().then(success => {
  console.log('\n初始化结果:', success ? '成功 ✓' : '失败 ✗');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('初始化过程中出现未捕获错误:', err);
  process.exit(1);
});
