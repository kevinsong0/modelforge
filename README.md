# ModelForge / 模型锻造

**锻造可靠、可审计的金融模型**

ModelForge 是一个 AI 原生的金融建模 IDE，专为投资分析师设计。通过可视化节点编辑，构建 DCF 估值、三表模型，每一步都可追溯、可审计。

## 功能特性

- **可视化建模**: 拖拽式节点编辑器，直观构建复杂金融模型
- **AI 辅助**: 智能助手帮你构建模型、解释公式、获取数据
- **完全可追溯**: 每个计算结果都可追溯到数据源，自动生成审计日志
- **数据集成**: 内置 AKShare 数据源，直接获取 A 股财务数据
- **模板支持**: DCF 估值、三表模型、可比公司分析等预置模板
- **Excel 兼容**: 支持导入导出 Excel 文件

## 技术栈

- **前端**: Next.js 15 + TypeScript + Tailwind CSS
- **节点编辑器**: React Flow
- **UI 组件**: shadcn/ui
- **数据库**: Supabase (PostgreSQL + Auth + Storage)
- **AI**: OpenAI API (支持自定义)
- **数据源**: AKShare

## 快速开始

### 安装依赖

```bash
cd modelforge
npm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI (可选，用户也可在设置中配置)
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
modelforge/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证页面
│   ├── (dashboard)/       # 主应用
│   │   ├── models/        # 模型列表
│   │   ├── model/[id]/    # 模型编辑器
│   │   └── settings/      # 设置
│   ├── api/               # API 路由
│   │   ├── ai/            # AI 相关
│   │   ├── data/          # 数据获取
│   │   └── models/        # 模型 CRUD
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── canvas/            # 节点编辑器组件
│   │   ├── nodes/         # 节点组件
│   │   └── ModelCanvas.tsx
│   ├── chat/              # AI 聊天组件
│   └── ui/                # shadcn 组件
├── lib/
│   ├── engine/            # 计算引擎
│   ├── ai/                # AI 服务
│   ├── data/              # 数据连接器
│   └── finance/           # 金融计算
├── types/                 # TypeScript 类型定义
└── supabase/              # Supabase 配置
```

## 核心概念

### 节点类型

- **Input (数据输入)**: 从 AKShare、Excel 或手动输入获取数据
- **Assumption (假设)**: 定义模型参数和假设
- **Formula (公式)**: 使用 DSL 进行计算
- **Table (表格)**: 创建和编辑数据表格
- **Module (模块)**: 组合多个节点为可复用模块
- **Output (输出)**: 模型结果输出

### 金融模型模板

1. **DCF 估值模型**
   - 自由现金流预测
   - 终值计算
   - 敏感性分析

2. **三表模型**
   - 利润表
   - 资产负债表
   - 现金流量表
   - 三表联动

3. **可比公司分析**
   - PE/PB/EV-EBITDA 倍数
   - 行业对比

## API 文档

### AI Chat API

```typescript
POST /api/ai/chat
Body: { message: string }
Response: { response: string }
```

### 数据 API

```typescript
POST /api/data/akshare
Body: { endpoint: 'stock-info' | 'financials' | 'market-data', params: {...} }
```

### 模型 API

```typescript
GET /api/models          # 获取模型列表
POST /api/models         # 创建模型
PUT /api/models          # 更新模型
DELETE /api/models?id=   # 删除模型
```

## 开发路线

### MVP (Week 1-8) ✅ 已完成

- [x] 项目初始化
- [x] 节点编辑器完善
- [x] DCF 模型实现
- [x] AKShare 数据集成
- [x] AI 助手基础功能
- [x] Excel 导入导出

### v1.0 (Week 9-16)

- [ ] 三表模型
- [ ] 可比公司分析
- [ ] 敏感性分析
- [ ] 审计日志导出

### Enterprise (Future)

- [ ] 团队协作
- [ ] 本地部署版
- [ ] 商业数据源
- [ ] 模板市场

## 贡献

欢迎贡献代码、报告问题或提出建议！

## 许可证

MIT License

---

**ModelForge** - 让金融建模更可靠、更透明