# Claude Code 版 `superpowers-planning-with-files` 开发计划 (Plan)

## 第一阶段：初始化开发目录与结构 (Phase 1)

- [ ] 在仓库根目录建立 `src/` 源码目录。
- [ ] 划分 `src/skills/`, `src/commands/`, `src/hooks/`, `src/utils/` 四大核心模块。
- [ ] 配置 `package.json` 中的 `scripts` (build, test, lint, format)。
- [ ] 确保 TypeScript 编译选项支持 ESM (`tsconfig.json`)。

## 第二阶段：核心工具与判定逻辑开发 (Phase 2)

- [ ] 编写 `src/utils/anchor-checker.ts`：实现检查 `spec`, `plan`, `current.md`, `decisions.md` 的逻辑。
- [ ] 编写 `src/utils/context-monitor.ts`：实现对 Claude Code 原生上下文数据的读取和使用率判断（`< 40%`, `40% ~ 50%`, `>= 51%`）。
- [ ] 为以上工具编写单元测试 (`tests/utils.test.ts`)，使用 mock 数据模拟文件存在性和不同阈值的 context 百分比。

## 第三阶段：Command 与 Hook 逻辑注入 (Phase 3)

- [ ] 编写 `src/commands/spf-start.ts`：负责一键初始化项目管理文件模板。
- [ ] 编写 `src/commands/spf-ready.ts`：用户手动执行时检查是否适合切 Session。
- [ ] 编写 `src/hooks/planning-context-hook.ts`：利用 Claude Code 的钩子机制，自动在特定时机拦截执行，注入前置锚点校验与后置的轻/重提示警告。

## 第四阶段：整合打包与说明文件更新 (Phase 4)

- [ ] 将编译结果或插件加载脚本整理在根目录的 `bin/` 或对应的出口文件夹中。
- [ ] 更新 `README.md` 与 `AGENTS.md` 中对应的命令和插件安装步骤。
- [ ] 运行完整的端到端测试，验证 Hook 是否能正确干预输出。
- [ ] 将编码阶段的 Task 记录协议写入 `current.md` / `SKILL.md` / 说明文档，明确主 Agent 必须先拆任务再派发子 Agent。
- [ ] 增加 `history.md` 归档机制，确保 current/history 都保留 Task 状态标记。
