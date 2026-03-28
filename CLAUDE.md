# Superpowers Planning With Files - CLAUDE.md

本文件是给 Claude Code 的主指令入口。共享规则写在 `PRINCIPLE.md`，这里负责 Claude 侧入口和补充说明。

## 1. 客户端约束

- Claude Code 侧默认读取 `CLAUDE.md`。
- 共享规则来自 `PRINCIPLE.md`。
- 同一个项目的规划真相统一写在 `docs/planning/current.md`、`docs/planning/history.md` 和 `docs/planning/decisions.md`。

## 2. 工作规则

- 进入代码实现阶段后，主 Agent 要尽量并行派发独立任务。
- 有明确前后依赖、决策依赖或产物依赖的任务必须串行。
- `current.md` 只保留当前批次，历史批次移到 `history.md`。
- Todo 状态统一使用 `[✓]`、`[•]`、`[ ]`。

## 3. 恢复与切换

- `current.md`、`history.md`、`decisions.md` 都是恢复锚点。
- `/spf:ready` 会检查这些锚点是否完整。
- 切换 Claude Code 和 OpenCode 时，不应该重建一套新的项目真相。
