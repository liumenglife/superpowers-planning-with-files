/**
 * 生成 ASCII 进度条
 * @param percentage 当前百分比 (0-100)
 * @returns 形如 `Context [████░░░░░] 45%` 的字符串
 */
export function createProgressBar(percentage: number): string {
  const totalBlocks = 20; // 总格数
  const safePercentage = Math.max(0, Math.min(percentage, 100));
  const filledBlocks = Math.round((safePercentage / 100) * totalBlocks);
  const emptyBlocks = totalBlocks - filledBlocks;
  const filled = '█'.repeat(filledBlocks);
  const empty = '░'.repeat(emptyBlocks);
  return `\`Context [${filled}${empty}] ${safePercentage}%\``;
}
