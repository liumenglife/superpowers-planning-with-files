#!/usr/bin/env bun
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  buildStatusLineNotice,
  buildMacOSAlertScript,
  readStatusLineState,
  notifyMacOS,
  resolveContextPercentage,
  writeStatusLineState,
  type ClaudeStatusLineInput,
} from "../src/claude-statusline";
import { runSpfReady } from "../src/commands/spf-ready";

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

function readRepoRoot(): string | null {
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
      repoRoot?: string | null;
    };
    return parsed.repoRoot ?? null;
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

function emitMacOSNotification(message: string): void {
  if (!notifyMacOS(message)) {
    return;
  }
}

function emitMacOSAlert(message: string, autoDismissSeconds?: number): void {
  if (process.platform !== "darwin") {
    return;
  }

  const child = spawn(
    "osascript",
    ["-e", buildMacOSAlertScript(message, autoDismissSeconds)],
    {
      detached: true,
      stdio: "ignore",
    },
  );
  child.unref();
}

function emitStatusLineAlerts(
  message: string,
  autoDismissSeconds?: number,
): void {
  emitMacOSNotification(message);
  emitMacOSAlert(message, autoDismissSeconds);
}

function getStatusLineStatePath(): string {
  return path.join(
    os.homedir(),
    ".claude",
    "superpowers-planning-with-files",
    "statusline.json",
  );
}

function getAutoDismissSeconds(
  effectiveCwd: string,
  parsedInput: ClaudeStatusLineInput,
): number | undefined {
  const usedPercentage = resolveContextPercentage(parsedInput);
  const readyResult = runSpfReady(effectiveCwd, usedPercentage, "claude-code");
  return readyResult.contextStatus.level === "SOFT_WARNING" ? 3 : undefined;
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
  const fallbackRepoRoot = readRepoRoot();
  const effectiveCwd = parsedInput?.cwd ?? fallbackRepoRoot ?? null;
  const statePath = getStatusLineStatePath();
  const currentState = readStatusLineState(statePath);
  const notice = effectiveCwd
    ? buildStatusLineNotice(effectiveCwd, parsedInput ?? {})
    : null;
  if (notice && notice !== currentState.lastNotice) {
    const autoDismissSeconds = effectiveCwd
      ? getAutoDismissSeconds(effectiveCwd, parsedInput ?? {})
      : undefined;
    emitStatusLineAlerts(notice, autoDismissSeconds);
    writeStatusLineState(statePath, {
      ...currentState,
      lastNotice: notice,
    });
  }
  const output = [baseOutput, notice]
    .filter((value) => value && value.trim().length > 0)
    .join("\n");

  if (output) {
    process.stdout.write(`${output}\n`);
  }
}

void main();
