/**
 * 检查当前项目的恢复锚点是否齐全。
 * 根据 2026-03-22-superpowers-planning-with-files-handoff.md 规范：
 * 需要检查：
 * - `docs/planning/current.md`
 * - `docs/planning/decisions.md`
 * - 至少存在一个 spec 或 plan 文件 (例如 docs/superpowers/specs/ 或 docs/superpowers/plans/ 中的 md)
 *
 * @param cwd 项目根目录
 * @returns 是否齐全，如果不齐全返回缺失项提示信息
 */
export declare function checkRecoveryAnchors(cwd: string): {
    isComplete: boolean;
    missing: string[];
};
//# sourceMappingURL=anchor-checker.d.ts.map