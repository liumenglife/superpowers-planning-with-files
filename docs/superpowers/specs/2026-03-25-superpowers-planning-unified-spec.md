# Superpowers Planning With Files - 统一架构设计规范 (Unified Spec)

**日期**：2026-03-25  
**适用平台**：Claude Code, OpenCode  
**核心定位**：以 Superpowers 为核心开发流程的自动化上下文防偏航管理增强插件（依赖并服务于 Superpowers 核心工作流，非独立存在）

---

## 1. 业务背景与目标

在大语言模型 (LLM) 驱动的长周期复杂项目开发中，极易出现两类致命问题：

1. **全局目标漂移**：大模型被临时支线任务吸引，忘记或篡改了原始主线目标。
2. **上下文压缩与幻觉 (Context Compaction Hallucination)**：当 Token 消耗接近模型物理上限的 50%~80% 时，底层引擎会触发历史记忆压缩，导致大模型突然“失忆”，强行编造不存在的代码架构。

**本项目的核心目标：**
强制推行 **"Planning With Files"** 工作流。剥夺大模型对“主线状态”的记忆依赖，强制其将项目状态（`current.md`）和关键决策（`decisions.md`）物理落盘。同时，提供一套跨平台的**双重防线校验引擎**，在上下文爆炸前及时阻断开发，强制其通过换桶（切 Session）来恢复健康状态。

---

## 2. 核心系统架构

整个工具箱采用 **"一核两翼"** 的架构设计：以 TypeScript 编写的无状态 CLI（`spf`）作为规则计算核心，通过解耦的适配层分别向 Claude Code 和 OpenCode 提供原生拦截能力。

### 2.1 双重防线校验引擎 (核心逻辑)

不论在哪个平台，核心的判断逻辑都收敛在 `src/commands/spf-ready.ts` 和 `src/hooks/planning-context-hook.ts` 中。

- **第一重防线：恢复锚点绝对校验 (Anchor Check)**
  - **触发条件**：任何一次状态检查。
  - **校验规则**：必须同时存在 `docs/planning/current.md`、`docs/planning/decisions.md`，以及至少一个位于 `docs/superpowers/specs/` 或 `plans/` 下的设计文档。
  - **拦截动作**：若不满足，无论当前 Context 占用多低，系统一律返回 `【系统拦截与紧急指令】`，直接阻断当前代码编写任务，强制大模型优先补齐锚点。
- **第二重防线：上下文水位渐进预警 (Context Monitor)**
  - **触发条件**：第一重防线校验通过后。
  - **校验规则**：基于当前传入的 `percentage`（0-100）。
    - `< 40%`：**健康 (Normal)**。静默放行，无任何系统干扰。
    - `40% ~ 50%`：**轻度预警 (Soft Warning)**。返回 `【系统状态通知】`，建议适时执行 `/clear` 或 `/new`。
    - `>= 51%`：**重度危险 (Hard Warning)**。返回鲜红的紧急警告，强制建议立即切断当前 Session，防止触发底层压缩机制。

### 2.2 CLI 物理执行器 (`bin/spf.ts`)

全局注册的二进制入口，供开发者手动探查或供第三方插件以子进程 (`child_process`) 方式调用。

- `spf start`：幂等地初始化基础目录和 Markdown 模板。
- `spf ready <%> [client]`：面向人类的 TUI 终端输出。
- `spf hook <%> [client]`：纯粹的后台拦截文本输出，不达预警阈值时输出为空。

---

## 3. Claude Code 适配层设计 (深度原生集成)

Claude Code 作为本增强插件的重要核心引擎（“左翼”），其适配层设计必须具备同等的自动化深度。

### 3.1 技能与心智注入 (Skill Injection)

- **部署机制**：安装脚本会将完整的项目级规划法则（`SKILL.md`）精准拷贝至系统全局目录 `~/.claude/skills/superpowers-planning-with-files/SKILL.md`。
- **作用**：在底层构建大模型的“思想钢印”，明确定义了它无权篡改主目标，且必须在面临 Hook 警告时执行绝对的顺从机制（立即切 Session 或补齐文件）。

### 3.2 生命周期自动监控 (Lifecycle Hook Integration)

- **非手动依赖**：这套防御系统**绝不依赖**大模型或人类手动执行 `/spf-ready` 去探查状态。
- **能力边界修正**：Claude Code 原生 Hook 的 stdin 当前不提供 `context_window.used_percentage`，因此 Hook 无法像 OpenCode 一样直接基于真实 Context 百分比做自动注入提醒。
- **自动化提示实现**：Claude Code 侧改由 `statusLine` 包装器读取原生 stdin 中的 `context_window.used_percentage`，在每一轮刷新时显示 SPF 的 40%/51% 轻重提示；CLI `spf hook <当前Token使用率> claude-code` 继续保留给手动或其他外部链路调用。
- **交互效果**：当 status line 检测到 40%~50% 水位时显示轻提示，`>= 51%` 时显示重提示；缺失 `current.md` / `decisions.md` 时显示初始化阻断提示。这样既保留 Claude HUD 等现有状态栏能力，也能让人类开发者看到 SPF 告警。

### 3.3 工具层挂载 (Commands)

