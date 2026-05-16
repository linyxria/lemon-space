export const TECH_RESOURCE_CATEGORIES = [
  {
    id: "framework",
    label: "框架",
    description: "应用、UI 与全栈框架",
  },
  {
    id: "build",
    label: "编译构建",
    description: "打包、转译与工程化",
  },
  {
    id: "styling",
    label: "样式",
    description: "CSS、设计系统与组件库",
  },
  {
    id: "runtime",
    label: "运行时",
    description: "Node、边缘与服务端运行时",
  },
  {
    id: "data",
    label: "数据",
    description: "数据库、缓存与服务端状态",
  },
  {
    id: "testing",
    label: "测试",
    description: "单测、端到端与质量验证",
  },
  {
    id: "quality",
    label: "代码质量",
    description: "类型、Lint 与格式化",
  },
  {
    id: "docs",
    label: "文档规范",
    description: "标准、API 与学习入口",
  },
] as const

export const TECH_RESOURCE_LEVELS = ["基础", "进阶", "工具"] as const
export const TECH_RESOURCE_STATUSES = ["draft", "published"] as const

export type TechResourceCategory =
  (typeof TECH_RESOURCE_CATEGORIES)[number]["id"]
export type TechResourceLevel = (typeof TECH_RESOURCE_LEVELS)[number]
export type TechResourceStatus = (typeof TECH_RESOURCE_STATUSES)[number]
