#!/usr/bin/env bun
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

console.log('开始安装 superpowers-planning-with-files (Claude Code Edition)...');

const homeDir = os.homedir();
const claudeSkillsDir = path.join(homeDir, '.claude', 'skills', 'superpowers-planning-with-files');
const openCodeSkillsDir = path.join(homeDir, '.config', 'opencode', 'skills', 'superpowers-planning-with-files');
const sourceSkillPath = path.join(process.cwd(), 'src', 'skills', 'SKILL.md');
const sourceExamplePath = path.join(process.cwd(), 'src', 'skills', 'EXAMPLE.md');

// 1. 安装 Skill 与示例文件到双端目录 (Claude Code & OpenCode)
console.log('\n[1/3] 正在将 SKILL.md 与 EXAMPLE.md 部署到 Claude Code 和 OpenCode 技能目录...');
try {
  // 部署给 Claude Code
  if (!fs.existsSync(claudeSkillsDir)) fs.mkdirSync(claudeSkillsDir, { recursive: true });
  if (fs.existsSync(sourceSkillPath)) {
    fs.copyFileSync(sourceSkillPath, path.join(claudeSkillsDir, 'SKILL.md'));
    console.log(`✅ SKILL 已复制到 Claude Code: ${claudeSkillsDir}/SKILL.md`);
  }
  if (fs.existsSync(sourceExamplePath)) {
    fs.copyFileSync(sourceExamplePath, path.join(claudeSkillsDir, 'EXAMPLE.md'));
    console.log(`✅ EXAMPLE 已复制到 Claude Code: ${claudeSkillsDir}/EXAMPLE.md`);
  }

  // 部署给 OpenCode
  if (!fs.existsSync(openCodeSkillsDir)) fs.mkdirSync(openCodeSkillsDir, { recursive: true });
  if (fs.existsSync(sourceSkillPath)) {
    fs.copyFileSync(sourceSkillPath, path.join(openCodeSkillsDir, 'SKILL.md'));
    console.log(`✅ SKILL 已复制到 OpenCode: ${openCodeSkillsDir}/SKILL.md`);
  }
  if (fs.existsSync(sourceExamplePath)) {
    fs.copyFileSync(sourceExamplePath, path.join(openCodeSkillsDir, 'EXAMPLE.md'));
    console.log(`✅ EXAMPLE 已复制到 OpenCode: ${openCodeSkillsDir}/EXAMPLE.md`);
  }
} catch (error) {
  console.error('❌ 复制 SKILL 失败:', error);
}

// 获取当前运行的 bun 路径
const bunExec = process.execPath || 'bun';

// 2. 将 CLI 工具 link 到全局
console.log('\n[2/3] 正在将 spf 命令行工具注册到全局...');
try {
  // 确保 bin/spf.ts 具有执行权限
  execSync('chmod +x ./bin/spf.ts', { stdio: 'inherit' });
  
  // 使用 bun link 注册全局命令 (尝试使用当前运行环境的 bun 路径)
  execSync(`${bunExec} link`, { stdio: 'inherit' });
  console.log('✅ 命令行工具 spf 已成功注册到全局！');
} catch (error) {
  console.error('❌ 注册全局命令失败:', error);
  console.log('提示: 请确保你已经安装了 Bun，并且当前环境支持软链接。');
}

// 3. 编译并安装 OpenCode 插件替换原版逻辑
console.log('\n[3/3] 正在编译并更新 OpenCode 插件逻辑...');
try {
  const openCodePluginDir = path.join(homeDir, '.config', 'opencode', 'plugins');
  const sourcePluginPath = path.join(process.cwd(), 'src', 'plugins', 'opencode-superpowers-planning.js');
  
  if (!fs.existsSync(openCodePluginDir)) {
    fs.mkdirSync(openCodePluginDir, { recursive: true });
  }
  
  if (fs.existsSync(sourcePluginPath)) {
    // 使用 Bun.build 将插件及其依赖（如 progress-bar）打包成一个独立的单文件
    console.log('📦 正在打包 OpenCode 插件...');
    execSync(`${bunExec} build --target=node --outfile=${path.join(process.cwd(), 'dist', 'superpowers-planning.js')} ${sourcePluginPath}`, { stdio: 'inherit' });
    
    // 拷贝打包后的文件到 OpenCode 插件目录
    fs.copyFileSync(
      path.join(process.cwd(), 'dist', 'superpowers-planning.js'), 
      path.join(openCodePluginDir, 'superpowers-planning.js')
    );
    console.log(`✅ OpenCode 插件已打包并成功更新至: ${openCodePluginDir}/superpowers-planning.js`);
  } else {
    console.warn(`⚠️ 警告: 找不到插件源文件 ${sourcePluginPath}`);
  }
} catch (error) {
  console.error('❌ 部署 OpenCode 插件失败:', error);
}

console.log('\n🎉 安装完成！');
console.log('你可以通过运行 `spf help` 来查看命令行工具的使用说明。');
console.log('Claude Code 在启动时将会自动加载 superpowers-planning-with-files 技能。');
