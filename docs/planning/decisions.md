# 关键决策记录 (Decisions Log)

本文件用于记录此独立工作区内任何涉及架构设计、命名规范、技术选型或重大变更的最终决策。

## 决策历史

### [2026-03-27] 13. 共享规则收敛到 `PRINCIPLE.md`，客户端入口只保留薄适配

- **决策内容**：把 Claude Code 与 OpenCode 共用的稳定规则抽到 `PRINCIPLE.md`，`CLAUDE.md` 和 `AGENTS.md` 只保留客户端入口与引用说明。规划真相仍然留在 `current.md`、`history.md` 和 `decisions.md`。
- **决策原因**：共享规则放一份最省 token，也最不容易漂移。入口文件越薄，跨客户端切换越稳，后续维护时也更容易判断哪些是规则，哪些是项目状态。
- **影响范围**：`PRINCIPLE.md`、`CLAUDE.md`、`AGENTS.md`、`src/commands/spf-start.ts`、`README.md`、`docs/planning/*` 和相关测试。

### [2026-03-27] 12. `/spf:start` 会为当前客户端初始化对应的主指令文件，保证 Claude/OpenCode 可无缝切换

- **决策内容**：在 Claude Code 侧执行 `/spf:start` 时，若缺少 `CLAUDE.md` 就自动生成一份；在 OpenCode 侧执行时，若缺少 `AGENTS.md` 就自动生成一份。这样同一个项目在两个客户端之间切换时，不需要重新起草新的入口说明。
- **决策原因**：如果切换客户端时还要人手补主指令文件，状态就不是真的无缝。让 `/spf:start` 自己补齐对应的客户端入口文件，才能保证项目的 planning 真相和客户端入口一起落地。
- **影响范围**：`src/commands/spf-start.ts`、`CLAUDE.md`、`AGENTS.md`、`tests/spf-start.test.ts` 以及 README 中的安装和使用说明。

### [2026-03-27] 11. Claude Code 与 OpenCode 的主指令文件分流，Claude 看 `CLAUDE.md`，OpenCode 看 `AGENTS.md`

- **决策内容**：`/spf:start` 和 `/spf-ready` 在检测项目主指令文件时按客户端分流，Claude Code 侧默认检查 `CLAUDE.md`，OpenCode 侧默认检查 `AGENTS.md`。它们都只是恢复锚点中的“环境说明”部分，不和 planning 文件混在一起。
- **决策原因**：Claude Code 和 OpenCode 的工作方式不同，主指令文件也不该混用。把它们分开后，Claude 侧不会再误看 `AGENTS.md`，OpenCode 侧也不会被 Claude 的文件名污染，路径清楚，心智也清楚。
- **影响范围**：`src/utils/anchor-checker.ts`、`src/commands/spf-start.ts`、`src/commands/spf-ready.ts`、`bin/spf.ts`、`src/claude-commands.ts`、README 与测试。

### [2026-03-27] 10. 代码实现阶段的独立 Task 应优先并行派发 subagent

- **决策内容**：将并行优先规则收敛到“代码实现阶段”。在该阶段，如果多个 Task 之间没有明确的前后依赖，主 Agent 应尽量并行派发多个 subagent；只有存在语义依赖、产物依赖或明确的顺序约束时才串行推进。
- **决策原因**：代码实现阶段通常已经完成了需求澄清和方案确认，不再需要频繁与用户交互。这个阶段最贵的不是写代码本身，而是把能并行的活排成队。把规则收束到代码实现阶段，既不会误伤前期分析，也能把真正需要速度的地方提上来。
- **影响范围**：`src/skills/SKILL.md`、`docs/planning/current.md`、`README.md` 以及后续所有围绕实现阶段的 Task 派发策略。

### [2026-03-27] 9. 轻提示采用 3 秒自动关闭的 Mac alert，重提示保持可见并保留百分比

