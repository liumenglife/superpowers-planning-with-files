# Superpowers Planning With Files (Claude Code 版)

这是一个专为 Claude Code（及未来兼容的 OpenCode）打造的**以 Superpowers 为核心开发流程的自动化上下文防偏航管理增强插件**。本工具箱强制执行 **"Planning With Files"** 工作流，必须配合 Superpowers 的整体机制协同工作，确保大模型在复杂、长周期的项目中不会偏离主线任务，同时避免因上下文（Context）超载而导致的记忆丢失和幻觉。

## 核心能力

1. **规范强制落地 (Skill)**：包含专为 Claude Code 编写的 `SKILL.md`，从思想层面约束主 Agent 必须使用 `current.md` 和 `decisions.md` 来追踪任务和架构决策。
2. **自动化初始化 (CLI - Start)**：提供一键命令，光速在项目中生成标准化、防偏航的规划文件模板。
3. **双步防线校验模型 (CLI - Ready & Hook)**：提供基于文件锚点和上下文百分比的智能拦截算法。

## 安装指南

本项目全面基于 [Bun](https://bun.sh/) 构建，以提供极致的 TypeScript 执行体验。

```bash
# 1. 克隆或进入本目录
cd superpowers-planning-with-files

# 2. 安装依赖
bun install

# 3. 运行一键安装脚本
bun run install.ts
```

安装脚本会自动执行以下两件事：
1. 将 `src/skills/SKILL.md` 复制到您的 `~/.claude/skills/superpowers-planning-with-files/` 目录下，让 Claude Code 自动加载此心智模型。
2. 将 `spf` 命令行工具全局链接（`bun link`），使您（或您的 Agent）能在终端中随时随地调用 `spf` 命令。

## 使用说明

### 1. `spf start`
在任何新项目的根目录执行：
```bash
spf start
```
**作用**：自动创建 `docs/planning/current.md` 和 `docs/planning/decisions.md`，并注入标准结构。大模型在正式写代码前，必须调用此命令以建立“全局真相”。

### 2. `spf ready <percentage> [client]`
用于手动检查当前项目是否健康，或者是否需要强制切断并开启新 Session。
```bash
spf ready 45
spf ready 55 opencode
```
**作用**：终端会输出详细的评估结果和下一步行动指令（如是否需要执行 `/clear`）。

### 3. `spf hook <percentage> [client]`
专为生命周期拦截器设计的后台静默指令。
```bash
spf hook 40
```
**作用**：如果项目处于健康状态，它将不会输出任何内容（静默放行）；但如果发现锚点不全或 Context 压力过大，它会向 `stdout` 输出严厉的系统警告。可用于结合 Claude Code 的钩子生态。

---

## 核心计算逻辑：双步判定法

本工具包最核心的护城河在于其“切 Session”判定逻辑。这不是单纯的提示，而是一套**强制阻断机制**。

### 第一步：恢复锚点齐全度检查 (Anchor Check)
系统会扫描当前项目根目录，检查以下四项是否齐全：
- `docs/planning/current.md`
- `docs/planning/decisions.md`
- `docs/superpowers/specs/` 下至少有一个 spec 文件
- `docs/superpowers/plans/` 下至少有一个 plan 文件（与 spec 共计至少一项即可）

🔴 **如果缺失**：无论当前 Context 百分比是多少，系统都会**绝对阻断**。它会输出 `【系统拦截与紧急指令】`，强制要求大模型放下手头所有工作，立刻补齐这些文件。因为如果没有这些锚点文件，强行切 Session 就意味着永久丢失项目的上下文记忆。

### 第二步：上下文压力监控 (Context Monitor)
如果第一步检查通过（锚点齐全），系统才会评估传入的上下文使用率 (`percentage`)：

- 🟢 **< 40% (Normal)**：上下文充裕，静默放行，大模型可以自由写代码。
- 🟡 **40% ~ 50% (Soft Warning)**：轻度预警区间。输出 `【系统状态通知】`，温和地建议大模型在当前任务结束后，考虑执行 `/clear` 开启新 Session。
- 🔴 **>= 51% (Hard Warning)**：危险区间（即将触发 Claude 的早期底层压缩机制）。系统会发出红色警告，强烈要求大模型尽快执行 `/clear`，利用已完善的锚点文件在新 Session 中恢复开发。
