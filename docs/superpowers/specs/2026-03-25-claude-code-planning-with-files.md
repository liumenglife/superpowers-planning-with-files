# Claude Code 版 `superpowers-planning-with-files` 规范与设计 (Spec)

## 1. 目标

按照交接文档（2026-03-22-superpowers-planning-with-files-handoff.md），本阶段优先面向 **Claude Code** 原生环境落地 `superpowers-planning-with-files` 插件工作流。

核心目标为：

1. 建设完整的 Claude Code 版 Skill（`superpowers-planning-with-files`）
2. 建设 Claude Code 版 Command (`/spf-start`, `/spf-ready`)
3. 建设基于 Claude Code Hook 机制的预警与自动化 Session 管理（Hook 拦截用户输入或响应）
4. 实现基于原生 `context_window_size` 和 `used_percentage` 细项数据的轻/重提示策略。

## 2. 核心架构设计

### 2.1 目录结构与配置

我们规划将代码统一落盘在 `/Users/agent/.claude/` 目录下（针对 Claude Code 本地环境安装），或在当前工程的 `src/` 中组织后再发布。根据 Claude Code 生态标准目录映射如下：

- **Skills**: `skills/superpowers-planning-with-files/SKILL.md`
- **Commands**: 暂由脚本入口执行，例如 `commands/spf-start.js`, `commands/spf-ready.js` 或自定义命令定义文件。
- **Hooks**: `hooks/planning-context-hook.js` 等，用于拦截执行前后事件。

### 2.2 上下文压力判定策略 (Context Monitoring)

利用 Claude Code 内置的 `claude-hud` 数据或 API，获取当前 Session 的 Context 状态。
判定阈值模型：

- `< 40%`：正常工作，不干预。
- `40% ~ 50%`：轻提示 (Soft Warning)。在 Hook 的后置流程中输出："已经具备切 session 的条件，请根据实际情况，考虑执行 `/clear` 清除 context 后，继续推进项目进程。"
- `>= 51%`：重提示 (Hard Warning)。在 Hook 的后置流程中输出红色警告："已经具备切 session 的条件，且上下文即将触发压缩，为了保证项目开发质量，请尽快考虑执行 `/clear` 清除 context 后，继续推进项目进程。"

### 2.3 恢复锚点齐全度检查 (Recovery Anchor Check)

在提示切 Session 前，必须通过 Hook 或 Command 强制校验四个文件是否存在且有实质内容：

1. `spec` (例如 `docs/superpowers/specs/*.md`)
2. `plan` (例如 `docs/superpowers/plans/*.md`)
3. `docs/planning/current.md`
4. `docs/planning/decisions.md`

- 若不齐全：阻断切 Session 的自动提示，强制提示 Agent "恢复锚点不齐全，请先补齐缺失的 planning 文件"。

### 2.4 主线初始化工作流

当用户执行 `/spf-start`，或 Hook 检测到进入项目型开发但缺乏 planning 文件时：

1. 自动创建 `docs/planning/` 目录。
2. 自动生成并初始化 `current.md` 与 `decisions.md` 的基础模板。
3. 一旦进入编码阶段，主 Agent 必须先把生成的 Task 写入 `current.md`，然后按照 Subagent-Driven Development 分发子 Agent 执行。
4. 初始化 `history.md` 作为历史 Task 批次归档区，保留每个 Task 的状态标记。

## 3. 技术栈

- 运行环境：Node.js
- 模块规范：ES Modules (ESM)
- 代码格式与检查：TypeScript, ESLint, Prettier
- 框架依赖：利用 Claude Code 原生的 Node API/Hook 能力

## 4. 下一步开发动作规划 (Action Plan)

1. **搭建源码目录结构**：在当前仓库创建 `src/skills/`, `src/commands/`, `src/hooks/` 和 `src/utils/`。
2. **编写核心 Utils**：
   - `context-monitor.ts`: 解析 Claude Code 上下文百分比。
   - `anchor-checker.ts`: 检查 planning 文件齐全度。
3. **实现 Hooks**：
   - 实现生命周期 Hook 以根据 Context 触发轻/重提示。
4. **生成与测试**：
   - 编写 Jest 测试用例。
   - 模拟 Context 数据以验证逻辑边界。
