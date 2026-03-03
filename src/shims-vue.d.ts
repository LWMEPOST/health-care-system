/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Pinia 模块声明
declare module 'pinia' {
  export * from 'pinia/dist/pinia'
}

// Element Plus 模块声明
declare module 'element-plus' {
  export * from 'element-plus/dist/index'
}

declare module 'element-plus/dist/index.css' {}

// Supabase 模块声明
declare module '@supabase/supabase-js' {
  export * from '@supabase/supabase-js/dist/module'
}