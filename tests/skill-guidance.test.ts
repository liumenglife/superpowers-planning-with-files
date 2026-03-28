import { describe, expect, it } from "bun:test";
import fs from "node:fs";
import path from "node:path";

describe("Skill guidance", () => {
  it("should require Subagent-Driven Development in the project skill", () => {
    const skillPath = path.join(__dirname, "..", "src", "skills", "SKILL.md");
    const content = fs.readFileSync(skillPath, "utf8");

    expect(content).toContain("Subagent-Driven Development");
    expect(content).toContain("编码阶段任务清单");
    expect(content).toContain("history.md");
    expect(content).toContain("代码实现阶段");
    expect(content).toContain("并行派发");
    expect(content).toContain("[✓]");
    expect(content).toContain("[•]");
    expect(content).toContain("[ ]");
  });
});
