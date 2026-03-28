import fs from "node:fs";
import path from "node:path";
import {
  getClientInstructionFile,
  type ClientType,
} from "../utils/anchor-checker";

export const CURRENT_MD_TEMPLATE = `# 当前任务状态 (Current Planning)

## 1. 主目标
- [ ] 请在此处填写项目的核心业务目标。

## 2. 成功定义
- [ ] 请在此处填写判定主目标完成的具体可验收条件。

## 3. 非目标
- 请在此处填写当前阶段不需要做的事情，防止范围蔓延。

## 4. 当前阶段
- [ ] 需求分析与架构设计 (Spec & Plan)
- [ ] 核心代码开发
- [ ] 测试与验证

## 5. 编码阶段任务清单
- 先把 spec / plan 拆成可执行任务，再写到这里。
- 每个任务都标注状态，例如 \`[ ]\` / \`[•]\` / \`[✓]\`。
- 每次派发子 Agent 前，主 Agent 必须先更新这里，避免任务只留在聊天里。
- 当任务批次结束时，把整批任务迁移到 \`history.md\`，不要只搬单个 Task。

## 6. 子 Agent 执行协议
- 遇到可以独立完成的编码任务，优先采用 Subagent-Driven Development。
- 主 Agent 负责拆解、派发、回收结果和更新全局真相，子 Agent 只处理局部任务。
- 子 Agent 返回后，主 Agent 再更新 \`current.md\` 和 \`decisions.md\`。

## 7. 历史任务归档
- \`history.md\` 保存所有已迁移批次的任务列表，保留每个 Task 的状态和结论。
- current.md 只保留当前批次，历史批次一律移走。
- 迁移时保持 Superpowers Todo 风格：\`[✓]\` 完成，\`[ ]\` 未开始，\`[•]\` 进行中。

## 8. Todo 状态说明
- \`[✓]\` 代表完成
- \`[ ]\` 代表未开始
- \`[•]\` 代表正在执行

## 9. 当前正在做
- 初始化项目规划文件。

## 10. 已完成里程碑
- 无。

## 11. 当前阻塞
- 无。

## 12. 活跃支线
- 无。

## 13. 下一步唯一动作
- 明确并细化主目标和成功定义，然后把编码阶段任务按子 Agent 执行顺序写入上面的任务清单。

## 14. 恢复提示
- Session 恢复时，请检查此文件的状态，并沿着“当前阶段”与“下一步唯一动作”继续推进。
`;

export const HISTORY_MD_TEMPLATE = `# 历史任务归档 (Task History)

## 1. 归档规则
- 这里保存所有已经从 current.md 迁移出来的任务批次。
- 每个批次都要保留原始状态，至少包含 \`[✓]\`、\`[•]\` 和 \`[ ]\` 标记。
- 不要把历史批次继续留在 current.md。

## 2. 历史批次
- 无。
`;

export const DECISIONS_MD_TEMPLATE = `# 关键决策记录 (Decisions Log)

本文件用于记录项目开发过程中涉及架构设计、命名规范、技术选型或重大变更的最终决策。

## 决策历史

### [YYYY-MM-DD] 1. 初始化项目规范
- **决策内容**：启用 \`superpowers-planning-with-files\` 工作流，以 \`current.md\` 维护主线状态。
- **决策原因**：为了在多 Agent 协作和跨 Session 开发中保持一致的全局真相，防止任务偏航。
- **影响范围**：整个项目生命周期内，主 Agent 需遵守该规范进行读写。
`;

export const PRINCIPLE_MD_TEMPLATE = [
  "# PRINCIPLE.md",
  "",
  "这是 Claude Code 和 OpenCode 共用的规则层，只放稳定、不随项目进度变化的约束。",
  "",
  "## 规则",
  "",
  "- 共享规则只写一份，客户端入口只做薄适配。",
  "- 规划真相继续保留在 `docs/planning/current.md`、`docs/planning/history.md`、`docs/planning/decisions.md`。",
  "- 代码实现阶段的独立任务尽量并行派发。",
  "- 有明确前后依赖、决策依赖或产物依赖的任务必须串行。",
  "- Todo 状态统一使用 `[✓]`、`[•]`、`[ ]`。",
  "- `current.md` 只保留当前批次，历史批次移到 `history.md`。",
  "- 读取旧项目时，允许保留历史写法如 `[x]`、`[done]`、`[in_progress]`，但新写入统一使用 `[✓]`、`[•]`、`[ ]`。",
].join("\n");

