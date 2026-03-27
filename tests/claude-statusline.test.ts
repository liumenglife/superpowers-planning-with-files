import { afterEach, describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  buildStatusLineNotice,
  installClaudeStatusLine,
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
  it("should show a soft warning at 50% after /spf:start", () => {
    fs.mkdirSync(path.join(TEST_DIR, "docs", "planning"), { recursive: true });
    fs.writeFileSync(
      path.join(TEST_DIR, "docs", "planning", "current.md"),
      "# Current",
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
    const notice = buildStatusLineNotice(TEST_DIR, {
      context_window: {
        used_percentage: 20,
      },
    });

    expect(notice).toContain("SPF");
    expect(notice).toContain("未完成初始化");
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
  });
});
