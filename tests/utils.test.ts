import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from 'node:fs';
import path from 'node:path';
import { checkRecoveryAnchors } from '../src/utils/anchor-checker';
import { getContextWarning } from '../src/utils/context-monitor';

describe('Anchor Checker', () => {
  const TEST_DIR = path.join(__dirname, '__test_workspace__');

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should detect missing anchors', () => {
    const result = checkRecoveryAnchors(TEST_DIR);
    expect(result.isComplete).toBe(false);
    expect(result.missing).toContain('docs/planning/current.md');
    expect(result.missing).toContain('docs/planning/decisions.md');
    expect(result.missing).toContain('spec/plan files (in docs/superpowers/specs/ or docs/superpowers/plans/)');
  });

  it('should pass when all anchors are present', () => {
    fs.mkdirSync(path.join(TEST_DIR, 'docs', 'planning'), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'docs', 'planning', 'current.md'), '# Current');
    fs.writeFileSync(path.join(TEST_DIR, 'docs', 'planning', 'decisions.md'), '# Decisions');

    fs.mkdirSync(path.join(TEST_DIR, 'docs', 'superpowers', 'specs'), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'docs', 'superpowers', 'specs', '2026-03-25-spec.md'), '# Spec');

    const result = checkRecoveryAnchors(TEST_DIR);
    expect(result.isComplete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});

describe('Context Monitor', () => {
  it('should return NORMAL for < 40%', () => {
    const warning = getContextWarning(39);
    expect(warning.level).toBe('NORMAL');
    expect(warning.message).toBeUndefined();
  });

  it('should return SOFT_WARNING for 40-50%', () => {
    const warning = getContextWarning(45, 'claude-code');
    expect(warning.level).toBe('SOFT_WARNING');
    expect(warning.message).toContain('/clear');
    expect(warning.message).toContain('已经具备切session的条件，请根据实际情况');
  });

  it('should return HARD_WARNING for >= 51%', () => {
    const warning = getContextWarning(51, 'opencode');
    expect(warning.level).toBe('HARD_WARNING');
    expect(warning.message).toContain('/new');
    expect(warning.message).toContain('且上下文即将触发压缩，为了保证项目开发质量');
  });
});
