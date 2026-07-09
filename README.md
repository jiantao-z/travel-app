# 🌍 智行规划师 — 智能旅行路线设计与可视化平台

**智行规划师** 是一个全栈旅行规划与地理信息可视化平台，集成高德地图、AI 智能规划、数据分析大屏与行程管理功能，为用户提供从灵感探索到路线落地的一站式旅行设计体验。

---

## ✨ 功能概览

| 模块 | 说明 |
|------|------|
| 🗺️ **交互式地图** | 基于高德地图 JS API v2.0，支持多图层 GeoJSON 叠加展示（景点、酒店、餐厅、火车站、机场） |
| 🔐 **用户系统** | JWT 认证，支持注册 / 登录 / 退出 |
| 📋 **行程管理** | 创建、编辑、删除行程组，管理行程项（地点、到达时间、停留时长、交通方式），支持拖拽排序 |
| ⭐ **收藏夹** | 自定义收藏夹，收藏感兴趣的地点（对接高德 POI 搜索） |
| 🤖 **AI 智能规划** | 接入 DeepSeek API，根据目的地、天数、预算、兴趣偏好自动生成旅行路线 |
| 📊 **数据洞察大屏** | ECharts 驱动的 BAUSHAUS 风格数据看板：KPI、中国热力地图、飞线图、预算环形图、热门景点榜、旅行标签云 |
| 🧭 **旅行探索** | 按城市浏览旅行攻略，支持 Markdown 渲染与图片轮播 |
| ⚙️ **系统设置** | 主题切换（浅色/深色）、地图样式切换（标准/卫星/地形）、语言切换（中文/英文） |
| 📏 **测距工具** | 地图内嵌测距小工具 |
| 🔍 **POI 搜索** | 对接高德地点搜索 API，支持关键词搜索并在地图上定位 |

---

## 🏗️ 技术栈

### 前端

| 技术 | 用途 |
|------|------|
| **Vue 3** (Composition API + `<script setup>`) | 响应式 UI 框架 |
| **Vite 7** | 构建工具 |
| **Element Plus** | UI 组件库 |
| **Tailwind CSS** | 原子化样式 |
| **ECharts 6 + vue-echarts** | 数据图表 |
| **@amap/amap-jsapi-loader** | 高德地图加载器 |
| **mitt** | 事件总线 |
| **marked** | Markdown 渲染 |
| **date-fns** | 日期处理 |
| **axios** | HTTP 客户端 |

### 后端

| 技术 | 用途 |
|------|------|
| **Node.js + Express 5** | RESTful API 服务 |
| **Sequelize 6** | ORM |
| **PostgreSQL + PostGIS** | 空间数据库 |
| **JWT (jsonwebtoken)** | 身份认证 |
| **bcrypt** | 密码哈希 |
| **高德 Web 服务 API** | 地点搜索 & 路径规划 |
| **DeepSeek API** | AI 智能旅行规划 |

---

## 📋 环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| **Node.js** | ≥ 16.0.0 | JavaScript 运行时（推荐 18 LTS 或 20 LTS） |
| **npm** | ≥ 8.0.0 | 随 Node.js 一起安装 |
| **PostgreSQL** | ≥ 14.0 | 关系型数据库 |
| **PostGIS** | ≥ 3.0 | PostgreSQL 空间扩展 |
| **Python** | ≥ 3.8（可选） | 仅运行数据处理脚本时需要 |

### 安装 Node.js

- Windows/macOS：访问 https://nodejs.org/ 下载 LTS 版本安装
- Linux (Ubuntu/Debian)：
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### 安装 PostgreSQL + PostGIS

**Windows：**
1. 下载安装包：https://www.postgresql.org/download/windows/
2. 安装时勾选 "PostGIS" 扩展组件，或通过 Stack Builder 安装

**macOS：**
```bash
brew install postgresql@16 postgis
brew services start postgresql@16
```

**Linux (Ubuntu/Debian)：**
```bash
sudo apt-get update
sudo apt-get install postgresql postgis postgresql-16-postgis-3
```

---

## 🔑 获取 API 密钥

运行本项目需要以下第三方 API 密钥，**全部免费注册即可获取**：

### 1. 高德地图 JS API Key（Web端）

用于前端地图交互（图层展示、标记、测距等）。

