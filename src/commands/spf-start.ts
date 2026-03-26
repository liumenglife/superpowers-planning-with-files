import fs from 'node:fs';
import path from 'node:path';

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

## 5. 当前正在做
- 初始化项目规划文件。

## 6. 已完成里程碑
- 无。

## 7. 当前阻塞
- 无。

## 8. 活跃支线
- 无。

## 9. 下一步唯一动作
- 明确并细化主目标和成功定义。

## 10. 恢复提示
- Session 恢复时，请检查此文件的状态，并沿着“当前阶段”与“下一步唯一动作”继续推进。
`;

export const DECISIONS_MD_TEMPLATE = `# 关键决策记录 (Decisions Log)

本文件用于记录项目开发过程中涉及架构设计、命名规范、技术选型或重大变更的最终决策。

## 决策历史

### [YYYY-MM-DD] 1. 初始化项目规范
- **决策内容**：启用 \`superpowers-planning-with-files\` 工作流，以 \`current.md\` 维护主线状态。
- **决策原因**：为了在多 Agent 协作和跨 Session 开发中保持一致的全局真相，防止任务偏航。
- **影响范围**：整个项目生命周期内，主 Agent 需遵守该规范进行读写。
`;

/**
 * 执行 /spf-start 逻辑，初始化 planning 工作区
 * @param cwd 项目根目录
 * @returns 提示信息，表明创建结果或文件已存在
 */
export function runSpfStart(cwd: string): string {
  const planningDir = path.join(cwd, 'docs', 'planning');
  const currentPath = path.join(planningDir, 'current.md');
  const decisionsPath = path.join(planningDir, 'decisions.md');

  let output = '';

  if (!fs.existsSync(planningDir)) {
    fs.mkdirSync(planningDir, { recursive: true });
    output += '已创建 docs/planning/ 目录。\n';
  }

  if (!fs.existsSync(currentPath)) {
    fs.writeFileSync(currentPath, CURRENT_MD_TEMPLATE, 'utf8');
    output += '已初始化 current.md。\n';
  } else {
    output += 'current.md 已存在，跳过初始化。\n';
  }

  if (!fs.existsSync(decisionsPath)) {
    fs.writeFileSync(decisionsPath, DECISIONS_MD_TEMPLATE, 'utf8');
    output += '已初始化 decisions.md。\n';
  } else {
    output += 'decisions.md 已存在，跳过初始化。\n';
  }

  return output.trim();
}
