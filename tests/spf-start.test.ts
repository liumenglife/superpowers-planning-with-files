import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  runSpfStart,
  CURRENT_MD_TEMPLATE,
  HISTORY_MD_TEMPLATE,
  DECISIONS_MD_TEMPLATE,
} from "../src/commands/spf-start";

describe("Command: /spf-start", () => {
  const TEST_DIR = path.join(__dirname, "__test_workspace_start__");

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should initialize planning files when they do not exist", () => {
    const result = runSpfStart(TEST_DIR);

    expect(result).toContain("已创建 docs/planning/ 目录");
    expect(result).toContain("已初始化 PRINCIPLE.md");
    expect(result).toContain("已初始化 CLAUDE.md");
    expect(result).toContain("已初始化 current.md");
    expect(result).toContain("已初始化 history.md");
    expect(result).toContain("已初始化 decisions.md");

    const principleContent = fs.readFileSync(
      path.join(TEST_DIR, "PRINCIPLE.md"),
      "utf8",
    );
    const claudeContent = fs.readFileSync(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf8",
    );
    const currentContent = fs.readFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "utf8",
    );
    const decisionsContent = fs.readFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "utf8",
    );
    const historyContent = fs.readFileSync(
      path.join(TEST_DIR, "docs", "planning", "history.md"),
      "utf8",
    );

    expect(principleContent).toContain("共享规则");
    expect(claudeContent).toContain("Claude Code");
    expect(currentContent).toBe(CURRENT_MD_TEMPLATE);
    expect(historyContent).toBe(HISTORY_MD_TEMPLATE);
    expect(decisionsContent).toBe(DECISIONS_MD_TEMPLATE);
  });

  it("should include a coding task list and subagent workflow guidance in the template", () => {
    expect(CURRENT_MD_TEMPLATE).toContain("编码阶段任务清单");
    expect(CURRENT_MD_TEMPLATE).toContain("Subagent-Driven Development");
    expect(CURRENT_MD_TEMPLATE).toContain("子 Agent");
    expect(CURRENT_MD_TEMPLATE).toContain("[✓]");
    expect(CURRENT_MD_TEMPLATE).toContain("[•]");
    expect(CURRENT_MD_TEMPLATE).toContain("[ ]");
  });

  it("should include a history template that keeps task statuses", () => {
    expect(HISTORY_MD_TEMPLATE).toContain("历史任务归档");
    expect(HISTORY_MD_TEMPLATE).toContain("[✓]");
    expect(HISTORY_MD_TEMPLATE).toContain("[•]");
    expect(HISTORY_MD_TEMPLATE).toContain("[ ]");
  });

  it("should not overwrite existing planning files", () => {
    // 预先创建文件
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "PRINCIPLE.md"),
      "# Existing Principle",
    );
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Existing Claude");
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Existing Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Existing Decisions",
    );

    const result = runSpfStart(TEST_DIR);

    expect(result).toContain("PRINCIPLE.md 已存在，跳过初始化");
    expect(result).toContain("已检测到 CLAUDE.md");
    expect(result).toContain("current.md 已存在，跳过初始化");
    expect(result).toContain("decisions.md 已存在，跳过初始化");

    const principleContent = fs.readFileSync(
      path.join(TEST_DIR, "PRINCIPLE.md"),
      "utf8",
    );
    const currentContent = fs.readFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "utf8",
    );
    expect(principleContent).toBe("# Existing Principle");
    const claudeContent = fs.readFileSync(
      path.join(TEST_DIR, "CLAUDE.md"),
      "utf8",
    );
    expect(claudeContent).toBe("# Existing Claude");
    expect(currentContent).toBe("# Existing Current");
  });

  it("should initialize AGENTS.md for opencode projects", () => {
    const result = runSpfStart(TEST_DIR, "opencode");

    expect(result).toContain("已初始化 PRINCIPLE.md");
    expect(result).toContain("已初始化 AGENTS.md");
    expect(
      fs.readFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "utf8"),
    ).toContain("共享规则");
    expect(fs.readFileSync(path.join(TEST_DIR, "AGENTS.md"), "utf8")).toContain(
      "OpenCode",
    );
  });
});
