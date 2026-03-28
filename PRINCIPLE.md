# PRINCIPLE.md

这是 Claude Code 和 OpenCode 共用的规则层，只放稳定、不随项目进度变化的约束。

## 共享规则

- 共享规则只写一份，客户端入口只做薄适配。
- 规划真相继续保留在 `docs/planning/current.md`、`docs/planning/history.md`、`docs/planning/decisions.md`。
- 代码实现阶段的独立任务尽量并行派发。
- 有明确前后依赖、决策依赖或产物依赖的任务必须串行。
- Todo 状态统一使用 `[✓]`、`[•]`、`[ ]`。
- `current.md` 只保留当前批次，历史批次移到 `history.md`。
- 读取旧项目时，允许保留历史写法如 `[x]`、`[done]`、`[in_progress]`，但新写入统一使用 `[✓]`、`[•]`、`[ ]`。

## 切换原则

- `current.md`、`history.md`、`decisions.md` 都是恢复锚点。
- `/spf:ready` 会检查这些锚点是否完整。
- Claude Code 侧默认读取 `CLAUDE.md`。
- OpenCode 侧默认读取 `AGENTS.md`。
- 同一个项目在两端切换时，不应该重建一套新的项目真相。
