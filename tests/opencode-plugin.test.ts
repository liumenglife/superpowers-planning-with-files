import { describe, expect, it, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { hasProjectMarker } from "../src/plugins/opencode-superpowers-planning.js";

const TEST_DIR = path.join(__dirname, "__opencode_plugin__");

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("OpenCode plugin project markers", () => {
  it("should recognize CLAUDE.md as a project marker", () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "CLAUDE.md"), "# Claude");

    expect(hasProjectMarker(TEST_DIR)).toBe(true);
  });

  it("should recognize AGENTS.md as a project marker", () => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "AGENTS.md"), "# Agents");

    expect(hasProjectMarker(TEST_DIR)).toBe(true);
  });
});