1. 访问 [高德开放平台](https://lbs.amap.com/) 注册/登录
2. 进入「应用管理 → 我的应用 → 创建新应用」
3. 添加 Key，「服务平台」选择 **「Web端(JS API)」**
4. 记录生成的 Key 和安全密钥

> 需要开通的产品：JS API v2.0、地理编码、POI搜索

### 2. 高德地图 Web 服务 API Key

用于后端地点搜索、路径规划、逆地理编码。

1. 同上在「应用管理」中添加 Key
2. 「服务平台」选择 **「Web服务」**
3. 记录生成的 Key

> 需要开通的产品：地点搜索、路径规划、逆地理编码、地理编码

### 3. DeepSeek AI API Key

用于 AI 智能旅游规划功能。

1. 访问 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册/登录
2. 进入「API Keys」页面，创建新 Key
3. 记录生成的 Key

> 新用户有免费额度，按量计费价格低廉

---

## 🚀 详细部署流程

### 第一步：克隆/解压项目

```bash
# 如果从 GitHub 克隆
git clone <your-repo-url>
cd 智行规划师-开源版

# 如果从压缩包解压
unzip 智行规划师-开源版.zip
cd 智行规划师-开源版
```

---

### 第二步：数据库初始化

#### 2.1 创建数据库

```bash
# 连接 PostgreSQL（根据你安装时的配置调整用户名）
psql -U postgres
```

在 psql 命令行中执行：

```sql
-- 执行完整建库脚本（包含建库、建表、示例数据）
\i traveldesigner.sql
```

该脚本会自动完成：
- 创建 `traveldesigner` 数据库
- 启用 PostGIS 空间扩展
- 创建 8 张业务表（用户、景区、餐厅、住宿、路线、路线详情、收藏夹、收藏项）
- 建立索引优化查询性能
- 插入深圳市示例数据

#### 2.2（可选）手动建库

如果 SQL 脚本执行失败，可以手动创建：

```sql
CREATE DATABASE traveldesigner;
\c traveldesigner
CREATE EXTENSION postgis;
-- 后续表结构由 Sequelize 自动同步（首次启动后端时）
```

---

### 第三步：后端部署

#### 3.1 安装依赖

```bash
cd backend
npm install
```

#### 3.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入你的真实配置：

```env
# 服务端口（可保持默认）
PORT=3001

# PostgreSQL 数据库连接
DB_HOST=localhost
DB_PORT=5432
DB_NAME=traveldesigner
DB_USER=postgres
DB_PASS=你的数据库密码

# JWT 密钥（建议使用随机字符串，例如：openssl rand -hex 32）
JWT_SECRET=你的JWT密钥

# 高德 Web 服务 API Key
AMAP_KEY=你的高德Web服务Key

# DeepSeek AI API Key
DEEPSEEK_API_KEY=你的DeepSeek密钥
```

#### 3.3 启动后端

```bash
npm start
```

看到以下输出表示启动成功：

```
数据库连接成功
数据库表同步成功
后端服务已启动，端口：3001
```

> 如果数据库连接失败，请检查 PostgreSQL 服务是否运行，以及 `.env` 中的数据库配置是否正确。

---

### 第四步：前端部署

#### 4.1 安装依赖

```bash
cd ../frontend
npm install
```

#### 4.2 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入真实配置：

```env
# 后端 API 地址（开发环境保持默认）
VITE_API_BASE_URL=http://localhost:3001/api

# 高德 JS API Key（Web端）
VITE_AMAP_JS_KEY=你的高德JS API Key

# 高德 Web 服务 API Key（与后端 AMAP_KEY 相同）
VITE_AMAP_WEB_KEY=你的高德Web服务Key
```

#### 4.3 启动前端开发服务器

```bash
npm run dev
```

浏览器访问 **http://localhost:5173** 即可使用。

---

### 第五步：构建生产版本（可选）

```bash
# 构建前端
npm run build

# 产物在 dist/ 目录，可部署到 Nginx/Apache 等 Web 服务器
```

---

## 📁 项目结构

```
智行规划师-开源版/
├── backend/                          # 后端 API 服务
│   ├── app.js                        # Express 入口，路由注册
│   ├── config/
│   │   └── database.js               # Sequelize + PostgreSQL 连接配置
│   ├── controllers/
│   │   ├── aiController.js           # DeepSeek AI 代理
│   │   ├── authController.js         # 注册 / 登录
│   │   ├── directionsController.js   # 高德路径规划代理
│   │   ├── favoritesController.js    # 收藏夹 CRUD
│   │   ├── locationsController.js    # 高德地点搜索（外部 API 代理）
│   │   ├── poisController.js         # POI 本地搜索（景区/餐厅/住宿）
│   │   └── travelPlansController.js  # 行程组 & 行程项 CRUD + 排序
│   ├── middleware/
│   │   └── auth.js                   # JWT 鉴权中间件
│   ├── models/
│   │   ├── index.js                  # 模型关联定义
│   │   ├── user.js                   # 用户模型
│   │   ├── travelPlan.js             # 行程组模型
│   │   ├── routePlan.js              # 行程项模型
│   │   ├── favorite.js               # 收藏夹模型
│   │   ├── favoriteItem.js           # 收藏项模型
│   │   ├── scenicpot.js              # 景区空间数据模型
│   │   ├── canteen.js                # 餐厅空间数据模型
│   │   ├── lodging.js                # 住宿空间数据模型
│   │   └── poi.js                    # POI 模型
│   ├── routes/                       # 路由定义
│   │   ├── ai.js                     # /api/ai/*
│   │   ├── auth.js                   # /api/auth/*
│   │   ├── directions.js             # /api/directions/*
│   │   ├── favorites.js              # /api/favorites/*
│   │   ├── locations.js              # /api/locations/*
│   │   ├── pois.js                   # /api/pois/*
│   │   └── travelPlans.js            # /api/travelPlans/*
│   ├── .env.example                  # 环境变量模板（可安全提交）
│   └── package.json
│
├── frontend/                         # Vue 3 前端应用
│   ├── index.html                    # 入口 HTML
│   ├── vite.config.js                # Vite 配置
│   ├── public/
│   │   ├── icons/                    # SVG 图标
│   │   └── JSON/                     # GeoJSON 图层数据
│   └── src/
│       ├── main.js                   # Vue 应用入口
│       ├── App.vue                   # 根组件：地图初始化、图层管理
│       ├── eventBus.js               # mitt 事件总线 + 全局状态
│       ├── style.css                 # 全局样式
│       ├── assets/
│       │   ├── dark-theme.css        # 深色主题 CSS
│       │   └── 景点/                 # 景点图片
│       ├── services/
│       │   ├── api.js                # axios 封装（自动携带 JWT）
│       │   └── amap.js               # 高德 JS API 加载器
│       ├── data/
│       │   └── travelGuides.js       # 旅行攻略数据
│       └── components/
│           ├── ModalContainer.vue    # 模态框容器
│           ├── dashboard/            # 数据洞察大屏
│           ├── explore/              # 旅行探索视图
│           ├── map/                  # 地图组件（弹窗/图层/定位/POI）
│           ├── sidebar/              # 侧边导航栏
│           ├── topbar/               # 顶栏（搜索/操作按钮）
│           ├── travel/               # 行程管理组件
│           └── modals/               # 模态框（登录/AI规划/收藏/设置）
│
├── scripts/                          # 数据处理脚本
│   ├── process_city_heat.py          # 城市热度计算（Excel → JSON）
│   └── city_coords_cache.json        # 城市坐标缓存
│
├── 数据文件/                         # 原始 Excel 数据
│   └── excel格式的数据/
│       ├── 国内旅游人数.xlsx
│       └── 国内旅游收入.xlsx
│
├── traveldesigner.sql                # 完整建库脚本
└── README.md
```

---

## 🔌 API 接口文档

### 认证 `/api/auth`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/register` | 用户注册（body: { username, password }） | 无 |
| POST | `/login` | 用户登录，返回 JWT token | 无 |

### 行程组 `/api/travelPlans`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/` | 获取当前用户所有行程 | Bearer |
| POST | `/` | 创建行程组 | Bearer |
| PUT | `/:id` | 编辑行程组 | Bearer |
| DELETE | `/:id` | 删除行程组（级联删除行程项） | Bearer |
| GET | `/:id` | 获取行程详情（含行程项） | Bearer |

### 行程项 `/api/travelPlans/:planId/itineraries`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/` | 获取行程项列表 | Bearer |
| POST | `/` | 创建行程项 | Bearer |
| PUT | `/:itemId` | 编辑行程项 | Bearer |
| DELETE | `/:itemId` | 删除行程项 | Bearer |
| PUT | `../itineraries-order` | 批量更新排序 | Bearer |
| GET | `../geometries` | 获取地图坐标数据 | Bearer |

### 收藏夹 `/api/favorites`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/` | 获取所有收藏夹 | Bearer |
| POST | `/` | 创建收藏夹 | Bearer |
| PUT | `/:id` | 重命名收藏夹 | Bearer |
| DELETE | `/:id` | 删除收藏夹（级联删除收藏项） | Bearer |
| GET | `/:id/items` | 获取收藏夹内项目 | Bearer |
| POST | `/:id/items` | 添加收藏项 | Bearer |
| DELETE | `/:id/items/:item_id` | 移除收藏项 | Bearer |

### 地点搜索 `/api/locations`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/search?q=&city=&page=` | 高德地图 POI 搜索 | Bearer |

### POI `/api/pois`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/search?q=` | 本地数据库搜索（景区/餐厅/住宿） | Bearer |

### 路径规划 `/api/directions`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/driving?origin=&destination=` | 驾车路线规划 | Bearer |
| GET | `/walking?origin=&destination=` | 步行路线规划 | Bearer |
| GET | `/riding?origin=&destination=` | 骑行路线规划 | Bearer |
| GET | `/transit?origin=&destination=&city=` | 公交路线规划 | Bearer |

### AI 规划 `/api/ai`

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/plan` | DeepSeek 旅行规划代理 | Bearer |

---

## ❓ 常见问题排查

### 1. 数据库连接失败

```
❌ SequelizeConnectionRefusedError: connect ECONNREFUSED 127.0.0.1:5432
```

**解决：**
- 确认 PostgreSQL 服务已启动
- 检查 `.env` 中 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASS` 是否正确
- 默认 PostgreSQL 安装后需要设置 postgres 用户密码：
  ```bash
  psql -U postgres
  ALTER USER postgres PASSWORD '你的密码';
  ```

### 2. PostGIS 扩展不存在

```
❌ type "geometry" does not exist
```

**解决：**
```sql
-- 手动启用 PostGIS 扩展
psql -U postgres -d traveldesigner
CREATE EXTENSION postgis;
```

### 3. 高德地图无法加载 / Key 报错

```
❌ [directions] 高德 API → infocode=10001 / 10003
```

**解决：**
- 确认前端 `.env` 中 `VITE_AMAP_JS_KEY` 是 **「Web端(JS API)」** 类型的 Key
- 确认后端 `.env` 中 `AMAP_KEY` 是 **「Web服务」** 类型的 Key
- 在高德控制台检查是否开通了对应 API 产品：地点搜索、路径规划、逆地理编码、JS API v2.0

### 4. AI 规划失败

```
❌ AI 服务请求失败: 401 Unauthorized
```

**解决：**
- 确认后端 `.env` 中 `DEEPSEEK_API_KEY` 正确
- 检查 DeepSeek 账户余额是否充足
- 检查后端日志输出的详细错误信息

### 5. 端口被占用

```
❌ Error: listen EADDRINUSE: address already in use :::3001
```

**解决：**
- 修改 `.env` 中 `PORT` 为其他端口（如 3002）
- 同时修改前端 `.env` 中 `VITE_API_BASE_URL` 对应端口
- 或杀掉占用进程：`npx kill-port 3001`

### 6. Python 数据处理脚本报错

**解决：**
```bash
# 安装所需 Python 包
pip install pandas numpy requests openpyxl

# 设置环境变量
# Windows CMD: set AMAP_KEY=你的Key
# Windows PowerShell: $env:AMAP_KEY="你的Key"
# macOS/Linux: export AMAP_KEY="你的Key"

cd scripts
python process_city_heat.py
```

---

## 🔒 安全说明

- **所有 API 密钥** 存储在 `.env` 文件中（已加入 `.gitignore`），不会提交到 Git
- **DeepSeek AI Key** 仅存在后端，前端通过代理接口调用，不会在浏览器中暴露
- **JWT 密钥** 请使用随机字符串，生产环境务必更换
- **数据库密码** 不要使用弱密码
- `.env.example` 文件是模板（无真实密钥），可以安全提交

---

## 📝 许可

MIT License

---

<p align="center">
  <b>智行规划师</b> — 让每一次旅行都有备而来 ✈️
</p>
