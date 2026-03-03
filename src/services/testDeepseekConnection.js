// DeepSeek API连接测试脚本
require('dotenv').config();

async function testDeepseekConnection() {
  console.log('开始测试DeepSeek API连接...');
  
  // 从环境变量获取API配置
  const apiKey = process.env.VITE_DEEPSEEK_API_KEY || '';
  const apiUrl = (process.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1') + '/chat/completions';
  
  console.log('API密钥配置检查:', apiKey ? '已配置' : '未配置');
  console.log('API URL:', apiUrl);
  
  if (!apiKey) {
    console.error('错误: DeepSeek API密钥未配置');
    return false;
  }
  
  try {
    // 准备测试请求
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个测试助手。' },
        { role: 'user', content: '请返回"连接测试成功"作为响应。' }
      ],
      temperature: 0,
      max_tokens: 100
    };
    
    console.log('发送API请求...');
    
    // 发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('请求状态码:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('API请求失败:', errorData);
      return false;
    }
    
    const data = await response.json();
    console.log('API响应成功!');
    console.log('响应内容:', data.choices[0]?.message?.content);
    console.log('使用的token数量:', data.usage?.total_tokens);
    
    return true;
  } catch (error) {
    console.error('连接测试失败:', error.message);
    return false;
  }
}

// 运行测试
testDeepseekConnection().then(success => {
  console.log('\n测试结果:', success ? '连接成功 ✓' : '连接失败 ✗');
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('测试过程中出现错误:', err);
  process.exit(1);
});