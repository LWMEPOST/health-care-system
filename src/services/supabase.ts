import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js'

// 环境变量配置，针对本地Docker部署的Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54323'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// 定义通用响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 定义用户元数据接口
export interface UserMetadata {
  name?: string
  avatar_url?: string
  role?: 'user' | 'admin'
  preferences?: Record<string, any>
}

// 增强的用户类型
export interface EnhancedUser extends User {
  user_metadata: UserMetadata
}

// 缓存配置
  const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5分钟

  // 缓存接口
  export interface CacheItem<T = any> {
    data: T
    timestamp: number
    expiry: number
  }

  // 缓存管理器类
  class CacheManager {
    private cache: Map<string, CacheItem> = new Map()
    private defaultTTL = DEFAULT_CACHE_TTL // 默认缓存5分钟

    set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl
      })
    }

    get<T>(key: string): T | null {
      const item = this.cache.get(key)
      if (!item) return null

      // 检查是否过期
      if (Date.now() > item.expiry) {
        this.cache.delete(key)
        return null
      }

      return item.data as T
    }

    delete(key: string): void {
      this.cache.delete(key)
    }

    clear(): void {
      this.cache.clear()
    }

    // 获取所有缓存键
    getAllKeys(): string[] {
      return Array.from(this.cache.keys())
    }
  }

// 创建缓存管理器实例
const cache = new CacheManager()

// 开发环境调试工具
class SupabaseDebugger {
  private isEnabled = import.meta.env.DEV

  log(message: string, data?: any): void {
    if (this.isEnabled) {
      console.log(`[Supabase] ${message}`, data || '')
    }
  }

  error(message: string, error?: any): void {
    if (this.isEnabled) {
      console.error(`[Supabase] ERROR: ${message}`, error || '')
    }
  }

  warn(message: string, data?: any): void {
    if (this.isEnabled) {
      console.warn(`[Supabase] WARNING: ${message}`, data || '')
    }
  }
}

// 创建调试实例
const debuggerInstance = new SupabaseDebugger()

// 创建Supabase客户端实例
  const createSupabaseClient = (): SupabaseClient => {
    try {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          // 配置针对本地Docker环境的认证设置
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })

      // 开发环境下添加请求日志
      if (import.meta.env.DEV) {
        // 使用自定义fetch包装器进行日志记录
        const originalFetch = globalThis.fetch
        globalThis.fetch = async (url, options) => {
          if (typeof url === 'string' && url.includes(SUPABASE_URL)) {
            debuggerInstance.log(`Supabase请求: ${url}`)
          }
          return originalFetch(url, options)
        }
      }

      return client
    } catch (error) {
      debuggerInstance.error('Supabase客户端初始化失败:', error)
      throw new Error('无法初始化Supabase客户端，请检查配置和网络连接')
    }
  }

// 导出Supabase客户端
export const supabase = createSupabaseClient()

