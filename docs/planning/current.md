# 当前任务状态 (Current Planning)

## 1. 主目标

- [ ] 建设 `superpowers-planning-with-files` 的产品化独立工作区（针对 Claude Code / OpenCode）。

## 2. 成功定义

- [ ] 完成 Claude Code 原生版的 Skill、Command 和 Hook。
- [ ] 实现并跑通基于 Context 百分比的动态 Session 提示策略。
- [ ] 可顺利进行跨 Session 会话的任务恢复和上下文接力。

## 3. 非目标

- 本阶段不重点处理其他与 Planning 无关的插件开发。
- 暂不开发图形化界面。

## 4. 当前阶段

- [✓] 初始化项目规范与全局准则 (`AGENTS.md`)
- [✓] 初始化工作流规划文件 (`current.md` 与 `decisions.md`)
- [✓] 编写项目架构与功能设计文档 (Spec & Plan)
- [✓] 核心代码开发
- [✓] CLI 入口开发与功能组装
- [✓] 编写 `install.ts` 并完善对外交付与文档说明
- [✓] 反向优化 OpenCode 第一版逻辑，保持双端一致
- [✓] 总结双端统一架构设计规范 (Unified Spec)
- [✓] 新增：跨终端多重强视觉预警（ANSI 色彩与 AI Markdown 加粗强化）
- [✓] 最终清理：移除已过时的历史交接文档
- [✓] 修复编码阶段 Task 记录缺口，并把 Subagent-Driven Development 写进规范与模板
- [✓] 让 `history.md` 接管已迁移的历史 Task 批次，并保留状态标记
- [✓] 让 `history.md` 成为恢复锚点之一，纳入 `spf ready` 检查
- [✓] 轻提示改为 3 秒自动关闭，重提示保持可见并带百分比
- [✓] 代码实现阶段的 independent tasks 默认优先并行派发 subagent
- [✓] Claude Code 侧检测 `CLAUDE.md`，OpenCode 侧检测 `AGENTS.md`
- [✓] 共享规则抽到 `PRINCIPLE.md`，让双端入口保持薄适配

## 5. 当前正在做

- 验证 Claude Code 和 OpenCode 之间的无缝切换是否已经真正落地。
- 确认 `/spf:start`、`/spf:ready`、status line、OpenCode plugin 这条链路在两端都吃同一份 planning 真相。
- 验证 `PRINCIPLE.md` 已成为 Claude Code / OpenCode 的共享规则层。

## 6. Todo

- [✓] 已完成里程碑回写为当前批次
- [•] 编码阶段任务清单保持活跃
- [ ] 历史批次归档到 `history.md`

## 7. 已完成里程碑

- `AGENTS.md` 文件编写完成并写入根目录。
- 成功将项目工具链从 Node+Jest 切换至极速的 Bun 运行环境。
- 实现了 `src/commands/spf-start.ts` 与 `src/commands/spf-ready.ts` 双重校验机制。
- 实现了面向生命周期的自动化拦截校验机制与全局 CLI `spf`。
- 新建了专为 Claude Code 提取的 `src/skills/SKILL.md` 与 `EXAMPLE.md`。
- 深度剖析 OpenCode 开源架构，完成了 100% 精准提取 Token 与动态模型容量的拦截插件。
- 成功加入了双端终端原生彩色告警 (ANSI) 与大模型强制带进度条回复的四位一体预警体系。
- 编写了一键部署三端的 `install.ts` 并引入了 Bun Bundler 解决模块依赖路径问题。
- 全新撰写了系统级的统一架构设计规范 `docs/superpowers/specs/2026-03-25-superpowers-planning-unified-spec.md`。
- 官方使用手册 `README.md` 已就绪。
- **废弃并删除了包含错误历史状态（如 `session.compacted`）的过时交接文档。**
- 已补齐 Claude Code 原生 slash commands：`/spf`、`/spf:start`、`/spf:ready`，并将安装逻辑纳入 `install.ts`。
- 已修复 Bun 测试环境残留的 TypeScript 类型配置问题，`bun test` 与 `npx tsc --noEmit` 均可通过。
- 已将 Claude Code 的自动 Context 预警从“不存在的 Hook 注入”修正为真实可用的 `statusLine` 包装器方案，并兼容保留 `claude-hud` 输出。
- 已修复 SPF 锚点判定过早要求 spec/plan 的问题：`/spf:start` 完成后即可进入正常 Context 轻重提示流程，spec/plan 改为业务分析阶段的推荐锚点。
- 已确认当前缺口来自“编码阶段 Task 没有落到 `current.md`”与“主 Agent 未被强制要求按 Subagent-Driven Development 派发任务”。
- 已确认 `current.md` 必须只承接当前批次，历史批次应迁移到 `history.md` 并保留任务状态。
- 已确认 `history.md` 也是恢复锚点，缺失时 `/spf:ready` 必须视为锚点不完整。
- 已确认轻提示需要 3 秒自动关闭，重提示需要持续可见且直观显示百分比。
- 已确认代码实现阶段应优先并行派发 independent tasks，只有明确依赖才串行。
- 已确认 Claude Code 与 OpenCode 的主指令文件必须分流，Claude 看 `CLAUDE.md`，OpenCode 看 `AGENTS.md`。
- 已确认共享规则抽到 `PRINCIPLE.md` 后，`CLAUDE.md` 和 `AGENTS.md` 只保留薄适配入口。

## 8. 当前阻塞

- 无。

## 9. 活跃支线

- 无。

## 10. 下一步唯一动作

- 做一次 Claude Code 与 OpenCode 的交叉验证，确认同一项目能在两端无缝接力，并且共享规则都来自 `PRINCIPLE.md`。

## 11. 恢复提示

- Session 恢复时，请检查 `docs/planning/current.md` 和 `docs/planning/decisions.md` 的状态，并沿着“当前阶段”与“下一步唯一动作”继续推进。
