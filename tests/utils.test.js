"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const anchor_checker_1 = require("../src/utils/anchor-checker");
const context_monitor_1 = require("../src/utils/context-monitor");
describe('Anchor Checker', () => {
    const TEST_DIR = node_path_1.default.join(__dirname, '__test_workspace__');
    beforeEach(() => {
        node_fs_1.default.mkdirSync(TEST_DIR, { recursive: true });
    });
    afterEach(() => {
        node_fs_1.default.rmSync(TEST_DIR, { recursive: true, force: true });
    });
    it('should detect missing anchors', () => {
        const result = (0, anchor_checker_1.checkRecoveryAnchors)(TEST_DIR);
        expect(result.isComplete).toBe(false);
        expect(result.missing).toContain('docs/planning/current.md');
        expect(result.missing).toContain('docs/planning/decisions.md');
        expect(result.missing).toContain('spec/plan files (in docs/superpowers/specs/ or docs/superpowers/plans/)');
    });
    it('should pass when all anchors are present', () => {
        node_fs_1.default.mkdirSync(node_path_1.default.join(TEST_DIR, 'docs', 'planning'), { recursive: true });
        node_fs_1.default.writeFileSync(node_path_1.default.join(TEST_DIR, 'docs', 'planning', 'current.md'), '# Current');
        node_fs_1.default.writeFileSync(node_path_1.default.join(TEST_DIR, 'docs', 'planning', 'decisions.md'), '# Decisions');
        node_fs_1.default.mkdirSync(node_path_1.default.join(TEST_DIR, 'docs', 'superpowers', 'specs'), { recursive: true });
        node_fs_1.default.writeFileSync(node_path_1.default.join(TEST_DIR, 'docs', 'superpowers', 'specs', '2026-03-25-spec.md'), '# Spec');
        const result = (0, anchor_checker_1.checkRecoveryAnchors)(TEST_DIR);
        expect(result.isComplete).toBe(true);
        expect(result.missing).toHaveLength(0);
    });
});
describe('Context Monitor', () => {
    it('should return NORMAL for < 40%', () => {
        const warning = (0, context_monitor_1.getContextWarning)(39);
        expect(warning.level).toBe('NORMAL');
        expect(warning.message).toBeUndefined();
    });
    it('should return SOFT_WARNING for 40-50%', () => {
        const warning = (0, context_monitor_1.getContextWarning)(45, 'claude-code');
        expect(warning.level).toBe('SOFT_WARNING');
        expect(warning.message).toContain('/clear');
        expect(warning.message).toContain('已经具备切session的条件，请根据实际情况');
    });
    it('should return HARD_WARNING for >= 51%', () => {
        const warning = (0, context_monitor_1.getContextWarning)(51, 'opencode');
        expect(warning.level).toBe('HARD_WARNING');
        expect(warning.message).toContain('/new');
        expect(warning.message).toContain('且上下文即将触发压缩，为了保证项目开发质量');
    });
});
//# sourceMappingURL=utils.test.js.map