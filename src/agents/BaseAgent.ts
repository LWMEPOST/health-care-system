import { DeepSeekService } from '../services/deepseek';

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

export abstract class BaseAgent {
  protected deepseek: DeepSeekService;
  protected name: string;
  protected systemPrompt: string;

  constructor(name: string, systemPrompt: string) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.deepseek = new DeepSeekService();
  }

  /**
   * Process a user query or input
   */
  abstract process(input: any): Promise<AgentResponse>;

  /**
   * Send a prompt to the LLM
   */
  protected async callLLM(prompt: string, context?: string): Promise<string> {
    try {
      const fullSystemPrompt = context 
        ? `${this.systemPrompt}\n\nContext:\n${context}`
        : this.systemPrompt;
      
      return await this.deepseek.chatWithAI(prompt, fullSystemPrompt);
    } catch (error) {
      console.error(`[${this.name}] LLM Call Error:`, error);
      throw error;
    }
  }

  /**
   * Parse JSON from LLM response
   */
  protected parseJSON<T>(response: string): T | null {
    try {
      // Attempt to extract JSON if wrapped in markdown code blocks
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/);
      
      let jsonStr = jsonMatch ? jsonMatch[1] : response;
      
      // Remove any leading/trailing whitespace or non-JSON characters
      jsonStr = jsonStr.trim();
      
      // If it starts with [ or { but has extra text before/after, try to extract just the JSON part
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

      // Fix common JSON syntax errors
      // 1. Remove trailing commas before closing braces/brackets
      jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');
      // 2. Fix missing commas between objects (e.g. }{ -> }, {)
      jsonStr = jsonStr.replace(/}\s*{/g, '},{');
      // 3. Try to fix truncated JSON arrays
      if (jsonStr.startsWith('[') && !jsonStr.endsWith(']')) {
        // Remove trailing comma if present
        jsonStr = jsonStr.replace(/,(\s*)$/, '$1');
        
        // If it ends with }, add ]
        if (jsonStr.trim().endsWith('}')) {
          jsonStr += ']';
        } 
        // If it ends inside an object (unclosed brace), we might need to close it first
        // This is a heuristic guess
        else if (!jsonStr.trim().endsWith('}')) {
           // If we are deep in truncation, better to just wrap what we have if possible or fail gracefully
           // But let's try to add } and ]
           jsonStr += '}]';
        }
      }
      
      return JSON.parse(jsonStr) as T;
    } catch (error) {
      console.error(`[${this.name}] JSON Parse Error:`, error);
      console.log('Raw Response:', response);
      return null;
    }
  }
}
