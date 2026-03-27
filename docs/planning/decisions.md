# 关键决策记录 (Decisions Log)

本文件用于记录此独立工作区内任何涉及架构设计、命名规范、技术选型或重大变更的最终决策。

## 决策历史

### [2026-03-26] 3. Claude Code 命令以 `~/.claude/commands/` 的 namespaced slash commands 形式交付

- **决策内容**：Claude Code 侧不再仅依赖全局 CLI `spf` 的口头约定，而是正式在 `~/.claude/commands/` 下部署三类命令模板：根命令 `spf.md`（映射 `/spf`）、子命令 `spf/start.md`（映射 `/spf:start`）与 `spf/ready.md`（映射 `/spf:ready`）。命令本身保持薄适配层，只负责调用已有 `spf` CLI 核心逻辑。
- **决策原因**：此前产品只真正交付了 shell 命令 `spf`，却没有完成 Claude Code slash command 的安装链，导致用户在 Claude 中输入 `/spf` 系列命令时直接失败。采用 namespaced command 文件可与 Claude Code 现有机制完全对齐，同时复用已有 `runSpfStart` / `runSpfReady` 行为，避免双份逻辑漂移。
- **影响范围**：`install.ts` 需负责同步部署 skills 与 commands；README 与统一规范需明确区分 shell CLI `spf ...` 和 Claude slash commands `/spf...`；后续 Claude 端命令扩展继续沿用 `spf/<subcommand>.md` 的目录约定。

### [2026-03-27] 4. Claude Code 自动 Context 预警改由 `statusLine` 包装器实现，spec/plan 降级为推荐锚点

- **决策内容**：放弃“Claude Hook 可直接读取真实 Context 百分比并注入系统提示”的假设，改为通过接管 `~/.claude/settings.json` 中的 `statusLine.command`，包装现有 HUD 命令并读取 Claude 原生 stdin 里的 `context_window.used_percentage`。同时调整锚点规则：`docs/planning/current.md` 与 `docs/planning/decisions.md` 仍为硬性必需，`docs/superpowers/specs/` / `plans/` 下的 spec/plan 改为业务分析阶段的推荐锚点，不再阻止 40%/51% 的 Context 提示。
- **决策原因**：真实排查发现 Claude Code Hook stdin 并不提供 `context_window.used_percentage`，因此此前设计中的 Hook 自动预警在技术上不可达；唯一能稳定拿到该百分比的入口是 status line stdin（`claude-hud` 也是通过这里读取）。另外，用户在刚执行 `/spf:start`、尚未开始业务分析时没有 spec/plan 是正常状态，若仍将其设为硬阻断，会让轻/重提示永远无法出现。
- **影响范围**：`install.ts` 需额外安装 status line 包装器并保留已有 HUD 命令；新增 `bin/spf-statusline.ts` 与 `src/claude-statusline.ts`；`runSpfReady`、`checkRecoveryAnchors`、README 与统一规范都要同步修正能力边界与锚点语义。

### [2026-03-25] 2. 基础开发环境从 Node+Jest 迁移至 Bun

- **决策内容**：移除 Jest 相关依赖（`jest`, `ts-jest`, `@types/jest`），改用 Bun 原生支持的 TypeScript 运行和 `bun test` 替代。
- **决策原因**：根据反馈，Bun 拥有开箱即用的原生 TypeScript 支持，且内置了速度极快的测试运行器（Test Runner），这大大简化了繁琐的打包构建与测试配置环节，带来了更好的开发者体验。
- **影响范围**：代码规范和测试全部统一以 Bun 的标准执行，后续指令统一使用 `bun run` 或 `bun test`。

### [2026-03-25] 1. 项目基础配置与规范确立

- **决策内容**：初始化 `AGENTS.md`，明确 TypeScript 为主要开发语言，以及必须遵守 `Planning With Files` 的双文件机制。
- **决策原因**：根据先前的交接文档（`2026-03-22-superpowers-planning-with-files-handoff.md`）中的目标与流程，需要建立规范严格的多 Agent 协同开发空间。
- **影响范围**：整个新项目的生命周期内，所有 Agent 必须遵循 `docs/planning/current.md` 与 `decisions.md`。

---
