import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSvgIconsPlugin } from "vite-plugin-svg-icons";
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  base:'./',
  plugins: [
    vue(),
    createSvgIconsPlugin({
      // 指定目录(svg存放目录）
      iconDirs: [path.resolve(process.cwd(), "src/assets/svgs")],
      // 使用 svg 图标的格式（name为图片名称）
      symbolId: "icon-[name]",
      //生成组件插入位置 只有两个值 boby-last | body-first
      inject: 'body-last'
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 打包配置
  build:{
    target:'modules',
    outDir:'C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/simpleweblivewal/',
    emptyOutDir: true, // 构建时清空该目录
  },
})
