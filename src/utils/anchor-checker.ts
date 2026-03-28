import fs from "node:fs";
import path from "node:path";

export interface RecoveryAnchorResult {
  isComplete: boolean;
  missing: string[];
  recommendedMissing: string[];
}

export type ClientType = "claude-code" | "opencode";

export function getClientInstructionFile(clientType: ClientType): string {
  return clientType === "opencode" ? "AGENTS.md" : "CLAUDE.md";
}

/**
 * 检查当前项目的恢复锚点是否齐全。
 * 根据 2026-03-22-superpowers-planning-with-files-handoff.md 规范：
 * 需要检查：
 * - `docs/planning/current.md`
 * - `docs/planning/history.md`
 * - `docs/planning/decisions.md`
 * - 至少存在一个 spec 或 plan 文件 (例如 docs/superpowers/specs/ 或 docs/superpowers/plans/ 中的 md)
 *
 * @param cwd 项目根目录
 * @returns 是否齐全，如果不齐全返回缺失项提示信息
 */
export function checkRecoveryAnchors(
  cwd: string,
  clientType: ClientType = "claude-code",
): RecoveryAnchorResult {
  const missing: string[] = [];
  const recommendedMissing: string[] = [];

  const currentPath = path.join(cwd, "docs", "planning", "current.md");
  const historyPath = path.join(cwd, "docs", "planning", "history.md");
  const decisionsPath = path.join(cwd, "docs", "planning", "decisions.md");

  if (!fs.existsSync(currentPath)) {
    missing.push("docs/planning/current.md");
  }
  if (!fs.existsSync(historyPath)) {
    missing.push("docs/planning/history.md");
  }
  if (!fs.existsSync(decisionsPath)) {
    missing.push("docs/planning/decisions.md");
  }

  const principlePath = path.join(cwd, "PRINCIPLE.md");
  if (!fs.existsSync(principlePath)) {
    missing.push("PRINCIPLE.md");
  }

  const clientInstructionFile = getClientInstructionFile(clientType);
  const clientInstructionPath = path.join(cwd, clientInstructionFile);
  if (!fs.existsSync(clientInstructionPath)) {
    missing.push(clientInstructionFile);
  }

  const specsDir = path.join(cwd, "docs", "superpowers", "specs");
  const plansDir = path.join(cwd, "docs", "superpowers", "plans");

  let hasSpecOrPlan = false;
  if (
    fs.existsSync(specsDir) &&
    fs.readdirSync(specsDir).filter((f) => f.endsWith(".md")).length > 0
  ) {
    hasSpecOrPlan = true;
  }
  if (
    fs.existsSync(plansDir) &&
    fs.readdirSync(plansDir).filter((f) => f.endsWith(".md")).length > 0
  ) {
    hasSpecOrPlan = true;
  }

  if (!hasSpecOrPlan) {
    recommendedMissing.push(
      "spec/plan files (in docs/superpowers/specs/ or docs/superpowers/plans/)",
    );
  }

  return {
    isComplete: missing.length === 0,
    missing,
    recommendedMissing,
  };
}
