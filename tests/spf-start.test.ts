import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import fs from 'node:fs';
import path from 'node:path';
import { runSpfStart, CURRENT_MD_TEMPLATE, DECISIONS_MD_TEMPLATE } from '../src/commands/spf-start';

describe('Command: /spf-start', () => {
  const TEST_DIR = path.join(__dirname, '__test_workspace_start__');

  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('should initialize planning files when they do not exist', () => {
    const result = runSpfStart(TEST_DIR);
    
    expect(result).toContain('已创建 docs/planning/ 目录');
    expect(result).toContain('已初始化 current.md');
    expect(result).toContain('已初始化 decisions.md');

    const currentContent = fs.readFileSync(path.join(TEST_DIR, 'docs', 'planning', 'current.md'), 'utf8');
    const decisionsContent = fs.readFileSync(path.join(TEST_DIR, 'docs', 'planning', 'decisions.md'), 'utf8');

    expect(currentContent).toBe(CURRENT_MD_TEMPLATE);
    expect(decisionsContent).toBe(DECISIONS_MD_TEMPLATE);
  });

  it('should not overwrite existing planning files', () => {
    // 预先创建文件
    fs.mkdirSync(path.join(TEST_DIR, 'docs', 'planning'), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, 'docs', 'planning', 'current.md'), '# Existing Current');
    fs.writeFileSync(path.join(TEST_DIR, 'docs', 'planning', 'decisions.md'), '# Existing Decisions');

    const result = runSpfStart(TEST_DIR);
    
    expect(result).toContain('current.md 已存在，跳过初始化');
    expect(result).toContain('decisions.md 已存在，跳过初始化');

    const currentContent = fs.readFileSync(path.join(TEST_DIR, 'docs', 'planning', 'current.md'), 'utf8');
    expect(currentContent).toBe('# Existing Current');
  });
});