- **部署目录**：安装脚本会将命令模板写入 `~/.claude/commands/`，其中 `spf.md` 映射为 `/spf`，`spf/start.md` 映射为 `/spf:start`，`spf/ready.md` 映射为 `/spf:ready`。
- **`/spf`**：聚合帮助入口，用于向开发者展示当前支持的 planning 命令及参数格式。
- **`/spf:start`**：作为主动型工具提供给大模型调用，用于在一片空白的工程中快速拉起 `docs/planning` 基建防线；底层复用 `spf start` CLI。
- **`/spf:ready <percentage>`**：作为开发者的人工核查探针，用于手动审计当前项目的真实生命体征（Context + 文件完整度）；底层复用 `spf ready <percentage> claude-code` 的同一套判断核心。

### 3.4 编码阶段协作协议 (Subagent-Driven Development)

- 一旦进入编码阶段，主 Agent 必须先把任务拆解成可执行 Task，并写回 `docs/planning/current.md`，再派发新 subagent 执行。
- 子 Agent 只负责局部实现，不直接修改全局规划状态。
- 子 Agent 回传结果后，主 Agent 再统一更新 `current.md`、`decisions.md` 和下一步唯一动作。
- `current.md` 只保留当前批次，历史批次必须整体迁移到 `docs/planning/history.md`。
- `history.md` 需要保留每个 Task 的状态标记，至少区分 `[✓]`、`[•]`、`[ ]`。

---

## 4. OpenCode 适配层设计 (深度原生集成)

作为统一架构的“右翼”，OpenCode 的适配必须达到与 Claude Code 一致的自动化高度。

### 4.1 技能文件同步 (Skill Injection)

- 与 Claude Code 相同，本项目的安装流会将 `SKILL.md` 同步拷贝至 `~/.config/opencode/skills/superpowers-planning-with-files/SKILL.md`，保障双端在执行“Superpowers”心智时的一致性。

### 4.2 100% 精准的 Token 提取算法

废弃了早期基于 `session.compacted` 的滞后预警，改为通过 OpenCode 注入的 `client` (SDK 实例) 实时还原官方 TUI 的运算逻辑：

1. **获取历史**：调用 `await client.session.messages({ sessionID })` 抓取全局上下文。
2. **提取耗损**：找到数组中最后一条由 `assistant` 发出且产生过 `output` tokens 的消息记录。将其记录的 `input + output + reasoning + cache.read + cache.write` 累加，得到最精确的实际消耗数。
3. **动态获取模型上限**：
   - 在 `message.created` 事件中：通过 `await client.provider.list()` 查询对应 `providerID` 和 `modelID` 下的 `limit.context`。
   - 在 `experimental.chat.system.transform` 钩子中：直接通过 `input.model.limit.context` 以零网络开销获取上限。
4. **生成百分比**：`Math.round((总消耗 / 动态上限) * 100)`。

### 4.2 双端协同与系统级拦截

1. 将计算出的百分比无缝对接至全局 CLI：`$ spf hook ${percentage} opencode`。
2. **静默篡改 System Prompt**：在 `transform` 钩子中，将 `spf hook` 返回的严厉警告直接 Push 进 `output.system`，迫使大模型产生强烈的顺从机制（“看到红字立刻停手”）。
3. **系统通知**：利用 `osascript` 唤起 macOS 原生的 `display notification`，向坐在屏幕前的人类开发者发出越权警报。

---

## 5. 源码目录与模块边界

```text
superpowers-planning-with-files/
├── bin/
│   └── spf.ts                     # CLI 入口
├── src/
│   ├── commands/
│   │   ├── spf-start.ts           # 模板初始化逻辑
│   │   └── spf-ready.ts           # 双重校验逻辑装配
│   ├── hooks/
│   │   └── planning-context-hook.ts # 屏蔽副作用的纯净判断逻辑
│   ├── plugins/
│   │   └── opencode-superpowers-planning.js # 双端拦截与底层计算适配层插件
│   ├── skills/
│   │   ├── SKILL.md               # Claude Code & OpenCode 共用的核心心智模型与操作防线规范
│   │   └── EXAMPLE.md             # 供双端参考的 current.md/decisions.md 生成示例
│   └── utils/
│       ├── anchor-checker.ts      # 文件是否齐全的断言工具
│       └── context-monitor.ts     # 40%/50% 水位线的数学映射工具
├── tests/                         # 基于 Bun Test 的单元测试
├── install.ts                     # 三位一体自动部署脚本
└── README.md
```

## 6. 未来演进与优化方向

1. **GUI 报表集成**：后续可考虑在 OpenCode 中注册一个专属的 TUI 侧边栏面板，将 `current.md` 的核心内容（主目标、下一步）以可视化 React 组件呈现，替代纯文本阅读。
2. **Git Hook 联动**：在执行 `git commit` 或 `git push` 前，拦截器可调用 `spf ready`，若发现代码已经偏离 `current.md` 的主线目标，抛出二次确认警报。
3. **动态阈值配置**：目前 40% 和 50% 阈值为硬编码，未来可通过读取项目根目录的 `opencode.json` 或 `.clauderc` 实现开发者自定义预警敏感度。
