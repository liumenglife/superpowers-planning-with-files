import { runSpfReady } from '../commands/spf-ready';
import { createProgressBar } from '../utils/progress-bar';

/**
 * 规划上下文拦截 Hook (Planning Context Hook)
 * 
 * 该 Hook 旨在被 Claude Code 或 OpenCode 的生命周期（如 onAfterMessage 或 onBeforePrompt）调用。
 * 它会在后台悄悄评估当前项目的锚点齐全度和 Context 压力，并在需要干预时返回给主 Agent 的提示信息。
 * 
 * @param cwd 项目根目录
 * @param usedPercentage 当前上下文使用率 (0-100)
 * @param clientType 当前运行环境客户端类型
 * @returns 需要注入给主 Agent 的系统提示词；如果一切健康（NORMAL）则返回 null
 */
export function planningContextHook(
  cwd: string,
  usedPercentage: number,
  clientType: 'claude-code' | 'opencode' = 'claude-code'
): string | null {
  const readyResult = runSpfReady(cwd, usedPercentage, clientType);
  const progressBar = createProgressBar(usedPercentage);

  // 1. 如果锚点不全，无论 context 多少，都必须阻断并返回静默补齐指令
  if (!readyResult.isAnchorsComplete) {
    const silentFixInstruction = `Project anchors are missing! Whether this is a brand new project or an existing one, you MUST silently create the required planning files (docs/planning/current.md, decisions.md, and a spec) right now. If it is an existing project, briefly explore the codebase to infer the current goals and state, and populate the planning files with real content. DO NOT output a red warning to the user or ask them to do it. Just use your file-writing tools to initialize and update these files silently in the background, then proceed with the user's request.`;
    return `${readyResult.suggestion}\n\n${silentFixInstruction}`;
  }

  // 2. 锚点齐全的情况下，只有在面临 context 压力时才返回带进度条的强视觉提示
  if (readyResult.contextStatus.level !== 'NORMAL') {
    let aiVisualInstruction = '';
    if (readyResult.contextStatus.level === 'HARD_WARNING') {
      aiVisualInstruction = `YOU MUST IMMEDIATELY STOP IMPLEMENTING CODE. Start your response with exactly "🔴 **[严重警告：上下文告急]** ${progressBar}" in bold red text. Urgently advise the user to run /new (or /clear) to switch sessions before memory is compressed. Explain that they can decide whether to clear it this exact second or wait a few more turns, but the risk of hallucination is extremely high.`;
    } else {
      aiVisualInstruction = `Start your response with exactly "🟡 **[温馨提示：建议清理上下文]** ${progressBar}" in bold text. Gently remind the user that context is at ${usedPercentage}%, and it might be a good time to run /new (or /clear) soon to maintain optimal performance. They can choose to do it now or after a few more messages.`;
    }

    return `【系统状态通知】：${readyResult.suggestion}\n\nIMPORTANT INSTRUCTION FOR YOUR NEXT RESPONSE:\n${aiVisualInstruction}`;
  }

  // 3. 健康状态，静默放行
  return null;
}
