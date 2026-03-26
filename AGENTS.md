# Superpowers Planning With Files - AGENTS.md

本文件是所有在此项目中操作的 Agent（包含主 Agent 及子 Agent）必须严格遵守的全局工作指南。本项目是一个为 Claude Code 和 OpenCode 开发的插件、命令行与技能（Skill）扩展库。

## 1. 项目概况与开发目标

本项目旨在构建 `superpowers-planning-with-files` 的产品化独立工作区。
核心目标包括：
- 开发 Claude Code 原生版的 `superpowers-planning-with-files` Skill
- 提供配套的 native Command 和 Hook
- 实现基于 Context 百分比的动态 Session 提示判定策略
- 后续回灌适配至 OpenCode 平台

## 2. 核心工作流与状态管理

本项目强制执行「基于文件的计划管理（Planning With Files）」开发范式。

- **全局状态维护**：主 Agent 是唯一维护者，在执行新动作前，必须先读取 `docs/planning/current.md`。
- **支线与主线**：新增输入需分类（主线推进/临时支线/全新任务）。临时支线只可登记在“活跃支线”中，不得覆盖主目标与成功定义。
- **唯一动作**：任意时刻 `current.md` 中只能存在一个“下一步唯一动作”。
- **关键决策记录**：关键技术、命名、架构决策在确认后，必须即时写入 `docs/planning/decisions.md`。
- **子 Agent 边界**：子 Agent 仅执行局部任务，禁止直接改写 `current.md` 的主目标与阶段状态。

## 3. 语言与技术栈

- 语言：TypeScript (推荐 Node.js 环境下执行) / JavaScript (针对 OpenCode 原生插件脚本)
- 文档：Markdown (面向用户和 Agent 的所有说明性文档强制使用简体中文，仅技术词汇保留英文)

## 4. 构建、校验与测试命令

在开发、重构或修复 Bug 之后，必须运行相应的构建与测试命令，确保没有破坏现有功能。

### 常用命令
- **安装依赖**: `npm install` 
- **类型检查**: `npm run type-check` (或 `npx tsc --noEmit`)
- **代码静态扫描**: `npm run lint` (基于 ESLint)
- **格式化代码**: `npm run format` (基于 Prettier)
- **项目构建**: `npm run build`

### 测试框架与执行命令
本项目使用 Jest / Vitest (或生态兼容框架) 进行测试：
- **运行全量测试**: `npm test`
- **运行单个测试文件**: `npx jest <path_to_test_file>` (例如 `npx jest tests/planning_files_smoke.test.ts`)
- **运行单个特定测试用例**: `npx jest -t "你的测试用例名称"` 
- **运行并更新快照**: `npm test -- -u`

遇到失败的测试必须优先排查（Root Cause Analysis），严禁未经授权修改测试断言来强行通过测试。

## 5. 代码风格与质量指南

### 5.1 模块与导入 (Imports)
- 优先使用 ES Modules (ESM) 的 `import/export` 语法。
- 绝对路径导入置于前，相对路径导入置于后；同源模块导入尽量合并。
- 引入 Node 原生模块时优先使用 `node:` 前缀（如 `import fs from 'node:fs'`）。

### 5.2 格式化规范 (Formatting)
- 缩进：2 个空格（禁止使用 Tab）。
- 换行：Linux/Unix 风格 (LF)。
- 引号：TypeScript/JavaScript 代码中使用单引号（字符串模板除外），JSON 中使用双引号。
- 语句末尾强制添加分号。

### 5.3 类型标注 (Types)
- 强制使用 TypeScript，避免使用 `any`，实在无法推断时使用 `unknown` 并配合类型守卫。
- 接口（Interface）与类型别名（Type Alias）的名称使用 `PascalCase`。
- 关键函数的入参及返回值需明确声明类型，便于 IDE 与 Copilot 推断。

### 5.4 命名约定 (Naming Conventions)
- 变量与函数：`camelCase`。
- 类名与构造函数：`PascalCase`。
- 常量与全局配置枚举：`UPPER_SNAKE_CASE`。
- 技能与命令配置目录：使用 `kebab-case`（如 `superpowers-planning-with-files`）。

### 5.5 异常处理 (Error Handling)
- 严禁吞噬异常（静默 `catch (e) {}`），至少需要记录错误日志（`console.error` 或专门的 logger）。
- 向外抛出的异常需携带充足的上下文信息（如引发失败的阶段、操作的文件路径等）。
- IO 操作（文件读写、网络请求）必须包裹在 `try...catch` 中，或确保有上层错误边界处理。

### 5.6 注释与文档
- 代码注释需说明“为什么”这么做（Why），而不是“做什么”（What），除非逻辑过于晦涩。
- 核心功能必须编写 JSDoc 格式的注释。
- Markdown 文档等面向用户输出的内容（如生成的 README），严格使用简体中文。

## 6. Cursor / Copilot 融合规则 (若适用)

尽管本目录暂未直接包含 `.cursor/rules/` 或 `.github/copilot-instructions.md`，以下规则等价于 Copilot/Cursor Rules 级别强制生效：
- [Cursor] 生成代码前，必须全局搜索查找复用已有工具函数。
- [Cursor] 对于文件系统修改操作，必须构建绝对路径。
- [Copilot] 不要假定环境可用，始终在实现前查阅依赖与 `package.json` 配置。
- [AI] 当问题涉及外部库或 API 时，利用 Context7（若有）先查询官方最佳实践。

## 7. Session 切分与预警策略
在代码开发过程中，需要实现并在本地使用此策略：
- 上下文 < 40%：不提示
- 上下文 40% ~ 50%：轻提示（建议利用 `/clear` 或 `/new` 推进）
- 上下文 >= 51%：重提示（强制警告，避免因压缩导致灾难性截断）
恢复新 Session 前，必须确保 `spec`、`plan`、`current.md` 和 `decisions.md` 四个锚点完整，否则优先修补文件。