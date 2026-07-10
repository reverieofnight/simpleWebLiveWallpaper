# simpleWebLiveWallpaper Code Wiki

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [整体架构](#4-整体架构)
5. [模块详解](#5-模块详解)
    1. [背景模块 (background)](#51-背景模块-background)
    2. [时钟模块 (clock)](#52-时钟模块-clock)
    3. [天气模块 (weather)](#53-天气模块-weather)
    4. [音频可视化模块 (audioVisualizer)](#54-音频可视化模块-audiovisualizer)
6. [核心服务层](#6-核心服务层)
    1. [Pinia 全局状态管理](#61-pinia-全局状态管理)
    2. [Mitt 事件总线](#62-mitt-事件总线)
    3. [Vue Router 路由](#63-vue-router-路由)
7. [工具与辅助模块](#7-工具与辅助模块)
8. [依赖关系](#8-依赖关系)
9. [项目运行方式](#9-项目运行方式)
10. [Wallpaper Engine 集成](#10-wallpaper-engine-集成)
11. [开发与生产环境](#11-开发与生产环境)

---

## 1. 项目概述

**simpleWebLiveWallpaper** 是一个基于 Vue 3 的 Web 动态壁纸应用，专为 **Steam Wallpaper Engine** 平台设计。它通过网页技术实现生动的桌面壁纸效果，具备以下核心功能：

- **三种背景类型**：静态图片、图片幻灯片轮播、视频播放
- **数字时钟显示**：大字体显示时/分/秒，以及日期、月份、年份、星期
- **实时天气信息**：通过高德地图 API 获取实时天气，并显示温度、湿度、天气图标
- **天气响应特效**：下雨天气时桌面自动渲染雨滴动画
- **音频可视化**：Wallpaper Engine 音频频谱驱动的条形/圆形可视化效果
- **FPS 显示**：可选的实时帧率监控
- **幻灯片切换动画**：支持淡入淡出、滑动、3D 抽取放大、随机四种切换效果

---

## 2. 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| **Vue 3** | 前端框架 (Composition API + `<script setup>`) | ^3.4.29 |
| **Vite** | 构建工具 | ^5.3.1 |
| **Pinia** | 状态管理 | ^2.1.7 |
| **Vue Router** | 路由管理 | ^4.3.3 |
| **Axios** | HTTP 请求 | ^1.7.2 |
| **Day.js** | 日期时间处理 | ^1.11.11 |
| **Less** | CSS 预处理器 | ^4.2.0 |
| **Mitt** | 事件总线 (Event Bus) | ^3.0.1 |
| **vite-plugin-svg-icons** | SVG 图标批量注册 | ^2.0.1 |

---

## 3. 项目结构

```
simpleWebLiveWallpaper/
├── public/
│   ├── favicon.ico              # 网站图标
│   ├── preview.jpg              # Wallpaper Engine 预览图
│   └── project.json             # Wallpaper Engine 项目配置（属性面板、多语言、Workshop 信息）
├── src/
│   ├── assets/
│   │   ├── fonts/
│   │   │   └── digital.ttf      # 数字时钟字体
│   │   ├── svgs/                # SVG 图标集（天气图标等）
│   │   │   ├── 100.svg          # 晴
│   │   │   ├── 101.svg          # 多云
│   │   │   ├── 104.svg          # 阴
│   │   │   ├── 399.svg          # 雨
│   │   │   ├── 405.svg          # 雨夹雪
│   │   │   ├── 499.svg          # 雪
│   │   │   ├── 501.svg          # 雾
│   │   │   ├── 502.svg          # 霾
│   │   │   ├── 2051.svg         # 风
│   │   │   ├── 999.svg          # 未知
│   │   │   ├── smile.svg        # 舒适
│   │   │   └── cry.svg          # 不舒适
│   │   ├── adCodeMap.js         # 中国行政区名称 ↔ 高德 adcode 映射表
│   │   ├── base.css             # 基础 CSS 变量与全局样式
│   │   ├── main.css             # 主样式入口（导入 base.css）
│   │   └── logo.svg             # Vue 图标
│   ├── components/
│   │   ├── svgIcon.vue          # 通用 SVG 图标组件
│   │   ├── HelloWorld.vue       # 默认示例组件
│   │   ├── TheWelcome.vue       # 欢迎页组件
│   │   ├── WelcomeItem.vue      # 欢迎页列表项
│   │   └── icons/               # 默认图标组件集
│   ├── modules/                 # 核心功能模块（壁纸层）
│   │   ├── background/
│   │   │   └── index.vue        # 背景模块（静态/幻灯片/视频）
│   │   ├── clock/
│   │   │   └── index.vue        # 时钟模块
│   │   ├── weather/
│   │   │   ├── index.vue        # 天气模块 + 下雨动画
│   │   │   └── weatherToIcon.js # 天气状况 → SVG 图标映射
│   │   └── audioVisualizer/
│   │       └── index.vue        # 音频可视化模块（条形/圆形）
│   ├── pinia/
│   │   └── index.js             # Pinia 全局 Store 定义
│   ├── router/
│   │   └── index.js             # Vue Router 路由配置
│   ├── translate/
│   │   └── clock.js             # 时钟多语言翻译（星期、月份中英文）
│   ├── utils/
│   │   └── mitt.js              # Mitt 事件总线实例
│   ├── views/
│   │   ├── HomeView.vue         # 首页视图
│   │   └── AboutView.vue        # 关于页视图（延迟加载）
│   ├── App.vue                  # 根组件（所有壁纸层的容器）
│   └── main.js                  # Vue 应用入口
├── .env.dev                     # 开发环境变量
├── .env.prod                    # 生产环境变量
├── .gitignore                   # Git 忽略规则
├── index.html                   # HTML 入口
├── jsconfig.json                # JS 路径别名配置 (@/ → src/)
├── package.json                 # 项目依赖与脚本
├── vite.config.js               # Vite 构建配置
└── README.md                    # 项目说明
```

---

## 4. 整体架构

### 4.1 分层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     App.vue (根容器)                         │
│  ┌──────────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐  │
│  │ Background   │ │ Clock  │ │Weather │ │AudioVisualizer │  │
│  │   Module     │ │ Module │ │ Module │ │    Module      │  │
│  └──────────────┘ └────────┘ └────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │               │         │              │
         └───────────────┴─────────┴──────────────┘
                              │
                    Pinia Store (全局状态)
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    Mitt 事件总线        Vue Router           Axios
   (模块间通信)        (路由导航)          (HTTP 请求)
```

### 4.2 核心架构说明

- **App.vue** 为根组件，作为所有壁纸层的容器，通过 CSS 绝对定位将各模块叠加在同一视口中
- 每个模块通过 `defineExpose` 暴露 `init()` / `destroy()` 等方法，由 **App.vue** 统一调度生命周期
- **Pinia Store** 集中管理所有配置状态，各模块通过 `computed` 响应式读取
- 生产模式下，Wallpaper Engine 通过 `window.wallpaperPropertyListener` 回调通知属性变更
- 开发模式下，App.vue 预设模拟数据以方便调试

### 4.3 数据流

```
Wallpaper Engine 属性面板
        │
        ▼  window.wallpaperPropertyListener.applyUserProperties()
App.vue (处理属性变更)
        │
        ├──▶ Pinia Store (更新状态)
        │
        ├──▶ 模块 ref.init() / .destroy() (启停模块)
        │
        └──▶ watch 响应 (模块内部监听 Store 变化)
                │
                ▼
          模块视图更新 (Canvas / DOM)
```

---

## 5. 模块详解

### 5.1 背景模块 (background)

**文件**: [src/modules/background/index.vue](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/background/index.vue)

#### 职责
提供三种背景类型的渲染与切换：静态图片、图片幻灯片轮播、视频播放。

#### 核心状态 (Pinia Store 响应式)

| 状态 | 类型 | 说明 |
|------|------|------|
| `store.bgSet.showBackground` | boolean | 是否显示背景层 |
| `store.bgSet.backgroundType` | string | 背景类型：`static` / `slide` / `video` |
| `store.bgSet.filePath` | string | 静态背景图片路径 |
| `store.bgSet.fileDirectory` | string | 幻灯片图片文件夹路径 |
| `store.bgSet.videoFilePath` | string | 视频文件路径 |
| `store.bgSet.videoVolume` | number | 视频音量 (0~1) |
| `store.bgSet.duration` | number | 幻灯片切换间隔 (毫秒) |
| `store.bgSet.switchAnimation` | string | 切换动画：`fade` / `slide` / `moveToBack` / `random` |

#### 关键函数

| 函数 | 可见性 | 说明 |
|------|--------|------|
| `init()` | 公开 | 根据背景类型初始化对应渲染逻辑 |
| `destroy()` | 公开 | 销毁所有背景渲染（清除定时器、停止播放器） |
| `handleClickNext()` | 公开 | 手动切换到下一张幻灯片 |
| `initSlide()` | 私有 | 初始化幻灯片模式，设置定时轮播 |
| `destroySlide()` | 私有 | 销毁幻灯片（清除定时器、清除图片） |
| `switchBackgroundImage()` | 私有 | 切换幻灯片图片，执行动画过渡 |
| `initPlayer()` | 私有 | 创建并初始化 `<video>` 元素 |
| `destroyPlayer()` | 私有 | 销毁视频播放器 |
| `preloadImage(src)` | 私有 | 预加载图片（返回 Promise） |

#### 幻灯片切换动画

四种动画通过 `requestAnimationFrame` + `cancelAnimationFrame` 实现：

1. **fade (淡入淡出)**：旧图透明度递减至0，新图保持不透明
2. **slide (滑动)**：旧图向左平移，新图从右侧进入
3. **moveToBack (抽取放大)**：旧图向远平移并缩小（3D 透视），新图由远及近放大至全屏
4. **random (随机)**：从 fade/slide/moveToBack 中随机选取

所有动画均受 **FPS 限制控制**，通过 `fpsCheck()` 函数按帧率阈值调节动画步长，确保不同刷新率显示器表现一致。

#### 持久化存储

幻灯片模式下，当前壁纸信息（文件路径、时间戳）通过 `localStorage` 持久化：
- 键名：`wallpaperFileInfo`
- 用途：刷新后恢复上次壁纸，避免每次刷新都切换图片

#### 视频播放模式

- 通过 `document.createElement('video')` 动态创建视频元素
- 设置 `loop` 实现循环播放
- `object-fit: cover` 实现全屏覆盖
- 监听 `videoFilePath` / `videoVolume` 变化实时更新

---

### 5.2 时钟模块 (clock)

**文件**: [src/modules/clock/index.vue](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/clock/index.vue)

#### 职责
在壁纸中央显示大字体数字时钟，包含时:分:秒、日期、月份、年份、星期。

#### 核心状态

| 状态 | 类型 | 说明 |
|------|------|------|
| `showLayer` | boolean | 是否显示时钟层 |
| `dotActive` | boolean | 冒号闪烁状态 |
| `time` (reactive) | object | 包含 year/month/day/weekday/hour/minute/second |

#### 关键函数

| 函数 | 可见性 | 说明 |
|------|--------|------|
| `init()` | 公开 | 启动时钟，每秒更新一次时间数据 |
| `destroy()` | 公开 | 停止时钟更新 |

#### 实现细节

- 使用 **Day.js** 格式化时间字符串 `YYYY-MM-DD HH:mm:ss`
- 数字使用自定义字体 `digital.ttf` 渲染
- 冒号每秒闪烁（通过比较秒数变化切换 `dotActive`）
- 星期、月份名称通过 [clock.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/translate/clock.js) 翻译表转换为英文

---

### 5.3 天气模块 (weather)

**文件**: [src/modules/weather/index.vue](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/weather/index.vue)

#### 职责
从高德地图 API 获取实时天气数据并展示，同时根据天气状况触发下雨动画特效。

#### 依赖的 API

| API | 地址 | 用途 |
|-----|------|------|
| 天气查询 | `https://restapi.amap.com/v3/weather/weatherInfo` | 获取实时天气数据 |
| IP 定位 | `https://restapi.amap.com/v3/ip` | 未设置城市编码时自动定位 |

#### 核心状态

| 状态 | 类型 | 说明 |
|------|------|------|
| `store.weatherSet.cityCode` | string | 高德城市编码 (adcode) |
| `store.weatherSet.apiKey` | string | 高德 API Key |
| `lives` (reactive) | object | 天气实时数据（省/市/天气/温度/湿度/风向/风力等） |
| `raining` | boolean | 是否正在下雨 |
| `rainArr` | array | 雨滴对象数组 |

#### 关键函数

| 函数 | 可见性 | 说明 |
|------|--------|------|
| `init()` | 公开 | 初始化天气模块（防抖），开始定时刷新 |
| `destroy()` | 公开 | 销毁天气模块（清除定时器、停止下雨） |
| `getWeather()` | 公开 | 主动请求天气数据 |
| `waitCityCode()` | 私有 | 等待/获取城市编码（无编码时通过 IP 定位获取） |
| `getOfflineWeather()` | 私有 | API 请求失败时读取 localStorage 缓存 |
| `setWeatherData(data)` | 私有 | 设置天气数据，判断是否开启下雨特效 |
| `initRain()` | 私有 | 初始化下雨动画 |
| `stopRain()` | 私有 | 停止下雨动画 |
| `genRain()` | 私有 | 生成雨滴对象，启动 Canvas 绘制 |
| `drawRain()` | 私有 | 使用 Canvas 绘制雨滴下落动画 |
| `calcComfort(humidity)` | 私有 | 根据湿度计算舒适度图标 |

#### 下雨特效实现

- 通过 **Canvas 2D API** 绘制雨滴
- 雨滴数量根据天气强度递增（小雨→暴雨，数量指数级增长）
- 雨滴属性：位置(x, y)、宽度、高度、速度、透明度
- 受 **FPS 限制控制**，确保性能
- `windowResize` 事件触发时自动调整 Canvas 尺寸

#### 天气图标映射

天气文字描述到 SVG 图标的映射由 [weatherToIcon.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/weather/weatherToIcon.js) 完成：

```
高德 API 返回的天气描述 (如 "多云") 
    → weatherMerge() 归类为 "多云" 
    → weatherToIcon() 映射为 "101.svg"
```

#### 离线降级

当 API 请求失败时，从 `localStorage` 读取上次缓存的天气数据，1 小时内有效。

---

### 5.4 音频可视化模块 (audioVisualizer)

**文件**: [src/modules/audioVisualizer/index.vue](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/audioVisualizer/index.vue)

#### 职责
接收 Wallpaper Engine 提供的音频频谱数据，以条形和/或圆形方式进行可视化渲染。

#### 核心状态

| 状态 | 类型 | 说明 |
|------|------|------|
| `store.visSet.audioVisualizer` | boolean | 是否启用音频可视化 |
| `store.visSet.enableBar` | boolean | 是否启用条形可视化 |
| `store.visSet.enableCircle` | boolean | 是否启用圆形可视化 |
| `store.visSet.showFPS` | boolean | 是否显示 FPS |
| `playing` | boolean | 是否正在播放音频 |
| `currentData` | number[] | 当前实际显示的频谱数据 (128 通道) |
| `expectData` | number[] | 从 Wallpaper Engine 接收的原始频谱数据 (128 通道) |

#### 关键函数

| 函数 | 可见性 | 说明 |
|------|--------|------|
| `init()` | 公开 | 初始化音频监听，注册 `wallpaperRegisterAudioListener` |
| `destroy()` | 公开 | 销毁所有绘制和监听 |
| `wallpaperAudioListener(audioArray)` | 私有 | Wallpaper Engine 音频频谱回调 (128 元素 Float32Array) |
| `handlerAudioArray(data)` | 私有 | 合并左右声道（64+64 → 128） |
| `drawInit()` | 私有 | 启动主绘制循环，平滑过渡频谱数据 |
| `drawBarInit()` | 私有 | 启动条形可视化绘制 |
| `drawCircleInit()` | 私有 | 启动圆形可视化绘制 |
| `destroyBar()` | 私有 | 销毁条形可视化 |
| `destroyCircle()` | 私有 | 销毁圆形可视化 |

#### 数据流

```
Wallpaper Engine 音频系统
    │ 每秒约 30 帧频谱数据 (128 元素)
    ▼
wallpaperAudioListener(audioArray)
    │
    ├──▶ 检测播放状态
    │    ├── 静音→静音：判定为停止
    │    └── 有数据：更新 expectData
    │
    ▼
handlerAudioArray() 合并声道
    │
    ▼
drawInit() 主循环
    │ 将 expectData 平滑过渡到 currentData
    │ step = (expect - current) * refreshRate / fpsLimit
    │
    ├──▶ drawBarInit() (Canvas 2D，条形)
    │    128 条竖条，高度 = currentData[i] * 窗口高度/2
    │    带阴影效果
    │
    └──▶ drawCircleInit() (Canvas 2D，圆形)
          128 条辐射状线条，Catmull-Rom 样条曲线闭合
          带淡入淡出透明度过渡
```

#### 条形可视化 (Bar)

- 使用 `fillRect` 在 Canvas 上绘制 128 个竖条
- 每个竖条宽度 = `(窗口宽度 - 127 * 间距) / 128`
- 高度 = `(窗口高度 / 2) * currentData[i]`
- 带 `shadowColor` / `shadowBlur` 阴影效果
- 可选显示实时 FPS

#### 圆形可视化 (Circle)

- 使用 **Catmull-Rom 样条** 转换为贝塞尔曲线，绘制闭合平滑曲线
- 半径 = `min(宽,高) * 0.25 + currentData[i] * 150`
- 128 条辐射状条形围绕圆心排列
- 预计算 cos/sin 值优化性能
- 透明度随播放状态淡入/淡出

#### 音频模拟 (开发模式)

开发模式下没有 Wallpaper Engine 提供音频数据，使用 `audioArraySample` 模拟频谱数据进行调试。

---

## 6. 核心服务层

### 6.1 Pinia 全局状态管理

**文件**: [src/pinia/index.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/pinia/index.js)

通过 `defineStore` 定义全局 Store `useStore`，包含四个配置对象：

```javascript
state: () => ({
    bgSet: {        // 背景配置
        showBackground: '',
        backgroundType: '',
        filePath: '',
        videoFilePath: '',
        videoVolume: '',
        duration: '',
        switchAnimation: '',
    },
    clockSet: {     // 时钟配置
        showClock: false,
    },
    weatherSet: {   // 天气配置
        showWeather: false,
        cityCode: '',
        apiKey: '',
    },
    visSet: {       // 音频可视化配置
        audioVisualizer: false,
        enableBar: false,
        enableCircle: false,
        showFPS: false,
    },
    fpsLimit: '',   // 全局 FPS 限制
})
```

所有模块通过 `computed(() => store.xxx)` 响应式读取配置，确保属性变化时视图自动更新。

### 6.2 Mitt 事件总线

**文件**: [src/utils/mitt.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/utils/mitt.js)

创建一个全局 `mitt` 实例，用于模块间通信：

| 事件 | 发送方 | 接收方 | 说明 |
|------|--------|--------|------|
| `windowResize` | App.vue | weather, audioVisualizer | 窗口大小变化时调整 Canvas 尺寸 |

### 6.3 Vue Router 路由

**文件**: [src/router/index.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/router/index.js)

配置了两个路由：
- `/` → HomeView (默认首页)
- `/about` → AboutView (延迟加载)

> 注意：作为 Wallpaper Engine 壁纸运行时，路由功能不直接使用，路由设计主要是为独立 Web 开发调试服务。

---

## 7. 工具与辅助模块

### 7.1 时钟翻译表

**文件**: [src/translate/clock.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/translate/clock.js)

提供星期和月份的中英文翻译映射：

```javascript
// 星期映射
weekday: { zh: { '0':'星期日', ... }, en: { '0':'Sunday', ... } }
// 月份映射
month: { zh: { '01':'一月', ... }, en: { '01':'January', ... } }
```

### 7.2 行政区编码映射

**文件**: [src/assets/adCodeMap.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/assets/adCodeMap.js)

包含中国全部省级、地级、县级行政区名称到高德 adcode 的映射表，用于 IP 定位结果转换。数据格式：

```javascript
{ "北京市": "110000", "东城区": "110101", ... }
```

### 7.3 SVG 图标组件

**文件**: [src/components/svgIcon.vue](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/components/svgIcon.vue)

通用 SVG 图标组件，通过 `vite-plugin-svg-icons` 将 `src/assets/svgs/` 下的 SVG 文件注册为 `<symbol>`，使用 `<use>` 引用：

```vue
<svg-icon name="100" width="50" height="50"></svg-icon>
```

### 7.4 天气图标映射

**文件**: [src/modules/weather/weatherToIcon.js](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/src/modules/weather/weatherToIcon.js)

将高德天气 API 返回的文字描述（如"小雨"）归类并映射到 SVG 图标 ID：

| 分类 | 包含的天气描述 | 图标 |
|------|---------------|------|
| 晴 | 晴、热 | 100.svg |
| 多云 | 少云、晴间多云、多云 | 101.svg |
| 阴 | 阴 | 104.svg |
| 雨 | 雨、小雨、中雨、大雨、暴雨、雷阵雨等 20 种 | 399.svg |
| 雨夹雪 | 雨雪天气、雨夹雪、阵雨夹雪 | 405.svg |
| 雪 | 雪、阵雪、小雪、中雪、大雪、暴雪等 10 种 | 499.svg |
| 雾 | 雾、浓雾、轻雾、沙尘暴等 10 种 | 501.svg |
| 霾 | 霾、中度霾、重度霾、严重霾 | 502.svg |
| 风 | 有风、微风、大风、飓风、龙卷风等 13 种 | 2051.svg |
| 未知 | 未知 | 999.svg |

---

## 8. 依赖关系

### 8.1 模块依赖图

```
main.js
  ├── App.vue (根组件)
  │     ├── background/index.vue (背景层)
  │     │     └── Pinia Store (bgSet)
  │     ├── clock/index.vue (时钟层)
  │     │     ├── Pinia Store (clockSet)
  │     │     └── translate/clock.js (翻译表)
  │     ├── weather/index.vue (天气层)
  │     │     ├── Pinia Store (weatherSet)
  │     │     ├── axios (HTTP 请求)
  │     │     ├── weather/weatherToIcon.js (图标映射)
  │     │     ├── assets/adCodeMap.js (行政区编码)
  │     │     ├── utils/mitt.js (事件总线 - 监听 windowResize)
  │     │     └── dayjs (时间处理)
  │     └── audioVisualizer/index.vue (音频可视化层)
  │           ├── Pinia Store (visSet)
  │           └── utils/mitt.js (事件总线 - 监听 windowResize)
  ├── router/index.js (Vue Router)
  ├── pinia/index.js (Pinia Store)
  └── components/svgIcon.vue (SVG 图标)
```

### 8.2 NPM 依赖 (dependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| `vue` | ^3.4.29 | 前端核心框架 |
| `vue-router` | ^4.3.3 | 路由管理 |
| `pinia` | ^2.1.7 | 状态管理 |
| `axios` | ^1.7.2 | HTTP 请求（天气 API 调用） |
| `dayjs` | ^1.11.11 | 时间日期格式化 |
| `mitt` | ^3.0.1 | 事件总线 |
| `less` | ^4.2.0 | CSS 预处理器 |
| `less-loader` | ^12.2.0 | Vite Less 加载器 |
| `fast-glob` | ^3.3.2 | 文件系统 glob 匹配 |
| `process` | ^0.11.10 | Node process polyfill |

### 8.3 开发依赖 (devDependencies)

| 包名 | 版本 | 用途 |
|------|------|------|
| `vite` | ^5.3.1 | 构建工具 |
| `@vitejs/plugin-vue` | ^5.0.5 | Vite Vue 3 插件 |
| `vite-plugin-svg-icons` | ^2.0.1 | SVG 图标自动注册 |

---

## 9. 项目运行方式

### 9.1 环境要求

- Node.js >= 18
- npm >= 8

### 9.2 安装依赖

```bash
npm install
```

### 9.3 开发模式

```bash
npm run dev
```

- 命令：`vite --mode dev`
- 使用 `.env.dev` 环境变量 (`NODE_ENV = 'development'`)
- 特点：
  - 自动启用所有模块（背景、时钟、天气、音频可视化）
  - 背景默认使用幻灯片模式 + 随机切换动画
  - 音频可视化使用模拟数据（非 Wallpaper Engine 环境）
  - 预设了高德 API Key 和城市编码（江阴市 320281）
  - HMR (Hot Module Replacement) 热更新

### 9.4 生产构建

```bash
npm run build
```

- 命令：`vite build --mode prod`
- 使用 `.env.prod` 环境变量 (`NODE_ENV = 'production'`)
- 输出目录：`C:/Program Files (x86)/Steam/steamapps/common/wallpaper_engine/projects/myprojects/simpleweblivewal/`
  - 这是 Wallpaper Engine 的项目目录，构建产物可直接被 Wallpaper Engine 加载
- 构建时自动清空输出目录 (`emptyOutDir: true`)

### 9.5 预览构建产物

```bash
npm run preview
```

### 9.6 在 Wallpaper Engine 中使用

1. 完成 `npm run build` 构建
2. 在 Steam Wallpaper Engine 中，选择"从文件添加壁纸"
3. 导航到输出目录 `.../simpleweblivewal/`，选择 `index.html`
4. 壁纸属性面板将显示 `project.json` 中配置的可调节参数

---

## 10. Wallpaper Engine 集成

### 10.1 project.json 配置

**文件**: [public/project.json](file:///c:/Users/YangHai/Desktop/桌面文件/Code/simpleWebLiveWallpaper/public/project.json)

此文件是 Wallpaper Engine Web 壁纸的标准配置文件，包含：

| 字段 | 值 | 说明 |
|------|-----|------|
| `type` | `"Web"` | 壁纸类型为 Web |
| `title` | `"幻境"` | 壁纸名称 |
| `workshopid` | `"3277017252"` | Steam Workshop ID |
| `version` | `51` | 版本号 |
| `supportsaudioprocessing` | `true` | 启用音频处理支持 |

**属性面板配置**定义了用户在 Wallpaper Engine 中可以调节的参数：

| 属性 | 类型 | 条件 | 说明 |
|------|------|------|------|
| `showBackground` | bool | - | 显示/隐藏背景 |
| `backgroundType` | combo | showBackground | 背景类型：静态/幻灯片/视频 |
| `filePath` | file | static | 静态背景图片路径 |
| `videoFilePath` | file | video | 视频文件路径 |
| `videoVolume` | slider | video | 视频音量 (0~1) |
| `fileDirectory` | directory | slide | 幻灯片文件夹路径 |
| `picDuration` | slider | slide | 图片切换间隔 (分钟) |
| `switchAnimation` | combo | slide | 切换动画效果 |
| `showClock` | bool | - | 显示/隐藏时钟 |
| `showWeather` | bool | - | 显示/隐藏天气 |
| `cityCode` | textinput | showWeather | 城市编码 |
| `apiKey` | textinput | showWeather | 高德 API Key |
| `audioVisualizer` | bool | - | 启用/禁用音频可视化 |
| `enableBar` | bool | audioVisualizer | 启用条形可视化 |
| `enableCircle` | bool | audioVisualizer | 启用圆形可视化 |
| `showFPS` | bool | audioVisualizer | 显示 FPS |

### 10.2 Wallpaper Engine API 交互

项目使用 Wallpaper Engine 提供的 JavaScript API：

| API | 用途 | 调用位置 |
|-----|------|----------|
| `window.wallpaperPropertyListener.applyUserProperties(properties)` | 监听用户属性变更 | App.vue |
| `window.wallpaperPropertyListener.applyGeneralProperties(properties)` | 监听通用属性（如 FPS 限制） | App.vue |
| `window.wallpaperRegisterAudioListener(callback)` | 注册音频频谱监听器 | audioVisualizer |
| `window.wallpaperRequestRandomFileForProperty(propertyName, callback)` | 请求随机文件路径 | background |

### 10.3 多语言支持

`project.json` 中包含 `localization` 字段，提供中英文双语支持：
- `en-us`：英文界面标签
- `zh-chs`：中文界面标签

---

## 11. 开发与生产环境

### 11.1 环境文件

| 文件 | 模式 | NODE_ENV |
|------|------|----------|
| `.env.dev` | `dev` | `development` |
| `.env.prod` | `prod` | `production` |

### 11.2 环境差异

| 特性 | 开发模式 (dev) | 生产模式 (prod) |
|------|---------------|-----------------|
| HMR 热更新 | ✅ | ❌ |
| 音频数据来源 | 模拟音频数据 | Wallpaper Engine API |
| 文件选择 | 本地 sample 图片 | Wallpaper Engine `wallpaperRequestRandomFileForProperty` |
| 属性监听 | 预设固定值 | `wallpaperPropertyListener` 实时监听 |
| 输出目录 | Vite 默认 `dist/` | Wallpaper Engine 项目目录 |

### 11.3 Vite 配置要点

```javascript
// vite.config.js
{
  base: './',                    // 相对路径，适配 Wallpaper Engine 本地文件加载
  plugins: [vue(), createSvgIconsPlugin(...)], // SVG 图标插件
  resolve: { alias: { '@': 'src/' } },         // 路径别名
  build: {
    outDir: '.../wallpaper_engine/projects/...', // 直接输出到 WE 目录
    emptyOutDir: true,
  }
}
```