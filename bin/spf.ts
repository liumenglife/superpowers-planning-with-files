#!/usr/bin/env bun
import { runSpfStart } from '../src/commands/spf-start';
import { runSpfReady } from '../src/commands/spf-ready';
import { planningContextHook } from '../src/hooks/planning-context-hook';
import { createProgressBar } from '../src/utils/progress-bar';

const [, , command, ...args] = process.argv;

const cwd = process.cwd();

switch (command) {
  case 'start': {
    const output = runSpfStart(cwd);
    console.log(output);
    break;
  }
  case 'ready': {
    const percentage = args[0] ? parseInt(args[0], 10) : 0;
    const clientType = (args[1] === 'opencode' ? 'opencode' : 'claude-code') as 'claude-code' | 'opencode';
    
    if (isNaN(percentage)) {
      console.error('错误: 请提供一个有效的上下文使用百分比 (0-100)，如: spf ready 45');
      process.exit(1);
    }
    
    const result = runSpfReady(cwd, percentage, clientType);
    const bar = createProgressBar(percentage);
    
    let out = result.suggestion;
    if (out.includes('严禁切 Session') || out.includes('即将触发压缩')) {
      out = `\x1b[31m${bar}\n\n${out}\x1b[0m`; // 红色警告带进度条
    } else if (out.includes('考虑执行')) {
      out = `\x1b[33m${bar}\n\n${out}\x1b[0m`; // 黄色轻提示带进度条
    } else {
      out = `\x1b[32m${bar}\n\n${out}\x1b[0m`; // 绿色健康带进度条
    }
    console.log(out);
    break;
  }
  case 'hook': {
    const percentage = args[0] ? parseInt(args[0], 10) : 0;
    const clientType = (args[1] === 'opencode' ? 'opencode' : 'claude-code') as 'claude-code' | 'opencode';
    
    if (isNaN(percentage)) {
      console.error('错误: 请提供一个有效的上下文使用百分比 (0-100)，如: spf hook 45');
      process.exit(1);
    }
    
    const result = planningContextHook(cwd, percentage, clientType);
    if (result) {
      console.log(result);
    }
    break;
  }
  case 'help':
  default: {
    console.log(`
superpowers-planning-with-files CLI 工具

用法:
  spf start                        初始化 planning 工作流所需的文件和目录
  spf ready <percentage> [client]  手动评估当前上下文并决定是否建议切换 Session
  spf hook <percentage> [client]   执行生命周期拦截钩子并返回拦截/提示信息

参数:
  <percentage>                     当前上下文使用率百分比 (0-100)
  [client]                         运行环境客户端类型: 'claude-code' (默认) 或 'opencode'
    `);
    break;
  }
}
