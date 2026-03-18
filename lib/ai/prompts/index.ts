/**
 * ModelForge - AI 提示词模板
 */

export const PROMPTS = {
  /**
   * 系统角色提示
   */
  SYSTEM_ROLE: `你是 ModelForge（模型锻造）的 AI 金融建模助手。

你帮助投资分析师构建可靠、可审计的金融模型。

核心原则：
1. 准确性：确保计算公式正确
2. 可追溯：每个数值都有来源
3. 透明：解释假设和逻辑
4. 专业：使用行业标准和最佳实践`,

  /**
   * DCF 模型构建提示
   */
  DCF_BUILD: `帮助用户构建 DCF 估值模型。

模型步骤：
1. 收集历史财务数据
2. 预测未来收入增长
3. 计算 EBITDA 和自由现金流
4. 确定折现率和永续增长率
5. 计算企业价值和权益价值

需要的输入：
- 目标公司股票代码
- 历史财务数据年数
- 收入增长率假设
- EBITDA 利润率假设
- 折现率（WACC）
- 永续增长率`,

  /**
   * 三表建模提示
   */
  THREE_STATEMENT_BUILD: `帮助用户构建三表联动模型。

三表包括：
1. 利润表 (Income Statement)
   - 收入、成本、毛利、营业费用、EBITDA、净利润

2. 资产负债表 (Balance Sheet)
   - 资产：现金、应收账款、存货、固定资产
   - 负债：应付账款、短期/长期债务
   - 权益：股东权益

3. 现金流量表 (Cash Flow Statement)
   - 经营活动现金流
   - 投资活动现金流
   - 筹资活动现金流

联动逻辑：
- 净利润 → 留存收益 → 股东权益
- 折旧 → 固定资产减少
- 现金变动 → 资产负债表平衡`,

  /**
   * 公式解释提示
   */
  FORMULA_EXPLAIN: (formula: string) => `解释这个金融公式：${formula}

请提供：
1. 公式的数学含义
2. 每个变量的定义
3. 金融应用场景
4. 注意事项和局限性`,

  /**
   * 数据查询提示
   */
  DATA_QUERY: (symbol: string, dataType: string) => `查询 ${symbol} 的 ${dataType} 数据。

可用数据类型：
- stock_info: 股票基本信息
- financials: 财务报表数据
- market_data: 历史行情
- industry_data: 行业对比数据`
}

/**
 * 生成模型构建提示
 */
export function generateBuildPrompt(modelType: string, context: Record<string, unknown>): string {
  switch (modelType) {
    case 'dcf':
      return PROMPTS.DCF_BUILD
    case 'three_statement':
      return PROMPTS.THREE_STATEMENT_BUILD
    default:
      return `帮助用户构建 ${modelType} 类型的金融模型。`
  }
}