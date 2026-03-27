import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { planningContextHook } from "../src/hooks/planning-context-hook";

describe("Hook: planningContextHook", () => {
  const TEST_DIR = path.join(__dirname, "__test_workspace_hook__");

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should return strict missing anchors instruction even if context is low", () => {
    const hookMessage = planningContextHook(TEST_DIR, 20, "claude-code");
    expect(hookMessage).not.toBeNull();
    expect(hookMessage).toContain("严禁切 Session");
    expect(hookMessage).toContain("主Agent（Main Agent）立即停止其他任务");
  });

  it("should return null (silent) if planning anchors are complete and context is low", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );

    const hookMessage = planningContextHook(TEST_DIR, 30, "claude-code");
    expect(hookMessage).toBeNull();
  });

  it("should return warning message if planning anchors are complete but context is high", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );

    const hookMessageSoft = planningContextHook(TEST_DIR, 45, "claude-code");
    expect(hookMessageSoft).not.toBeNull();
    expect(hookMessageSoft).toContain("【系统状态通知】");
    expect(hookMessageSoft).toContain("/clear");

    const hookMessageHard = planningContextHook(TEST_DIR, 55, "opencode");
    expect(hookMessageHard).not.toBeNull();
    expect(hookMessageHard).toContain("【系统状态通知】");
    expect(hookMessageHard).toContain("/new");
    expect(hookMessageHard).toContain("且上下文即将触发压缩");
  });
});
