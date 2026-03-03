// 添加测试用户数据脚本
require('dotenv').config();
const postgres = require('postgres');

async function addTestUser() {
  console.log('开始添加测试用户数据...');
  
  try {
    // 获取数据库连接字符串
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    console.log('连接到数据库:', connectionString);
    
    // 创建数据库连接
    const sql = postgres(connectionString);
    
    try {
      // 由于使用Supabase认证，我们需要添加用户到Supabase的auth.users表
      // 但由于我们在直接操作数据库，我们需要创建一个兼容的密码哈希
      // 注意：在实际生产环境中，应该使用Supabase的API来创建用户
      
      // 检查用户是否已存在
      const existingUser = await sql`
        SELECT * FROM users WHERE email = 'test@example.com'
      `;
      
      if (existingUser.length > 0) {
        console.log('测试用户已存在，更新密码哈希...');
        // 更新现有用户的密码哈希
        await sql`
          UPDATE users 
          SET password_hash = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'
          WHERE email = 'test@example.com'
        `;
        console.log('用户密码已更新');
      } else {
        // 创建新的测试用户
        console.log('创建新的测试用户...');
        await sql`
          INSERT INTO users (email, password_hash)
          VALUES ('test@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW')
        `;
        console.log('测试用户创建成功');
      }
      
      // 同时，为了兼容Supabase认证系统，我们也需要在auth.users表中添加用户
      // 检查auth.users表中是否已有该用户
      const authUserExists = await sql`
        SELECT * FROM auth.users WHERE email = 'test@example.com'
      `;
      
      if (authUserExists.length === 0) {
        console.log('在Supabase认证系统中创建用户...');
        
        try {
          // 尝试在auth.users表中创建用户
          // 注意：直接操作auth.users表可能需要适当的权限
          await sql`
            INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, encrypted_password, recovery_sent_at, confirmation_token, email_change_token_new, recovery_token)
            VALUES (
              gen_random_uuid(),
              'test@example.com',
              NOW(),
              NOW(),
              NOW(),
              NOW(),
              '{"provider": "email", "providers": ["email"]}'::jsonb,
              '{"email": "test@example.com", "name": "Test User"}'::jsonb,
              false,
              '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
              NULL,
              NULL,
              NULL,
              NULL
            )
          `;
          console.log('Supabase认证用户创建成功');
        } catch (authError) {
          console.warn('在auth.users表中创建用户时出错（可能是权限问题）:', authError.message);
          console.log('提示：您可能需要通过Supabase控制台或API创建用户');
        }
      } else {
        console.log('Supabase认证用户已存在');
      }
      
      // 为测试用户添加健康数据
      const user = await sql`SELECT user_id FROM users WHERE email = 'test@example.com'`;
      if (user.length > 0) {
        const userId = user[0].user_id;
        
        // 检查是否已有健康数据
        const existingHealthData = await sql`
          SELECT * FROM health_data WHERE user_id = ${userId}
        `;
        
        if (existingHealthData.length === 0) {
          console.log('添加测试健康数据...');
          await sql`
            INSERT INTO health_data (
              user_id, age, gender, height, weight, 
              systolic_pressure, diastolic_pressure, heart_rate, 
              exercise_frequency, sleep_hours, flavor_preferences
            ) VALUES (
              ${userId}, 35, 'female', 165, 58.5,
              118, 75, 68,
              'weekly', 8.0, ARRAY['sweet', 'sour']
            )
          `;
          console.log('测试健康数据添加成功');
        } else {
          console.log('用户已有健康数据，跳过添加');
        }
      }
      
      console.log('\n测试用户数据添加成功！');
      console.log('---------------------------------------');
      console.log('登录信息：');
      console.log('邮箱: test@example.com');
      console.log('密码: password123');  // 对应上面的bcrypt哈希
      console.log('---------------------------------------');
      
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
    console.error('添加测试用户时发生错误:', error.message);
    return false;
  }
}

// 运行脚本
addTestUser().then(success => {
  console.log('\n添加测试用户结果:', success ? '成功 ✓' : '失败 ✗');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('执行过程中出现未捕获错误:', err);
  process.exit(1);
});