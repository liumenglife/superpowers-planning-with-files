/**
 * Context 监控结果类型
 */
export interface ContextStatus {
    percentage: number;
    level: 'NORMAL' | 'SOFT_WARNING' | 'HARD_WARNING';
    message?: string;
}
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
export declare function getContextWarning(usedPercentage: number, clientType?: 'claude-code' | 'opencode'): ContextStatus;
//# sourceMappingURL=context-monitor.d.ts.map