const CLIENT_INSTRUCTION_TEMPLATES: Record<ClientType, string> = {
  "claude-code": [
    "# CLAUDE.md",
    "",
    "Claude Code 主指令入口。共享规则见 `PRINCIPLE.md`。",
    "",
    "## 客户端约束",
    "",
    "- Claude Code 侧默认读取 `CLAUDE.md`。",
    "- 共享规则来自 `PRINCIPLE.md`。",
    "- 规划真相统一写在 `docs/planning/current.md`、`docs/planning/history.md` 和 `docs/planning/decisions.md`。",
    "- 读取旧项目时，允许保留历史写法如 [x]、[done]、[in_progress]，但新写入统一使用 [✓]、[•]、[ ]。",
  ].join("\n"),
  opencode: [
    "# AGENTS.md",
    "",
    "OpenCode 主指令入口。共享规则见 `PRINCIPLE.md`。",
    "",
    "## 客户端约束",
    "",
    "- OpenCode 侧默认读取 `AGENTS.md`。",
    "- 共享规则来自 `PRINCIPLE.md`。",
    "- 规划真相统一写在 `docs/planning/current.md`、`docs/planning/history.md` 和 `docs/planning/decisions.md`。",
    "- 读取旧项目时，允许保留历史写法如 [x]、[done]、[in_progress]，但新写入统一使用 [✓]、[•]、[ ]。",
  ].join("\n"),
};

/**
 * 执行 /spf-start 逻辑，初始化 planning 工作区
 * @param cwd 项目根目录
 * @returns 提示信息，表明创建结果或文件已存在
 */
export function runSpfStart(
  cwd: string,
  clientType: ClientType = "claude-code",
): string {
  const planningDir = path.join(cwd, "docs", "planning");
  const principlePath = path.join(cwd, "PRINCIPLE.md");
  const currentPath = path.join(planningDir, "current.md");
  const historyPath = path.join(planningDir, "history.md");
  const decisionsPath = path.join(planningDir, "decisions.md");
  const clientInstructionFile = getClientInstructionFile(clientType);
  const clientInstructionPath = path.join(cwd, clientInstructionFile);

  let output = "";

  if (fs.existsSync(clientInstructionPath)) {
    output += `已检测到 ${clientInstructionFile}。\n`;
  } else {
    fs.writeFileSync(
      clientInstructionPath,
      CLIENT_INSTRUCTION_TEMPLATES[clientType],
      "utf8",
    );
    output += `已初始化 ${clientInstructionFile}。\n`;
  }

  if (!fs.existsSync(principlePath)) {
    fs.writeFileSync(principlePath, PRINCIPLE_MD_TEMPLATE, "utf8");
    output += "已初始化 PRINCIPLE.md。\n";
  } else {
    output += "PRINCIPLE.md 已存在，跳过初始化。\n";
  }

  if (!fs.existsSync(planningDir)) {
    fs.mkdirSync(planningDir, { recursive: true });
    output += "已创建 docs/planning/ 目录。\n";
  }

  if (!fs.existsSync(currentPath)) {
    fs.writeFileSync(currentPath, CURRENT_MD_TEMPLATE, "utf8");
    output += "已初始化 current.md。\n";
  } else {
    output += "current.md 已存在，跳过初始化。\n";
  }

  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, HISTORY_MD_TEMPLATE, "utf8");
    output += "已初始化 history.md。\n";
  } else {
    output += "history.md 已存在，跳过初始化。\n";
  }

  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, DECISIONS_MD_TEMPLATE, "utf8");
    output += "已初始化 decisions.md。\n";
  } else {
    output += "decisions.md 已存在，跳过初始化。\n";
  }

  return output.trim();
}
