export type ResourceCategory =
  | 'framework'
  | 'build'
  | 'styling'
  | 'runtime'
  | 'data'
  | 'testing'
  | 'quality'
  | 'docs'

export type TechResource = {
  id: string
  name: string
  description: string
  category: ResourceCategory
  tags: string[]
  url: string
  docsUrl?: string
  featured?: boolean
  level: '基础' | '进阶' | '工具'
}

export const RESOURCE_CATEGORIES: Array<{
  id: ResourceCategory | 'all' | 'saved'
  label: string
  description: string
}> = [
  { id: 'all', label: '全部', description: '所有技术资料' },
  { id: 'saved', label: '收藏', description: '本机保存的条目' },
  { id: 'framework', label: '框架', description: '应用与 UI 框架' },
  { id: 'build', label: '编译构建', description: '打包、转译、工程化' },
  { id: 'styling', label: '样式', description: 'CSS 与设计系统' },
  { id: 'runtime', label: '运行时', description: 'Node、边缘与全栈运行时' },
  { id: 'data', label: '数据', description: '数据获取、状态与数据库' },
  { id: 'testing', label: '测试', description: '单测、端到端与质量验证' },
  { id: 'quality', label: '代码质量', description: 'Lint、格式化与类型' },
  { id: 'docs', label: '文档规范', description: '标准、API 与学习入口' },
]

