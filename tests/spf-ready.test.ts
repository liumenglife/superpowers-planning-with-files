import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { runSpfReady } from "../src/commands/spf-ready";

describe("Command: /spf-ready", () => {
  const TEST_DIR = path.join(__dirname, "__test_workspace_ready__");

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should deny ready if anchors are missing and notify main agent", () => {
    const result = runSpfReady(TEST_DIR, 60, "claude-code");
    expect(result.isAnchorsComplete).toBe(false);
    expect(result.suggestion).toContain("严禁切 Session");
    expect(result.suggestion).toContain("docs/planning/current.md");
    expect(result.suggestion).toContain("docs/planning/history.md");
    expect(result.suggestion).toContain(
      "请主Agent（Main Agent）立即停止其他任务，优先补齐上述缺失",
    );
  });

  it("should allow ready and give normal suggestion after /spf:start even without spec or plan", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "# Principle");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "history.md"),
      "# History",
    );

    const result = runSpfReady(TEST_DIR, 30, "claude-code");
    expect(result.isAnchorsComplete).toBe(true);
    expect(result.contextStatus.level).toBe("NORMAL");
    expect(result.suggestion).toContain("暂不需要切新 Session");
    expect(result.suggestion).toContain("尚未发现 spec/plan");
  });

  it("should output soft warning at 45% even before spec or plan exist", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "# Principle");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "history.md"),
      "# History",
    );

    const result = runSpfReady(TEST_DIR, 45, "claude-code");
    expect(result.isAnchorsComplete).toBe(true);
    expect(result.contextStatus.level).toBe("SOFT_WARNING");
    expect(result.suggestion).toContain("/clear");
  });

  it("should output hard warning if planning anchors exist and context high", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "# Principle");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "history.md"),
      "# History",
    );

    const result = runSpfReady(TEST_DIR, 55, "opencode");
    expect(result.isAnchorsComplete).toBe(true);
    expect(result.contextStatus.level).toBe("HARD_WARNING");
    expect(result.suggestion).toContain("/new");
    expect(result.suggestion).toContain("为了保证项目开发质量，请尽快考虑执行");
  });
});
