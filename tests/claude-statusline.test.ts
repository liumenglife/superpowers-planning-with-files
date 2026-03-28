import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  buildStatusLineNotice,
  buildMacOSAlertScript,
  buildMacOSNotificationScript,
  installClaudeStatusLine,
  resolveStatusLineCwd,
  resolveContextPercentage,
} from "../src/claude-statusline";

const TEST_DIR = path.join(__dirname, "__statusline_workspace__");
const TEST_CLAUDE_DIR = path.join(TEST_DIR, ".claude");

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("Claude status line context parsing", () => {
  it("should prefer native used_percentage from Claude stdin", () => {
    expect(
      resolveContextPercentage({
        context_window: {
          used_percentage: 50,
          context_window_size: 200000,
          current_usage: { input_tokens: 1000 },
        },
      }),
    ).toBe(50);
  });
});

describe("Claude status line SPF notice", () => {
  it("should fall back to the repo root when cwd is missing", () => {
    expect(resolveStatusLineCwd(undefined, "/repo")).toBe("/repo");
  });

  it("should show a soft warning at 50% after /spf:start", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "# Principle");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "history.md"),
      "# History",
    );
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "decisions.md"),
      "# Decisions",
    );

    const notice = buildStatusLineNotice(TEST_DIR, {
      context_window: {
        used_percentage: 50,
      },
    });

    expect(notice).toContain("SPF");
    expect(notice).toContain("50%");
    expect(notice).toContain("建议 /clear");
  });

  it("should surface missing current or decisions as a blocking notice", () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "PRINCIPLE.md"), "# Principle");
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");
    const notice = buildStatusLineNotice(TEST_DIR, {
      context_window: {
        used_percentage: 20,
      },
    });

    expect(notice).toContain("SPF");
    expect(notice).toContain("未完成初始化");
    expect(notice).toContain("history.md");
  });

  it("should build a macOS notification script", () => {
    const script = buildMacOSNotificationScript("SPF: 50% 建议 /clear");

    expect(script).toContain("display notification");
    expect(script).toContain('with title "SPF"');
    expect(script).toContain("SPF: 50% 建议 /clear");
  });

  it("should build a macOS alert script", () => {
    const script = buildMacOSAlertScript("SPF: 50% 建议 /clear");

    expect(script).toContain("display alert");
    expect(script).toContain("as critical");
    expect(script).toContain("SPF: 50% 建议 /clear");
  });

  it("should build a macOS soft alert script that auto-dismisses", () => {
    const script = buildMacOSAlertScript("SPF: 50% 建议 /clear", 3);

    expect(script).toContain("display alert");
    expect(script).toContain("giving up after 3");
  });
});

describe("Claude status line installation", () => {
  it("should wrap the existing status line command instead of deleting it", () => {
    fs.mkdirSync(TEST_CLAUDE_DIR, { recursive: true });
    const settingsPath = path.join(TEST_CLAUDE_DIR, "settings.json");
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(
        {
          statusLine: {
            type: "command",
            command: "existing-hud-command",
          },
        },
        null,
        2,
      ),
    );

    const result = installClaudeStatusLine({
      claudeDir: TEST_CLAUDE_DIR,
      repoRoot: "/repo",
      bunExec: "/Users/demo/.bun/bin/bun",
    });

    expect(result.settings.statusLine?.command).toContain("spf-statusline.ts");
    expect(result.baseCommand).toBe("existing-hud-command");
    expect(
      fs.readFileSync(
        path.join(
          TEST_CLAUDE_DIR,
          "superpowers-planning-with-files",
          "statusline.json",
        ),
        "utf8",
      ),
    ).toContain("existing-hud-command");
    expect(
      fs.readFileSync(
        path.join(
          TEST_CLAUDE_DIR,
          "superpowers-planning-with-files",
          "statusline.json",
        ),
        "utf8",
      ),
    ).toContain('"repoRoot": "/repo"');
  });
});
