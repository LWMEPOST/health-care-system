// DeepSeek API服务集成

interface DeepSeekRequest {
  model: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  max_tokens?: number
  top_p?: number
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class DeepSeekService {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
    // 确保 URL 包含 /chat/completions 路径
    let baseUrl = import.meta.env.VITE_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'
    if (!baseUrl.endsWith('/chat/completions')) {
      // 移除末尾斜杠（如果有）并追加路径
      baseUrl = baseUrl.replace(/\/$/, '') + '/chat/completions'
    }
    this.apiUrl = baseUrl
  }

  /**
   * 发送消息到DeepSeek API
   */
  async chatWithAI(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('DeepSeek API key is not configured')
    }

    const messages: Array<{
      role: 'system' | 'user' | 'assistant'
      content: string
    }> = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: prompt })

    const requestBody: DeepSeekRequest = {
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data: DeepSeekResponse = await response.json()
      
      return data.choices[0]?.message?.content || 'No response from AI'
    } catch (error) {
      console.error('DeepSeek API error:', error)
      throw error
    }
  }

  /**
   * 生成医疗建议
   */
  async generateMedicalAdvice(symptoms: string): Promise<string> {
    const systemPrompt = `你是一位专业的医疗顾问。请根据用户描述的症状，提供一般性的健康建议。请注意，你的回答仅供参考，不构成医疗诊断。如症状严重，请建议用户及时就医。`
    
    const prompt = `用户描述的症状：${symptoms}\n请提供适当的健康建议和可能需要注意的事项。`
    
    return this.chatWithAI(prompt, systemPrompt)
  }

  /**
   * 生成健康生活方式建议
   */
  async generateLifestyleAdvice(healthGoal: string): Promise<string> {
    const systemPrompt = `你是一位健康生活方式顾问。请根据用户的健康目标，提供科学、实用的生活方式建议，包括饮食、运动、休息等方面。`
    
    const prompt = `用户的健康目标：${healthGoal}\n请提供个性化的健康生活方式建议。`
    
    return this.chatWithAI(prompt, systemPrompt)
  }
}

export const deepSeekService = new DeepSeekService()