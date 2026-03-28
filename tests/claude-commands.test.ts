import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  CLAUDE_COMMAND_DEFINITIONS,
  getClaudeCommandInstallPaths,
  installClaudeCommands,
  renderClaudeCommandTemplate,
} from "../src/claude-commands";

const TEST_COMMANDS_DIR = path.join(__dirname, "__claude_commands__");

afterEach(() => {
  fs.rmSync(TEST_COMMANDS_DIR, { recursive: true, force: true });
});

describe("Claude command definitions", () => {
  it("should map nested command files to the expected slash commands", () => {
    expect(CLAUDE_COMMAND_DEFINITIONS).toHaveLength(3);
    expect(
      CLAUDE_COMMAND_DEFINITIONS.map((command) => command.slashCommand),
    ).toEqual(["/spf", "/spf:start", "/spf:ready"]);
    expect(
      CLAUDE_COMMAND_DEFINITIONS.map((command) => command.relativePath),
    ).toEqual([
      "spf.md",
      path.join("spf", "start.md"),
      path.join("spf", "ready.md"),
    ]);
  });

  it("should generate install targets inside ~/.claude/commands", () => {
    const targets = getClaudeCommandInstallPaths(
      "/Users/demo/.claude/commands",
    );

    expect(targets).toEqual([
      "/Users/demo/.claude/commands/spf.md",
      "/Users/demo/.claude/commands/spf/start.md",
      "/Users/demo/.claude/commands/spf/ready.md",
    ]);
  });
});

describe("Claude command templates", () => {
  it("should render the aggregate /spf command with help text", () => {
    const content = renderClaudeCommandTemplate(CLAUDE_COMMAND_DEFINITIONS[0]);

    expect(content).toContain(
      "description: 查看 superpowers planning 命令帮助",
    );
    expect(content).toContain("/spf:start");
    expect(content).toContain("/spf:ready 45");
    expect(content).toContain("PRINCIPLE.md");
    expect(content).toContain("CLAUDE.md");
  });

  it("should render the start command to run spf start", () => {
    const content = renderClaudeCommandTemplate(CLAUDE_COMMAND_DEFINITIONS[1]);

    expect(content).toContain("description: 初始化 planning 工作流文件");
    expect(content).toContain("Bash(spf start:*)");
    expect(content).toContain("`spf start claude-code`");
  });

  it("should render the ready command to require a percentage argument", () => {
    const content = renderClaudeCommandTemplate(CLAUDE_COMMAND_DEFINITIONS[2]);

    expect(content).toContain("argument-hint: <percentage>");
    expect(content).toContain("Bash(spf ready:*)");
    expect(content).toContain("$ARGUMENTS");
    expect(content).toContain("如果参数缺失或不是 0-100 的数字");
  });

  it("should install rendered command files into nested command directories", () => {
    const installedFiles = installClaudeCommands(TEST_COMMANDS_DIR);

    expect(installedFiles).toEqual([
      path.join(TEST_COMMANDS_DIR, "spf.md"),
      path.join(TEST_COMMANDS_DIR, "spf", "start.md"),
      path.join(TEST_COMMANDS_DIR, "spf", "ready.md"),
    ]);
    expect(
      fs.readFileSync(path.join(TEST_COMMANDS_DIR, "spf", "start.md"), "utf8"),
    ).toContain("spf start");
    expect(
      fs.readFileSync(path.join(TEST_COMMANDS_DIR, "spf", "ready.md"), "utf8"),
    ).toContain("spf ready $ARGUMENTS");
  });
});
