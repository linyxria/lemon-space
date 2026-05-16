CREATE TABLE "tech_resource" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"url" text NOT NULL,
	"docs_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tech_resource_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tech_resource_bookmark" (
	"user_id" text NOT NULL,
	"resource_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tech_resource_bookmark_resource_id_user_id_pk" PRIMARY KEY("resource_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tech_resource_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"creator_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tech_resource_tag_name_unique" UNIQUE("name"),
	CONSTRAINT "tech_resource_tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tech_resource_tag_link" (
	"resource_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "tech_resource_tag_link_resource_id_tag_id_pk" PRIMARY KEY("resource_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "tech_resource" ADD CONSTRAINT "tech_resource_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_resource_bookmark" ADD CONSTRAINT "tech_resource_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_resource_bookmark" ADD CONSTRAINT "tech_resource_bookmark_resource_id_tech_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."tech_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_resource_tag" ADD CONSTRAINT "tech_resource_tag_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_resource_tag_link" ADD CONSTRAINT "tech_resource_tag_link_resource_id_tech_resource_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."tech_resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tech_resource_tag_link" ADD CONSTRAINT "tech_resource_tag_link_tag_id_tech_resource_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tech_resource_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tech_resource_creator_id_idx" ON "tech_resource" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tech_resource_category_status_idx" ON "tech_resource" USING btree ("category","status");--> statement-breakpoint
CREATE INDEX "tech_resource_status_featured_idx" ON "tech_resource" USING btree ("status","featured");--> statement-breakpoint
CREATE INDEX "tech_resource_tag_link_tag_id_idx" ON "tech_resource_tag_link" USING btree ("tag_id");--> statement-breakpoint
WITH seed_resources(slug, name, description, category, level, url, docs_url, featured) AS (
	VALUES
		('nextjs', 'Next.js', 'React 全栈框架，适合 App Router、服务端渲染和生产级 Web 应用。', 'framework', '进阶', 'https://nextjs.org/', 'https://nextjs.org/docs', true),
		('react', 'React', '用于构建用户界面的组件模型，也是当前项目的核心 UI 基础。', 'framework', '基础', 'https://react.dev/', 'https://react.dev/learn', true),
		('tailwindcss', 'Tailwind CSS', '原子化 CSS 工具链，适合快速构建一致且可维护的界面。', 'styling', '工具', 'https://tailwindcss.com/', 'https://tailwindcss.com/docs', true),
		('shadcn', 'shadcn/ui', '可复制进项目的组件集合，便于保持交互、样式和可访问性的一致。', 'styling', '工具', 'https://ui.shadcn.com/', 'https://ui.shadcn.com/docs', true),
		('vite', 'Vite', '现代前端构建工具，开发启动快，插件生态成熟。', 'build', '工具', 'https://vite.dev/', 'https://vite.dev/guide/', false),
		('turborepo', 'Turborepo', '面向 monorepo 的任务编排与缓存工具，适合多包工程。', 'build', '进阶', 'https://turbo.build/repo', 'https://turbo.build/repo/docs', false),
		('typescript', 'TypeScript', 'JavaScript 的类型系统，帮助大型项目提早发现接口和状态问题。', 'quality', '基础', 'https://www.typescriptlang.org/', 'https://www.typescriptlang.org/docs/', true),
		('eslint', 'ESLint', '可组合的 JavaScript/TypeScript 静态检查工具。', 'quality', '工具', 'https://eslint.org/', 'https://eslint.org/docs/latest/', false),
		('prettier', 'Prettier', '自动格式化代码，减少风格争论，让 review 更关注行为。', 'quality', '工具', 'https://prettier.io/', 'https://prettier.io/docs/', false),
		('nodejs', 'Node.js', 'JavaScript 服务端运行时，仍是 Web 工程链和服务端生态的基础。', 'runtime', '基础', 'https://nodejs.org/', 'https://nodejs.org/docs/latest/api/', false),
		('bun', 'Bun', '一体化 JavaScript 运行时，包含包管理器、测试和构建能力。', 'runtime', '进阶', 'https://bun.sh/', 'https://bun.sh/docs', false),
		('cloudflare-workers', 'Cloudflare Workers', '边缘运行时，适合构建低延迟 API、代理和轻量服务。', 'runtime', '进阶', 'https://workers.cloudflare.com/', 'https://developers.cloudflare.com/workers/', false),
		('tanstack-query', 'TanStack Query', '服务端状态管理库，负责缓存、重试、失效和异步交互。', 'data', '进阶', 'https://tanstack.com/query/latest', 'https://tanstack.com/query/latest/docs/framework/react/overview', true),
		('trpc', 'tRPC', '端到端类型安全 API，适合 TypeScript 全栈项目。', 'data', '进阶', 'https://trpc.io/', 'https://trpc.io/docs', true),
		('drizzle', 'Drizzle ORM', 'TypeScript ORM 与迁移工具，强调 SQL 可见性和类型安全。', 'data', '进阶', 'https://orm.drizzle.team/', 'https://orm.drizzle.team/docs/overview', true),
		('postgres', 'PostgreSQL', '成熟稳定的关系型数据库，适合内容、账号和业务数据。', 'data', '基础', 'https://www.postgresql.org/', 'https://www.postgresql.org/docs/', false),
		('vitest', 'Vitest', '与 Vite 生态贴合的测试框架，适合单元测试和组件测试。', 'testing', '工具', 'https://vitest.dev/', 'https://vitest.dev/guide/', false),
		('playwright', 'Playwright', '端到端测试和浏览器自动化工具，适合验证真实用户路径。', 'testing', '进阶', 'https://playwright.dev/', 'https://playwright.dev/docs/intro', false),
		('mdn', 'MDN Web Docs', 'Web 平台标准和 API 的权威学习入口。', 'docs', '基础', 'https://developer.mozilla.org/', 'https://developer.mozilla.org/docs/Web', true),
		('web-dev', 'web.dev', 'Google 维护的 Web 性能、可访问性和最佳实践指南。', 'docs', '进阶', 'https://web.dev/', 'https://web.dev/learn', false)
),
inserted_resources AS (
	INSERT INTO "tech_resource" ("slug", "name", "description", "category", "level", "url", "docs_url", "featured", "status")
	SELECT slug, name, description, category, level, url, docs_url, featured, 'published'
	FROM seed_resources
	ON CONFLICT ("slug") DO UPDATE SET "slug" = "tech_resource"."slug"
	RETURNING "id", "slug"
),
seed_tags(resource_slug, tag_name, tag_slug) AS (
	VALUES
		('nextjs', 'React', 'react'), ('nextjs', 'SSR', 'ssr'), ('nextjs', 'Full-stack', 'full-stack'),
		('react', 'UI', 'ui'), ('react', 'Component', 'component'), ('react', 'Hooks', 'hooks'),
		('tailwindcss', 'CSS', 'css'), ('tailwindcss', 'Design System', 'design-system'),
		('shadcn', 'UI Kit', 'ui-kit'), ('shadcn', 'Radix', 'radix'), ('shadcn', 'Base UI', 'base-ui'),
		('vite', 'Build', 'build'), ('vite', 'Dev Server', 'dev-server'),
		('turborepo', 'Monorepo', 'monorepo'), ('turborepo', 'Cache', 'cache'),
		('typescript', 'Types', 'types'), ('typescript', 'Language', 'language'),
		('eslint', 'Lint', 'lint'), ('eslint', 'Quality', 'quality'),
		('prettier', 'Format', 'format'), ('prettier', 'DX', 'dx'),
		('nodejs', 'Runtime', 'runtime'), ('nodejs', 'Server', 'server'),
		('bun', 'Runtime', 'runtime'), ('bun', 'Package Manager', 'package-manager'),
		('cloudflare-workers', 'Edge', 'edge'), ('cloudflare-workers', 'Serverless', 'serverless'),
		('tanstack-query', 'Server State', 'server-state'), ('tanstack-query', 'Cache', 'cache'),
		('trpc', 'API', 'api'), ('trpc', 'Type-safe', 'type-safe'),
		('drizzle', 'ORM', 'orm'), ('drizzle', 'SQL', 'sql'), ('drizzle', 'Migration', 'migration'),
		('postgres', 'Database', 'database'), ('postgres', 'SQL', 'sql'),
		('vitest', 'Unit Test', 'unit-test'), ('vitest', 'Vite', 'vite'),
		('playwright', 'E2E', 'e2e'), ('playwright', 'Browser', 'browser'),
		('mdn', 'Web API', 'web-api'), ('mdn', 'Reference', 'reference'),
		('web-dev', 'Performance', 'performance'), ('web-dev', 'A11y', 'a11y')
),
inserted_tags AS (
	INSERT INTO "tech_resource_tag" ("name", "slug")
	SELECT DISTINCT tag_name, tag_slug
	FROM seed_tags
	ON CONFLICT ("slug") DO UPDATE SET "slug" = "tech_resource_tag"."slug"
	RETURNING "id", "slug"
)
INSERT INTO "tech_resource_tag_link" ("resource_id", "tag_id")
SELECT inserted_resources.id, inserted_tags.id
FROM seed_tags
INNER JOIN inserted_resources ON inserted_resources.slug = seed_tags.resource_slug
INNER JOIN inserted_tags ON inserted_tags.slug = seed_tags.tag_slug
ON CONFLICT DO NOTHING;
