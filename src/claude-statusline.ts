import fs from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { runSpfReady } from "./commands/spf-ready";

export interface ClaudeStatusLineInput {
  context_window?: {
    used_percentage?: number | null;
    context_window_size?: number;
    current_usage?: {
      input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
}

export interface ClaudeSettings {
  statusLine?: {
    type: string;
    command: string;
  };
  [key: string]: unknown;
}

export interface InstallClaudeStatusLineOptions {
  claudeDir?: string;
  repoRoot: string;
  bunExec: string;
}

export interface InstallClaudeStatusLineResult {
  settings: ClaudeSettings;
  settingsPath: string;
  configPath: string;
  wrapperCommand: string;
  baseCommand: string | null;
}

export interface StatusLineState {
  baseCommand: string | null;
  repoRoot: string;
  lastNotice?: string | null;
}

export function resolveContextPercentage(stdin: ClaudeStatusLineInput): number {
  const nativePercent = stdin.context_window?.used_percentage;
  if (typeof nativePercent === "number" && Number.isFinite(nativePercent)) {
    return Math.max(0, Math.min(100, Math.round(nativePercent)));
  }

  const size = stdin.context_window?.context_window_size;
  if (!size || size <= 0) {
    return 0;
  }

  const usage = stdin.context_window?.current_usage;
  const totalTokens =
    (usage?.input_tokens ?? 0) +
    (usage?.cache_creation_input_tokens ?? 0) +
    (usage?.cache_read_input_tokens ?? 0);

  return Math.max(0, Math.min(100, Math.round((totalTokens / size) * 100)));
}

export function buildStatusLineNotice(
  cwd: string,
  stdin: ClaudeStatusLineInput,
): string | null {
  const usedPercentage = resolveContextPercentage(stdin);
  const readyResult = runSpfReady(cwd, usedPercentage, "claude-code");

  if (!readyResult.isAnchorsComplete) {
    return `SPF: 未完成初始化，缺少 ${readyResult.missingAnchors.join("、")}`;
  }

  if (readyResult.contextStatus.level === "HARD_WARNING") {
    return `SPF: ${usedPercentage}% 立即 /clear，避免上下文压缩`;
  }

  if (readyResult.contextStatus.level === "SOFT_WARNING") {
    return `SPF: ${usedPercentage}% 建议 /clear，准备切换 Session`;
  }

  if (readyResult.recommendedAnchors.length > 0) {
    return "SPF: 已初始化，待主Agent进入业务分析后创建 spec/plan";
  }

  return null;
}

export function resolveStatusLineCwd(
  cwdFromInput: string | undefined,
  fallbackCwd: string,
): string {
  if (cwdFromInput && cwdFromInput.trim().length > 0) {
    return cwdFromInput;
  }

  return fallbackCwd;
}

export function buildMacOSNotificationScript(message: string): string {
  const escapedMessage = escapeAppleScriptString(message);
  return `display notification "${escapedMessage}" with title "SPF"`;
}

export function buildMacOSAlertScript(
  message: string,
  autoDismissSeconds?: number,
): string {
  const escapedMessage = escapeAppleScriptString(message);
  const givingUpAfter =
    typeof autoDismissSeconds === "number" && autoDismissSeconds > 0
      ? ` giving up after ${Math.round(autoDismissSeconds)}`
      : "";

  return `display alert "SPF" message "${escapedMessage}" as critical${givingUpAfter}`;
}

export function notifyMacOS(message: string): boolean {
  if (process.platform !== "darwin") {
    return false;
  }

  const result = spawnSync(
    "osascript",
    ["-e", buildMacOSNotificationScript(message)],
    {
      encoding: "utf8",
      stdio: "ignore",
    },
  );

  return result.status === 0;
}

export function getStatusLineWrapperCommand(
  repoRoot: string,
  bunExec: string,
): string {
  return `"${bunExec}" --env-file /dev/null "${path.join(repoRoot, "bin", "spf-statusline.ts")}"`;
}

export function installClaudeStatusLine(
  options: InstallClaudeStatusLineOptions,
): InstallClaudeStatusLineResult {
  const claudeDir = options.claudeDir ?? path.join(os.homedir(), ".claude");
  const settingsPath = path.join(claudeDir, "settings.json");
  const supportDir = path.join(claudeDir, "superpowers-planning-with-files");
  const configPath = path.join(supportDir, "statusline.json");

  const settings = readClaudeSettings(settingsPath);
  const currentCommand =
    settings.statusLine?.type === "command"
      ? settings.statusLine.command
      : null;
  const wrapperCommand = getStatusLineWrapperCommand(
    options.repoRoot,
    options.bunExec,
  );
  const baseCommand =
    currentCommand && currentCommand !== wrapperCommand
      ? currentCommand
      : readBaseCommand(configPath);

  fs.mkdirSync(supportDir, { recursive: true });
  fs.writeFileSync(
    configPath,
    JSON.stringify(
      { baseCommand, repoRoot: options.repoRoot, lastNotice: null },
      null,
      2,
    ),
    "utf8",
  );

  settings.statusLine = {
    type: "command",
    command: wrapperCommand,
  };
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(settings, null, 2) + "\n",
    "utf8",
  );

  return {
    settings,
    settingsPath,
    configPath,
    wrapperCommand,
    baseCommand,
  };
}

function readClaudeSettings(settingsPath: string): ClaudeSettings {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(settingsPath, "utf8")) as ClaudeSettings;
}

function readBaseCommand(configPath: string): string | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    baseCommand?: string | null;
  };
  return parsed.baseCommand ?? null;
}

export function readStatusLineState(configPath: string): StatusLineState {
  if (!fs.existsSync(configPath)) {
    return { baseCommand: null, repoRoot: "", lastNotice: null };
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    baseCommand?: string | null;
    repoRoot?: string;
    lastNotice?: string | null;
  };

  return {
    baseCommand: parsed.baseCommand ?? null,
    repoRoot: parsed.repoRoot ?? "",
    lastNotice: parsed.lastNotice ?? null,
  };
}

export function writeStatusLineState(
  configPath: string,
  state: StatusLineState,
): void {
  fs.writeFileSync(configPath, JSON.stringify(state, null, 2), "utf8");
}

function escapeAppleScriptString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
