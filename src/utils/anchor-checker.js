"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRecoveryAnchors = checkRecoveryAnchors;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
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
function checkRecoveryAnchors(cwd) {
    const missing = [];
    const currentPath = node_path_1.default.join(cwd, 'docs', 'planning', 'current.md');
    const decisionsPath = node_path_1.default.join(cwd, 'docs', 'planning', 'decisions.md');
    if (!node_fs_1.default.existsSync(currentPath)) {
        missing.push('docs/planning/current.md');
    }
    if (!node_fs_1.default.existsSync(decisionsPath)) {
        missing.push('docs/planning/decisions.md');
    }
    const specsDir = node_path_1.default.join(cwd, 'docs', 'superpowers', 'specs');
    const plansDir = node_path_1.default.join(cwd, 'docs', 'superpowers', 'plans');
    let hasSpecOrPlan = false;
    if (node_fs_1.default.existsSync(specsDir) && node_fs_1.default.readdirSync(specsDir).filter(f => f.endsWith('.md')).length > 0) {
        hasSpecOrPlan = true;
    }
    if (node_fs_1.default.existsSync(plansDir) && node_fs_1.default.readdirSync(plansDir).filter(f => f.endsWith('.md')).length > 0) {
        hasSpecOrPlan = true;
    }
    if (!hasSpecOrPlan) {
        missing.push('spec/plan files (in docs/superpowers/specs/ or docs/superpowers/plans/)');
    }
    return {
        isComplete: missing.length === 0,
        missing
    };
}
//# sourceMappingURL=anchor-checker.js.map