// 认证服务
  export class AuthService {
    constructor() {}

    // 获取认证客户端
    private get authClient() {
      return supabase.auth
    }

  /**
   * 用户登录
   * @param email 用户邮箱
   * @param password 用户密码
   */
  async login(email: string, password: string): Promise<ApiResponse<{ user: EnhancedUser; session: Session }>> {
    try {
      const { data, error } = await this.authClient.signInWithPassword({
        email,
        password
      })

      if (error) {
        debuggerInstance.error('登录失败:', error)
        return {
          success: false,
          error: error.message,
          message: '登录失败，请检查邮箱和密码'
        }
      }

      if (data.user && data.session) {
        debuggerInstance.log('登录成功:', { userId: data.user.id })
        
        try {
            // 检查应用数据库中是否存在该用户记录
            const { data: existingUser, error: fetchError } = await supabase.from('users')
              .select('*')
              .eq('email', data.user.email)
              .single()
            
            if (fetchError || !existingUser) {
              // 如果用户记录不存在，创建一个新的记录
              debuggerInstance.log('在应用数据库中未找到用户记录，尝试创建...')
              const { error: createError } = await supabase.from('users')
                .insert({
                  email: data.user.email,
                  username: data.user.user_metadata?.name || email.split('@')[0],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .single()
              
              if (createError) {
                debuggerInstance.warn('登录时创建用户记录失败:', createError)
                console.warn('用户已登录，但未能在应用数据库中创建对应记录:', createError)
              } else {
                debuggerInstance.log('登录时成功在应用数据库中创建用户记录')
              }
            } else {
              // 如果记录存在，更新last_login时间
              await supabase.from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('email', data.user.email)
            }
          } catch (dbError) {
            debuggerInstance.warn('登录时同步用户数据到应用数据库发生异常:', dbError)
            console.warn('用户已登录，但数据同步失败:', dbError)
          }
      }

      return {
        success: true,
        data: { user: data.user as EnhancedUser, session: data.session || undefined },
        message: '登录成功'
      }
    } catch (error) {
      debuggerInstance.error('登录过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '登录过程中发生异常'
      }
    }
  }

  /**
   * 用户注册
   * @param email 用户邮箱
   * @param password 用户密码
   * @param userData 用户额外数据
   */
  async register(
    email: string,
    password: string,
    userData: UserMetadata = {}
  ): Promise<ApiResponse<{ user: EnhancedUser; session?: Session }>> {
    try {
      // 第一步：在Supabase认证系统中注册用户
      const { data, error } = await this.authClient.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })

      if (error) {
        debuggerInstance.error('注册失败:', error)
        return {
          success: false,
          error: error.message,
          message: '注册失败，请稍后重试'
        }
      }

      if (data.user) {
        debuggerInstance.log('注册成功，用户ID:', data.user.id)
        
        try {
          // 第二步：在应用的users表中创建对应的用户记录
          // 这解决了Authentication中的用户不会同步到Table Editor中users表的问题
          const { error: dbError } = await supabase.from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              username: userData.name || email.split('@')[0],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .single()
          
          if (dbError) {
            // 如果数据库操作失败，记录警告但不阻止注册成功
            debuggerInstance.warn('在users表中创建用户记录失败:', dbError)
            console.warn('用户已在认证系统中创建，但未能在应用数据库中创建对应记录:', dbError)
          } else {
            debuggerInstance.log('成功在应用数据库中创建用户记录')
          }
        } catch (dbError) {
          // 捕获并记录任何数据库操作异常
          debuggerInstance.warn('同步用户数据到应用数据库时发生异常:', dbError)
          console.warn('用户数据同步失败，但认证已完成:', dbError)
        }
      }

      return {
        success: true,
        data: { user: data.user as EnhancedUser, session: data.session || undefined },
        message: '注册成功，请查收邮箱验证邮件'
      }
    } catch (error) {
      debuggerInstance.error('注册过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '注册过程中发生异常'
      }
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.authClient.signOut()

      if (error) {
        debuggerInstance.error('登出失败:', error)
        return {
          success: false,
          error: error.message,
          message: '登出失败'
        }
      }

      // 清理缓存
      cache.clear()
      debuggerInstance.log('登出成功')
      return {
        success: true,
        message: '登出成功'
      }
    } catch (error) {
      debuggerInstance.error('登出过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '登出过程中发生异常'
      }
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<EnhancedUser>> {
    try {
      const cacheKey = 'current_user'
      // 尝试从缓存获取
      const cachedUser = cache.get<EnhancedUser>(cacheKey)
      if (cachedUser) {
        return {
          success: true,
          data: cachedUser,
          message: '从缓存获取用户信息'
        }
      }

      const { data, error } = await this.authClient.getUser()

      if (error) {
        debuggerInstance.error('获取用户信息失败:', error)
        return {
          success: false,
          error: error.message,
          message: '获取用户信息失败'
        }
      }

      if (!data.user) {
        return {
          success: false,
          message: '未登录或会话已过期'
        }
      }

      // 缓存用户信息
      cache.set(cacheKey, data.user as EnhancedUser, 60 * 1000) // 缓存1分钟
      debuggerInstance.log('获取用户信息成功:', { userId: data.user.id })
      return {
        success: true,
        data: data.user as EnhancedUser,
        message: '获取用户信息成功'
      }
    } catch (error) {
      debuggerInstance.error('获取用户信息过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '获取用户信息过程中发生异常'
      }
    }
  }

  /**
   * 更新用户信息
   * @param userData 要更新的用户数据
   */
  async updateUser(userData: Partial<UserMetadata>): Promise<ApiResponse<EnhancedUser>> {
    try {
      const { data, error } = await this.authClient.updateUser({
        data: userData
      })

      if (error) {
        debuggerInstance.error('更新用户信息失败:', error)
        return {
          success: false,
          error: error.message,
          message: '更新用户信息失败'
        }
      }

      // 清除用户缓存
      cache.delete('current_user')
      debuggerInstance.log('更新用户信息成功:', { userId: data.user.id })
      return {
        success: true,
        data: data.user as EnhancedUser,
        message: '更新用户信息成功'
      }
    } catch (error) {
      debuggerInstance.error('更新用户信息过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '更新用户信息过程中发生异常'
      }
    }
  }

  /**
   * 订阅认证状态变化
   * @param callback 状态变化回调函数
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.authClient.onAuthStateChange(callback)
  }
}

// 数据库服务
export class DatabaseService<T extends Record<string, any> = any> {
  /**
   * 获取数据列表
   * @param table 表名
   * @param options 查询选项
   */
  async findAll(
    table: string,
    options: {
      select?: string
      filters?: Record<string, any>
      orderBy?: string
      ascending?: boolean
      limit?: number
      offset?: number
      useCache?: boolean
      cacheTTL?: number
    } = {}
  ): Promise<ApiResponse<T[]>> {
    try {
      const { select = '*', filters = {}, orderBy, ascending = true, limit, offset, useCache = true, cacheTTL } = options
        
      // 生成缓存键
      const cacheKey = `${table}_findAll_${select}_${JSON.stringify(filters)}_${orderBy || ''}_${ascending}_${limit || ''}_${offset || ''}`
      
      // 尝试从缓存获取
        if (useCache) {
          const cachedData = cache.get<T[]>(cacheKey)
          if (cachedData) {
          return {
            success: true,
            data: cachedData,
            message: '从缓存获取数据'
          }
        }
      }

      let query = supabase.from(table).select(select)
      
      // 应用过滤条件
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (value === null || value === undefined) {
          query = query.is(key, null)
        } else {
          query = query.eq(key, value)
        }
      })

      // 排序
      if (orderBy) {
        query = query.order(orderBy, { ascending })
      }

      // 分页
      if (limit) query = query.limit(limit)
      if (offset && offset > 0) query = query.range(offset, offset + (limit || 100) - 1)

      const { data, error } = await query
      
      if (error) {
        debuggerInstance.error('获取数据列表失败:', error)
        return {
          success: false,
          error: error.message,
          message: '获取数据列表失败'
        }
      }

      // 缓存数据
        if (useCache) {
          cache.set(cacheKey, data as unknown as T[], cacheTTL)
      }

      debuggerInstance.log(`获取${table}数据列表成功`, { count: data.length })
      return {
        success: true,
        data: data as unknown as T[],
        message: '获取数据列表成功'
      }
    } catch (error) {
      debuggerInstance.error('获取数据列表过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '获取数据列表过程中发生异常'
      }
    }
  }

  /**
   * 根据ID获取单条数据
   * @param table 表名
   * @param id 记录ID
   * @param select 要选择的字段
   */
  async findById(table: string, id: string | number, select: string = '*', useCache: boolean = true): Promise<ApiResponse<T>> {
    try {
      const cacheKey = `${table}_findById_${id}_${select}`
      
      // 尝试从缓存获取
        if (useCache) {
          const cachedData = cache.get<T>(cacheKey)
          if (cachedData) {
          return {
            success: true,
            data: cachedData,
            message: '从缓存获取数据'
          }
        }
      }

      const { data, error } = await supabase
        .from(table)
        .select(select)
        .eq('id', id)
        .single()

      if (error) {
        debuggerInstance.error(`获取${table}单条数据失败:`, error)
        return {
          success: false,
          error: error.message,
          message: '获取数据失败'
        }
      }

      // 缓存数据
        if (useCache) {
          cache.set(cacheKey, data as unknown as T)
      }
      
      debuggerInstance.log(`获取${table}单条数据成功:`, { id })
      return {
        success: true,
        data: data as unknown as T,
        message: '获取数据成功'
      }
    } catch (error) {
      debuggerInstance.error(`获取${table}单条数据过程异常:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '获取数据过程中发生异常'
      }
    }
  }

  /**
   * 创建数据
   * @param table 表名
   * @param data 要创建的数据
   */
  async create(table: string, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()

      if (error) {
        debuggerInstance.error(`创建${table}数据失败:`, error)
        return {
          success: false,
          error: error.message,
          message: '创建数据失败'
        }
      }

      // 清除相关缓存
      this.clearTableCache(table)
      
      debuggerInstance.log(`创建${table}数据成功:`, { id: result?.id })
      return {
        success: true,
        data: result as unknown as T,
        message: '创建数据成功'
      }
    } catch (error) {
      debuggerInstance.error(`创建${table}数据过程异常:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '创建数据过程中发生异常'
      }
    }
  }

  /**
   * 更新数据
   * @param table 表名
   * @param id 记录ID
   * @param data 要更新的数据
   */
  async update(table: string, id: string | number, data: Partial<T>): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        debuggerInstance.error(`更新${table}数据失败:`, error)
        return {
          success: false,
          error: error.message,
          message: '更新数据失败'
        }
      }

      // 清除相关缓存
      this.clearTableCache(table)
      
      debuggerInstance.log(`更新${table}数据成功:`, { id })
      return {
        success: true,
        data: result as unknown as T,
        message: '更新数据成功'
      }
    } catch (error) {
      debuggerInstance.error(`更新${table}数据过程异常:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '更新数据过程中发生异常'
      }
    }
  }

  /**
   * 删除数据
   * @param table 表名
   * @param id 记录ID
   */
  async delete(table: string, id: string | number): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

      if (error) {
        debuggerInstance.error(`删除${table}数据失败:`, error)
        return {
          success: false,
          error: error.message,
          message: '删除数据失败'
        }
      }

      // 清除相关缓存
      this.clearTableCache(table)
      
      debuggerInstance.log(`删除${table}数据成功:`, { id })
      return {
        success: true,
        message: '删除数据成功'
      }
    } catch (error) {
      debuggerInstance.error(`删除${table}数据过程异常:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '删除数据过程中发生异常'
      }
    }
  }

  /**
   * 清除表相关缓存
   * @param table 表名
   */
  private clearTableCache(table: string): void {
    // 遍历缓存，删除与表相关的所有缓存项
    for (const key of cache.getAllKeys()) {
      if (key.startsWith(`${table}_`)) {
        cache.delete(key)
      }
    }
  }
}

