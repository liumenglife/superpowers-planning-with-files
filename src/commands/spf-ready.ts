import { checkRecoveryAnchors } from '../utils/anchor-checker';
import { getContextWarning, ContextStatus } from '../utils/context-monitor';

export interface SpfReadyResult {
  isAnchorsComplete: boolean;
  missingAnchors: string[];
  contextStatus: ContextStatus;
  suggestion: string;
}

/**
 * 执行 /spf-ready 逻辑，评估是否应该切 Session
 * @param cwd 项目根目录
 * @param usedPercentage 当前上下文百分比 (0-100)
 * @param clientType 客户端类型
 */
export function runSpfReady(
  cwd: string,
  usedPercentage: number,
  clientType: 'claude-code' | 'opencode' = 'claude-code'
): SpfReadyResult {
  const anchorResult = checkRecoveryAnchors(cwd);
  const contextStatus = getContextWarning(usedPercentage, clientType);

  let suggestion = '';

  if (!anchorResult.isComplete) {
    // 锚点不全，不建议切 Session，且必须通知主Agent立即补齐
    suggestion = `【系统拦截与紧急指令】：恢复锚点不齐全，严禁切 Session！否则将丢失上下文。\n缺失以下文件或配置：\n- ${anchorResult.missing.join('\n- ')}\n\n⚠️ 请主Agent（Main Agent）立即停止其他任务，优先补齐上述缺失的 spec、current.md、decisions.md 等核心 planning 文件，完成后再进行后续操作。`;
  } else {
    // 锚点全，看 context 百分比
    if (contextStatus.level === 'NORMAL') {
      suggestion = `上下文使用率较低 (${usedPercentage}%)，当前状态健康，暂不需要切新 Session。`;
    } else {
      // SOFT_WARNING 或 HARD_WARNING，自带 message
      suggestion = contextStatus.message || '';
    }
  }

  return {
    isAnchorsComplete: anchorResult.isComplete,
    missingAnchors: anchorResult.missing,
    contextStatus,
    suggestion
  };
}