- **决策内容**：轻提示不再依赖不稳定的 notification banner，而是直接使用 macOS alert，并设置 `giving up after 3` 自动关闭；重提示继续使用更强的 alert 形态保持可见。两者都必须明确带出当前上下文使用百分比。
- **决策原因**：在这台 Mac 上，纯 banner 容易被系统设置吞掉，用户看不到就等于没发。把轻提示做成 3 秒自动关闭的 alert，既保留了“轻”的节奏，又能保证 builder 真的看见数字和动作。
- **影响范围**：`bin/spf-statusline.ts`、`src/claude-statusline.ts`、相关测试，以及未来任何 status line 提示文案。

### [2026-03-27] 8. `history.md` 进入恢复锚点集合，`/spf:ready` 必须检查它

- **决策内容**：`docs/planning/history.md` 从普通归档文件升级为恢复锚点之一，`/spf:ready` 和 `checkRecoveryAnchors` 在判断项目是否可以安全切 Session 时必须把它纳入硬性检查；缺失时视为锚点不完整。
- **决策原因**：`history.md` 里保存的是上一批任务的真实收口结果，它直接决定 `/clear` 之后能不能迅速恢复到正确的执行状态。把它排除在外，会让系统只看见 current.md 的当下，却看不见上一批已经跑到哪一步，恢复质量会掉。
- **影响范围**：`src/utils/anchor-checker.ts`、`src/commands/spf-ready.ts`、`src/skills/SKILL.md`、`README.md` 以及所有后续项目的 planning 文件结构。

### [2026-03-27] 7. Todo 状态统一采用 `[✓]` / `[•]` / `[ ]`，并同时写入 current/history

- **决策内容**：`current.md` 与 `history.md` 中的 Task list 统一采用 Superpowers Todo 风格：`[✓]` 代表完成，`[ ]` 代表未开始，`[•]` 代表正在执行。Task 列表必须以批次为单位维护，迁移时保留状态，不再只记录单个 Task。
- **决策原因**：这种写法和 Superpowers 的生成风格一致，读起来最直观，也最适合主 Agent 在推进中快速更新。用同一套符号同时写 current/history，能让当前视图和历史视图保持一致，避免维护两种状态语义。
- **影响范围**：`src/commands/spf-start.ts`、`src/skills/SKILL.md`、`docs/planning/current.md`、`docs/planning/history.md`、`README.md` 与相关测试都要同步使用同一套 Todo 状态。

### [2026-03-27] 6. Task 列表必须同时支持 current.md 当前批次与 history.md 历史批次

- **决策内容**：`current.md` 只保留当前正在推进的 Task 批次，历史批次必须整体迁移到 `history.md`；两者都必须保留每个 Task 的状态标记（`[✓]`、`[•]`、`[ ]`），而不是只记录单个 Task。
- **决策原因**：仅保留单份列表会让主 Agent 在批次推进后继续停留在过期视图里，`/clear` 后也会失去任务迁移的边界。拆成 current/history 后，当前视图保持干净，历史视图保留完整链路，恢复时也更容易判断“现在该做什么”和“之前做过什么”。
- **影响范围**：`src/commands/spf-start.ts` 的模板、`src/skills/SKILL.md` 的约束、`README.md` 的说明，以及所有后续项目的 `docs/planning/current.md` / `history.md` 结构都要同步承接。

### [2026-03-27] 5. 编码阶段的 Task 分解必须回写到 `current.md`，并默认采用 Subagent-Driven Development

- **决策内容**：进入编码阶段后，主 Agent 不能只把任务留在聊天里，必须先把 spec / plan 派生出的可执行 Task 写入 `docs/planning/current.md` 的“编码阶段任务清单”，再按 Subagent-Driven Development 的流程派发一个新 subagent 执行每个独立任务。子 Agent 完成后，主 Agent 负责回写状态、更新里程碑和必要决策。
- **决策原因**：当前缺口的根源不是“忘了写一条提醒”，而是工作流没有强制把 Task 记录和执行分离。没有这层落盘约束，主 Agent 很容易在编码阶段直接自己开写，既破坏 SPF 的设计初衷，也会让 `/clear` 之后的恢复失去任务上下文。
- **影响范围**：`src/commands/spf-start.ts` 的模板、`src/skills/SKILL.md` 的行为规范、`README.md` 的使用说明，以及所有后续项目的 `docs/planning/current.md` 结构都需要同步承接这一约束。

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
