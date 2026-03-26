# 关键决策记录 (Decisions Log)

本文件用于记录此独立工作区内任何涉及架构设计、命名规范、技术选型或重大变更的最终决策。

## 决策历史

### [2026-03-25] 2. 基础开发环境从 Node+Jest 迁移至 Bun
- **决策内容**：移除 Jest 相关依赖（`jest`, `ts-jest`, `@types/jest`），改用 Bun 原生支持的 TypeScript 运行和 `bun test` 替代。
- **决策原因**：根据反馈，Bun 拥有开箱即用的原生 TypeScript 支持，且内置了速度极快的测试运行器（Test Runner），这大大简化了繁琐的打包构建与测试配置环节，带来了更好的开发者体验。
- **影响范围**：代码规范和测试全部统一以 Bun 的标准执行，后续指令统一使用 `bun run` 或 `bun test`。

### [2026-03-25] 1. 项目基础配置与规范确立
- **决策内容**：初始化 `AGENTS.md`，明确 TypeScript 为主要开发语言，以及必须遵守 `Planning With Files` 的双文件机制。
- **决策原因**：根据先前的交接文档（`2026-03-22-superpowers-planning-with-files-handoff.md`）中的目标与流程，需要建立规范严格的多 Agent 协同开发空间。
- **影响范围**：整个新项目的生命周期内，所有 Agent 必须遵循 `docs/planning/current.md` 与 `decisions.md`。

---
