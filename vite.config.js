import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      // import.meta.url 是当前文件的路径
      // fileURLToPath 将文件 URL 转换为路径字符串
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