export const TECH_RESOURCES: TechResource[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    description:
      'React 全栈框架，适合 App Router、服务端渲染和生产级 Web 应用。',
    category: 'framework',
    tags: ['React', 'SSR', 'Full-stack'],
    url: 'https://nextjs.org/',
    docsUrl: 'https://nextjs.org/docs',
    featured: true,
    level: '进阶',
  },
  {
    id: 'react',
    name: 'React',
    description: '用于构建用户界面的组件模型，也是当前项目的核心 UI 基础。',
    category: 'framework',
    tags: ['UI', 'Component', 'Hooks'],
    url: 'https://react.dev/',
    docsUrl: 'https://react.dev/learn',
    featured: true,
    level: '基础',
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    description: '原子化 CSS 工具链，适合快速构建一致且可维护的界面。',
    category: 'styling',
    tags: ['CSS', 'Design System'],
    url: 'https://tailwindcss.com/',
    docsUrl: 'https://tailwindcss.com/docs',
    featured: true,
    level: '工具',
  },
  {
    id: 'shadcn',
    name: 'shadcn/ui',
    description: '可复制进项目的组件集合，便于保持交互、样式和可访问性的一致。',
    category: 'styling',
    tags: ['UI Kit', 'Radix', 'Base UI'],
    url: 'https://ui.shadcn.com/',
    docsUrl: 'https://ui.shadcn.com/docs',
    featured: true,
    level: '工具',
  },
  {
    id: 'vite',
    name: 'Vite',
    description: '现代前端构建工具，开发启动快，插件生态成熟。',
    category: 'build',
    tags: ['Build', 'Dev Server'],
    url: 'https://vite.dev/',
    docsUrl: 'https://vite.dev/guide/',
    level: '工具',
  },
  {
    id: 'turborepo',
    name: 'Turborepo',
    description: '面向 monorepo 的任务编排与缓存工具，适合多包工程。',
    category: 'build',
    tags: ['Monorepo', 'Cache'],
    url: 'https://turbo.build/repo',
    docsUrl: 'https://turbo.build/repo/docs',
    level: '进阶',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'JavaScript 的类型系统，帮助大型项目提早发现接口和状态问题。',
    category: 'quality',
    tags: ['Types', 'Language'],
    url: 'https://www.typescriptlang.org/',
    docsUrl: 'https://www.typescriptlang.org/docs/',
    featured: true,
    level: '基础',
  },
  {
    id: 'eslint',
    name: 'ESLint',
    description: '可组合的 JavaScript/TypeScript 静态检查工具。',
    category: 'quality',
    tags: ['Lint', 'Quality'],
    url: 'https://eslint.org/',
    docsUrl: 'https://eslint.org/docs/latest/',
    level: '工具',
  },
  {
    id: 'prettier',
    name: 'Prettier',
    description: '自动格式化代码，减少风格争论，让 review 更关注行为。',
    category: 'quality',
    tags: ['Format', 'DX'],
    url: 'https://prettier.io/',
    docsUrl: 'https://prettier.io/docs/',
    level: '工具',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    description: 'JavaScript 服务端运行时，仍是 Web 工程链和服务端生态的基础。',
    category: 'runtime',
    tags: ['Runtime', 'Server'],
    url: 'https://nodejs.org/',
    docsUrl: 'https://nodejs.org/docs/latest/api/',
    level: '基础',
  },
  {
    id: 'bun',
    name: 'Bun',
    description: '一体化 JavaScript 运行时，包含包管理器、测试和构建能力。',
    category: 'runtime',
    tags: ['Runtime', 'Package Manager'],
    url: 'https://bun.sh/',
    docsUrl: 'https://bun.sh/docs',
    level: '进阶',
  },
  {
    id: 'cloudflare-workers',
    name: 'Cloudflare Workers',
    description: '边缘运行时，适合构建低延迟 API、代理和轻量服务。',
    category: 'runtime',
    tags: ['Edge', 'Serverless'],
    url: 'https://workers.cloudflare.com/',
    docsUrl: 'https://developers.cloudflare.com/workers/',
    level: '进阶',
  },
  {
    id: 'tanstack-query',
    name: 'TanStack Query',
    description: '服务端状态管理库，负责缓存、重试、失效和异步交互。',
    category: 'data',
    tags: ['Server State', 'Cache'],
    url: 'https://tanstack.com/query/latest',
    docsUrl: 'https://tanstack.com/query/latest/docs/framework/react/overview',
    featured: true,
    level: '进阶',
  },
  {
    id: 'trpc',
    name: 'tRPC',
    description: '端到端类型安全 API，适合 TypeScript 全栈项目。',
    category: 'data',
    tags: ['API', 'Type-safe'],
    url: 'https://trpc.io/',
    docsUrl: 'https://trpc.io/docs',
    featured: true,
    level: '进阶',
  },
  {
    id: 'drizzle',
    name: 'Drizzle ORM',
    description: 'TypeScript ORM 与迁移工具，强调 SQL 可见性和类型安全。',
    category: 'data',
    tags: ['ORM', 'SQL', 'Migration'],
    url: 'https://orm.drizzle.team/',
    docsUrl: 'https://orm.drizzle.team/docs/overview',
    featured: true,
    level: '进阶',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: '成熟稳定的关系型数据库，适合内容、账号和业务数据。',
    category: 'data',
    tags: ['Database', 'SQL'],
    url: 'https://www.postgresql.org/',
    docsUrl: 'https://www.postgresql.org/docs/',
    level: '基础',
  },
  {
    id: 'vitest',
    name: 'Vitest',
    description: '与 Vite 生态贴合的测试框架，适合单元测试和组件测试。',
    category: 'testing',
    tags: ['Unit Test', 'Vite'],
    url: 'https://vitest.dev/',
    docsUrl: 'https://vitest.dev/guide/',
    level: '工具',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    description: '端到端测试和浏览器自动化工具，适合验证真实用户路径。',
    category: 'testing',
    tags: ['E2E', 'Browser'],
    url: 'https://playwright.dev/',
    docsUrl: 'https://playwright.dev/docs/intro',
    level: '进阶',
  },
  {
    id: 'mdn',
    name: 'MDN Web Docs',
    description: 'Web 平台标准和 API 的权威学习入口。',
    category: 'docs',
    tags: ['Web API', 'Reference'],
    url: 'https://developer.mozilla.org/',
    docsUrl: 'https://developer.mozilla.org/docs/Web',
    featured: true,
    level: '基础',
  },
  {
    id: 'web-dev',
    name: 'web.dev',
    description: 'Google 维护的 Web 性能、可访问性和最佳实践指南。',
    category: 'docs',
    tags: ['Performance', 'A11y'],
    url: 'https://web.dev/',
    docsUrl: 'https://web.dev/learn',
    level: '进阶',
  },
]
