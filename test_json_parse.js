
const fs = require('fs');

// 模拟 BaseAgent 的解析逻辑
function parseJSON(response) {
  try {
    // 1. 提取 JSON 块
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/```\n([\s\S]*?)\n```/);
    
    let jsonStr = jsonMatch ? jsonMatch[1] : response;
    
    // 2. 清理首尾空白
    jsonStr = jsonStr.trim();
    
    // 3. 截取有效 JSON 区间 ([...])
    const firstBracket = jsonStr.indexOf('[');
    const firstBrace = jsonStr.indexOf('{');
    
    if (firstBracket !== -1 || firstBrace !== -1) {
      const start = (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) 
        ? firstBracket 
        : firstBrace;
        
      const endChar = jsonStr[start] === '[' ? ']' : '}';
      const lastIndex = jsonStr.lastIndexOf(endChar);
      
      if (lastIndex !== -1 && lastIndex > start) {
        jsonStr = jsonStr.substring(start, lastIndex + 1);
      }
    }

    // 4. 正则修复逻辑（这是我们要测试的核心）
    console.log('--- Before Regex Fix ---');
    console.log(jsonStr);
    
    // Fix 1: Remove trailing commas
    jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
    
    // Fix 2: Unescaped newlines in strings
    // 这里的正则可能误伤正常结构，重点测试
    jsonStr = jsonStr.replace(/([^\\])\n/g, '$1\\n');
    
    // Fix 3: Missing commas between objects (新增)
    jsonStr = jsonStr.replace(/}\s*{/g, '},{');

    console.log('--- After Regex Fix ---');
    console.log(jsonStr);

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('JSON Parse Error:', error.message);
    return null;
  }
}

// 模拟出错的 JSON 样本 (基于日志推断: Expected ',' or '}' after property value)
// 常见原因：
// 1. 字符串值中包含未转义的双引号
// 2. 字符串值跨行但未转义
// 3. 缺少逗号
const testCases = [
  // Case 1: 正常的
  `[{"title": "Test", "desc": "Good"}]`,
  
  // Case 2: 尾随逗号
  `[{"title": "Test",},]`,
  
  // Case 3: 字符串中有换行 (导致 SyntaxError)
  `[{"title": "Test", "desc": "Line 1
Line 2"}]`,

  // Case 4: 缺少逗号
  `[{"a":1} {"b":2}]`,
  
  // Case 5: 属性值中包含未转义双引号 (这是最难搞的)
  `[{"title": "Chicken "Style" Soup"}]`
];

testCases.forEach((input, index) => {
  console.log(`\n=== Test Case ${index + 1} ===`);
  const result = parseJSON(input);
  console.log('Result:', result ? 'SUCCESS' : 'FAILED');
});
