"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContextWarning = getContextWarning;
/**
 * 基于 Context 使用率获取切 Session 的提示策略。
 *
 * - `< 40%`：不提示 (NORMAL)
 * - `40% ~ 50%`：轻提示 (SOFT_WARNING)
 * - `>= 51%`：重提示 (HARD_WARNING)
 *
 * @param usedPercentage 当前上下文使用的百分比 (0-100)
 * @param clientType 客户端类型 ('claude-code' 或 'opencode')，默认为 'claude-code'
 * @returns 提示状态及文案
 */
function getContextWarning(usedPercentage, clientType = 'claude-code') {
    const clearCommand = clientType === 'claude-code' ? '/clear' : '/new';
    if (usedPercentage < 40) {
        return {
            percentage: usedPercentage,
            level: 'NORMAL',
            message: undefined
        };
    }
    if (usedPercentage <= 50) {
        return {
            percentage: usedPercentage,
            level: 'SOFT_WARNING',
            message: `已经具备切session的条件，请根据实际情况，考虑执行 ${clearCommand} 清除context后，继续推进项目进程。`
        };
    }
    return {
        percentage: usedPercentage,
        level: 'HARD_WARNING',
        message: `已经具备切session的条件，且上下文即将触发压缩，为了保证项目开发质量，请尽快考虑执行 ${clearCommand} 清除context后，继续推进项目进程。`
    };
}
//# sourceMappingURL=context-monitor.js.map