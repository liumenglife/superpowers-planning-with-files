import fs from "node:fs";
import path from "node:path";

export interface ClaudeCommandDefinition {
  slashCommand: "/spf" | "/spf:start" | "/spf:ready";
  relativePath: string;
  description: string;
  argumentHint?: string;
  allowedTools: string[];
  body: string;
}

export const CLAUDE_COMMAND_DEFINITIONS: ClaudeCommandDefinition[] = [
  {
    slashCommand: "/spf",
    relativePath: "spf.md",
    description: "查看 superpowers planning 命令帮助",
    allowedTools: [],
    body: [
      "你正在执行 superpowers-planning-with-files 的 Claude Code 聚合命令。",
      "",
      "请直接告诉用户当前可用命令：",
      "- `/spf:start`：初始化 `PRINCIPLE.md`、`CLAUDE.md` 与 `docs/planning/current.md`、`docs/planning/history.md`、`docs/planning/decisions.md`。",
      "- `/spf:ready 45`：按给定上下文百分比检查是否该切 Session。",
      "- `/spf ready 45`：与 `/spf:ready 45` 等价。",
      "",
      "不要调用任何工具。只输出简洁帮助。",
    ].join("\n"),
  },
  {
    slashCommand: "/spf:start",
    relativePath: path.join("spf", "start.md"),
    description: "初始化 planning 工作流文件",
    allowedTools: ["Bash(spf start:*)"],
    body: [
      "使用 Bash 工具在当前工作目录执行 `spf start claude-code`。",
      "",
      "要求：",
      "1. 不要询问用户是否继续。",
      "2. 执行后用简体中文简洁总结结果。",
      "3. 如果命令失败，明确说明失败原因，并给出最小必要的下一步。",
    ].join("\n"),
  },
  {
    slashCommand: "/spf:ready",
    relativePath: path.join("spf", "ready.md"),
    description: "检查当前项目是否适合切换 Session",
    argumentHint: "<percentage>",
    allowedTools: ["Bash(spf ready:*)"],
    body: [
      "你正在执行 `/spf:ready`。用户传入的原始参数是：`$ARGUMENTS`。",
      "",
      "要求：",
      "1. 如果参数缺失或不是 0-100 的数字，不要调用工具，直接告诉用户正确用法：`/spf:ready <percentage>`。",
      "2. 如果参数有效，使用 Bash 工具在当前工作目录执行 `spf ready $ARGUMENTS`。",
      "3. 用简体中文总结检查结果。",
    ].join("\n"),
  },
];

export function getClaudeCommandInstallPaths(commandsDir: string): string[] {
  return CLAUDE_COMMAND_DEFINITIONS.map((command) =>
    path.join(commandsDir, command.relativePath),
  );
}

export function renderClaudeCommandTemplate(
  command: ClaudeCommandDefinition,
): string {
  const frontmatter = [
    "---",
    `description: ${command.description}`,
    ...(command.argumentHint ? [`argument-hint: ${command.argumentHint}`] : []),
    ...(command.allowedTools.length > 0
      ? [`allowed-tools: [${command.allowedTools.join(", ")}]`]
      : []),
    "---",
    "",
  ].join("\n");

  return `${frontmatter}${command.body}\n`;
}

export function installClaudeCommands(commandsDir: string): string[] {
  const installedFiles: string[] = [];

  for (const command of CLAUDE_COMMAND_DEFINITIONS) {
    const targetPath = path.join(commandsDir, command.relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, renderClaudeCommandTemplate(command), "utf8");
    installedFiles.push(targetPath);
  }

  return installedFiles;
}
