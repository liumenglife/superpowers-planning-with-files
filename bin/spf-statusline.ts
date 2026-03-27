#!/usr/bin/env bun
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  buildStatusLineNotice,
  type ClaudeStatusLineInput,
} from "../src/claude-statusline";

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return "";
  }

  const chunks: string[] = [];
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    chunks.push(chunk as string);
  }
  return chunks.join("");
}

function readBaseCommand(): string | null {
  const configPath = path.join(
    os.homedir(),
    ".claude",
    "superpowers-planning-with-files",
    "statusline.json",
  );
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
      baseCommand?: string | null;
    };
    return parsed.baseCommand ?? null;
  } catch {
    return null;
  }
}

function runBaseCommand(baseCommand: string | null, input: string): string {
  if (!baseCommand) {
    return "";
  }

  const result = spawnSync("/bin/bash", ["-lc", baseCommand], {
    input,
    encoding: "utf8",
  });

  return result.stdout?.trim() ?? "";
}

async function main(): Promise<void> {
  const rawInput = await readStdin();
  let parsedInput: (ClaudeStatusLineInput & { cwd?: string }) | null = null;

  if (rawInput.trim()) {
    try {
      parsedInput = JSON.parse(rawInput) as ClaudeStatusLineInput & {
        cwd?: string;
      };
    } catch {
      parsedInput = null;
    }
  }

  const baseOutput = runBaseCommand(readBaseCommand(), rawInput);
  const notice = parsedInput?.cwd
    ? buildStatusLineNotice(parsedInput.cwd, parsedInput)
    : null;
  const output = [baseOutput, notice]
    .filter((value) => value && value.trim().length > 0)
    .join("\n");

  if (output) {
    process.stdout.write(`${output}\n`);
  }
}

void main();