// 实时订阅服务
export class RealtimeService {
  /**
   * 订阅表数据变化
   * @param table 表名
   * @param callback 回调函数
   * @param filter 过滤条件
   */
  subscribe<T>(
    table: string,
    callback: (event: string, data: T) => void,
    filter?: {
      column: string
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
      value: any
    }
  ) {
    let subscription = supabase
      .channel(`public:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter ? `${filter.column}=${filter.operator}.${filter.value}` : undefined
        },
        (payload) => {
          debuggerInstance.log(`实时更新: ${table}`, payload)
          callback(payload.eventType, payload.new as T)
        }
      )
      .subscribe((status) => {
        debuggerInstance.log(`实时订阅状态: ${table}`, status)
      })

    return {
      subscription,
      unsubscribe: () => {
        supabase.removeChannel(subscription)
        debuggerInstance.log(`取消实时订阅: ${table}`)
      }
    }
  }

  /**
   * 订阅特定记录变化
   * @param table 表名
   * @param id 记录ID
   * @param callback 回调函数
   */
  subscribeById<T>(table: string, id: string | number, callback: (event: string, data: T) => void) {
    return this.subscribe(table, callback, {
      column: 'id',
      operator: 'eq',
      value: id
    })
  }
}

// 存储服务
export class StorageService {
  /**
   * 上传文件
   * @param bucket 存储桶
   * @param path 文件路径
   * @param file 文件对象
   * @param options 上传选项
   */
  async upload(
    bucket: string,
    path: string,
    file: File,
    options: {
      cacheControl?: string
      upsert?: boolean
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<ApiResponse<{ path: string; url: string }>> {
    try {
      const { cacheControl = '3600', upsert = false } = options
      
      let uploadOptions: any = {
        cacheControl,
        upsert
      }

      // 添加进度回调
      if (options.onProgress) {
        uploadOptions.onUploadProgress = (event: ProgressEvent) => {
          if (event.total && options.onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100)
            options.onProgress(progress)
          }
        }
      }

      const { data, error } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, uploadOptions)

      if (error) {
        debuggerInstance.error('文件上传失败:', error)
        return {
          success: false,
          error: error.message,
          message: '文件上传失败'
        }
      }

      // 获取文件URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      debuggerInstance.log('文件上传成功:', { path: data.path })
      return {
        success: true,
        data: {
          path: data.path,
          url: publicUrl
        },
        message: '文件上传成功'
      }
    } catch (error) {
      debuggerInstance.error('文件上传过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '文件上传过程中发生异常'
      }
    }
  }

  /**
   * 获取文件URL
   * @param bucket 存储桶
   * @param path 文件路径
   * @param download 是否返回下载URL
   */
  getUrl(bucket: string, path: string, download: boolean = false): string {
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      if (download) {
        // 添加下载参数
        const separator = publicUrl.includes('?') ? '&' : '?'
        return `${publicUrl}${separator}download=1`
      }

      return publicUrl
    } catch (error) {
      debuggerInstance.error('获取文件URL失败:', error)
      throw error
    }
  }

  /**
   * 删除文件
   * @param bucket 存储桶
   * @param path 文件路径
   */
  async delete(bucket: string, path: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .storage
        .from(bucket)
        .remove([path])

      if (error) {
        debuggerInstance.error('文件删除失败:', error)
        return {
          success: false,
          error: error.message,
          message: '文件删除失败'
        }
      }

      debuggerInstance.log('文件删除成功:', { path })
      return {
        success: true,
        message: '文件删除成功'
      }
    } catch (error) {
      debuggerInstance.error('文件删除过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '文件删除过程中发生异常'
      }
    }
  }

  /**
   * 列出存储桶中的文件
   * @param bucket 存储桶
   * @param prefix 前缀路径
   */
  async list(bucket: string, prefix: string = ''): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(prefix)

      if (error) {
        debuggerInstance.error('列出文件失败:', error)
        return {
          success: false,
          error: error.message,
          message: '列出文件失败'
        }
      }

      debuggerInstance.log(`列出${bucket}文件成功`, { count: data.length })
      return {
        success: true,
        data,
        message: '列出文件成功'
      }
    } catch (error) {
      debuggerInstance.error('列出文件过程异常:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        message: '列出文件过程中发生异常'
      }
    }
  }
}

// 数据验证工具
export class ValidationService {
  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 验证密码强度
   * @param password 密码
   */
  isStrongPassword(password: string): boolean {
    // 至少8位，包含大小写字母和数字
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return passwordRegex.test(password)
  }

  /**
   * 验证对象是否为空
   * @param obj 要验证的对象
   */
  isEmptyObject(obj: Record<string, any>): boolean {
    return Object.keys(obj).length === 0 && obj.constructor === Object
  }

  /**
   * 验证值是否在指定范围内
   * @param value 值
   * @param min 最小值
   * @param max 最大值
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max
  }
}

// 创建服务实例
export const auth = new AuthService()
export const db = new DatabaseService()
export const realtime = new RealtimeService()
export const storage = new StorageService()
export const validation = new ValidationService()

// 导出缓存和调试工具（仅在开发环境）
export const utils = {
  cache,
  debugger: debuggerInstance
}

// 导出完整的Supabase服务
export default {
  client: supabase,
  auth,
  db,
  realtime,
  storage,
  validation,
  utils
}