# Superpowers Planning With Files

## Overview

这个 skill 约束主 Agent 在进入项目型开发流程时，把主线状态落到文件，而不是只依赖会话上下文。

核心原则：

- 主 Agent 是唯一全局状态维护者
- planning 文件记录主线真相
- 子 agent 只执行局部任务，不改写全局真相
- 编码阶段必须采用 Subagent-Driven Development，先记录任务，再派发执行

## When to Use

以下场景默认使用：

- 进入项目型开发
- 需要 spec、plan、实现、验证、收尾等多阶段推进
- 需要分发子 agent
- 可能插入临时支线任务
- 需要跨天或跨会话恢复工作

以下场景通常不需要：

- 纯问答
- 一次性极小改动且不进入项目开发流

## Core Rules

- 继续执行前，先读 `docs/planning/current.md` 和 `docs/planning/decisions.md`
- 如果这些文件不存在，必须先调用终端命令 `spf start` 进行初始化
- 用户新增输入后，先分类：主线推进 / 临时支线 / 全新任务
- 临时支线只能登记在“活跃支线”，不得覆盖主目标与成功定义
- 任意时刻只能有一个“下一步唯一动作”
- 进入编码阶段后，主 Agent 必须先把任务拆开写入 `docs/planning/current.md` 的“编码阶段任务清单”，再派发子 Agent
- 对于可独立完成的实现任务，优先使用一个新 subagent 执行，主 Agent 负责收口、回写和复盘
- 进入代码实现阶段后，只要 Task 之间没有明确前后依赖，主 Agent 就应优先并行派发多个 subagent，而不是全部串行
- 需求分析、方案设计、代码实现、验证这类有明确先后关系的阶段，仍然按顺序推进，不要强行并行
- current.md 只保存当前批次的任务列表，历史批次必须迁移到 `docs/planning/history.md`
- current.md 和 history.md 都要保留任务状态标记，至少区分 `[✓]`、`[•]`、`[ ]`
- 任务批次迁移流程：当前批次收口后，整批移到 history.md，再在 current.md 写入新批次，不要只搬单个 Todo
- `history.md` 也是恢复锚点，缺失时 `/spf-ready` 必须判定为不完整
- 关键决策确认后，必须写入 `docs/planning/decisions.md`
- 子 agent 结果先回传给主 Agent，再由主 Agent 更新全局状态

## Context & Anchor Enforcement (重要！)

在运行过程中，如果你收到类似 `【系统拦截与紧急指令】` 或 `【系统状态通知】` 的 Hook 注入文本，你必须：

1. **最高优先级处理**：立刻停止编写业务代码！
2. **分类强视觉反馈**：在你面向人类终端的下一次回复中，**必须**严格遵循系统指令的前缀要求（代替终端色彩高亮），并将情况告知人类：
   - 遇到锚点缺失拦截时：**不要给人类发送红色警告**，请你直接使用文件写入工具或调用 `spf start` 命令，**静默在后台为项目创建并补齐缺失的 `current.md` 等规划文件**，补齐后即可继续正常回答人类的问题。

- 遇到 Context 重提示时：以 `🔴 **[严重警告：上下文告急]**` 开头。
- 遇到 Context 轻提示时：以 `🟡 **[温馨提示：建议清理上下文]**` 开头，并让提示在 3 秒后自动消失。

3. 如果提示“上下文即将触发压缩”或“考虑执行 /clear”，请严格遵循系统的建议：**建议人类执行 `/clear` 清除当前上下文（Claude Code 环境），或执行 `/new` 切换到全新的 Session（OpenCode 环境）**。

## File Responsibilities

### `docs/planning/current.md`

至少包含：主目标、成功定义、非目标、当前阶段、编码阶段任务清单、子 Agent 执行协议、当前正在做、已完成里程碑、当前阻塞、活跃支线、下一步唯一动作、恢复提示。

### `docs/planning/history.md`

至少包含：历史任务批次、每个批次的任务列表、任务状态标记、迁移说明。它也是恢复锚点。

### `Todo` 状态约定

- `\[✓\]`：完成
- `\[\ ]`：未开始
- `\[•\]`：正在执行

### `docs/planning/decisions.md`

每条记录至少包含：日期、决策内容、决策原因、影响范围。

## Common Mistakes

- 只更新 todo，不更新 planning 文件
- 支线任务逐渐接管主线
- 同时保留多个“下一步唯一动作”
- 决策只停留在聊天记录里
- 子 agent 擅自修改全局状态
- 编码阶段任务只在聊天里分发，不回写到 `current.md`
- 主 Agent 本可以拆给子 Agent 的实现任务，却自己直接动手写
- 代码实现阶段把所有 Task 都排成串行，浪费并行 subagent 能力
- 收到 Context 警告时依然强行写代码，而拒绝执行清理上下文动作（未执行 `/clear` 或未切换新 Session）
