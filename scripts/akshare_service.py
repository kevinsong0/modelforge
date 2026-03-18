#!/usr/bin/env python3
"""
ModelForge - AKShare 数据服务
提供股票信息、财务数据、市场数据等 API
"""

import json
import sys
from datetime import datetime
from typing import Any

try:
    import akshare as ak
except ImportError:
    print(json.dumps({"error": "akshare not installed. Run: pip install akshare"}))
    sys.exit(1)


def get_stock_info(symbol: str) -> dict[str, Any]:
    """获取股票基本信息"""
    try:
        # 使用股票列表获取基本信息（更稳定）
        df = ak.stock_info_a_code_name()
        stock = df[df['code'] == symbol]

        if stock.empty:
            return {"error": f"Stock {symbol} not found"}

        return {
            "symbol": symbol,
            "name": stock.iloc[0]['name'],
            "industry": "",  # 行业信息需要其他接口
            "listDate": "",  # 上市时间需要其他接口
            "marketCap": None,
        }
    except Exception as e:
        return {"error": str(e)}


def get_financials(symbol: str) -> dict[str, Any]:
    """获取财务数据"""
    try:
        # 获取股票名称
        stock_name = ""
        try:
            info_df = ak.stock_individual_info_em(symbol=symbol)
            if not info_df.empty:
                info = dict(zip(info_df['item'], info_df['value']))
                stock_name = info.get("股票简称", "")
        except:
            pass

        # 获取利润表数据
        income_df = ak.stock_financial_report_sina(stock=symbol, symbol="利润表")
        income_latest = income_df.iloc[0].to_dict() if not income_df.empty else {}

        # 获取资产负债表数据
        balance_df = ak.stock_financial_report_sina(stock=symbol, symbol="资产负债表")
        balance_latest = balance_df.iloc[0].to_dict() if not balance_df.empty else {}

        # 获取现金流量表数据
        cashflow_df = ak.stock_financial_report_sina(stock=symbol, symbol="现金流量表")
        cashflow_latest = cashflow_df.iloc[0].to_dict() if not cashflow_df.empty else {}

        # 如果三个表都为空，返回错误
        if not income_latest and not balance_latest and not cashflow_latest:
            return {"error": f"No financial data for {symbol}"}

        return {
            "symbol": symbol,
            "name": stock_name,
            "year": str(income_latest.get("报告日", ""))[:4] if "报告日" in income_latest else "",
            "incomeStatement": {
                "revenue": _parse_number(income_latest.get("营业收入")),
                "costOfGoodsSold": _parse_number(income_latest.get("营业成本")),
                "grossProfit": _parse_number(income_latest.get("营业利润")),
                "operatingExpenses": _parse_number(income_latest.get("销售费用", 0)) + _parse_number(income_latest.get("管理费用", 0)),
                "ebitda": None,  # 需要手动计算
                "depreciation": _parse_number(cashflow_latest.get("固定资产折旧")),
                "ebit": _parse_number(income_latest.get("利润总额")),
                "interest": _parse_number(income_latest.get("财务费用")),
                "ebt": _parse_number(income_latest.get("利润总额")),
                "taxes": _parse_number(income_latest.get("所得税费用")),
                "netIncome": _parse_number(income_latest.get("净利润")),
            },
            "balanceSheet": {
                "cash": _parse_number(balance_latest.get("货币资金")),
                "accountsReceivable": _parse_number(balance_latest.get("应收账款")),
                "inventory": _parse_number(balance_latest.get("存货")),
                "currentAssets": _parse_number(balance_latest.get("流动资产合计")),
                "propertyPlantEquipment": _parse_number(balance_latest.get("固定资产")),
                "intangibleAssets": _parse_number(balance_latest.get("无形资产")),
                "totalAssets": _parse_number(balance_latest.get("资产总计")),
                "accountsPayable": _parse_number(balance_latest.get("应付账款")),
                "shortTermDebt": _parse_number(balance_latest.get("短期借款")),
                "currentLiabilities": _parse_number(balance_latest.get("流动负债合计")),
                "longTermDebt": _parse_number(balance_latest.get("长期借款")),
                "totalLiabilities": _parse_number(balance_latest.get("负债合计")),
                "shareholdersEquity": _parse_number(balance_latest.get("所有者权益(或股东权益)合计")),
            },
            "cashFlow": {
                "operating": _parse_number(cashflow_latest.get("经营活动产生的现金流量净额")),
                "investing": _parse_number(cashflow_latest.get("投资活动产生的现金流量净额")),
                "financing": _parse_number(cashflow_latest.get("筹资活动产生的现金流量净额")),
            }
        }
    except Exception as e:
        return {"error": str(e)}


def get_market_data(symbol: str, start_date: str = None, end_date: str = None) -> dict[str, Any]:
    """获取市场行情数据"""
    try:
        # 确定股票代码前缀（上海或深圳）
        if symbol.startswith('6'):
            full_symbol = f"sh{symbol}"
        else:
            full_symbol = f"sz{symbol}"

        # 使用新浪日线行情数据（比 eastmoney 更稳定）
        df = ak.stock_zh_a_daily(symbol=full_symbol, adjust="qfq")

        if df.empty:
            return {"error": f"No market data for {symbol}"}

        # 按日期筛选 - 将字符串日期转换为 datetime.date 对象
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            df = df[df['date'].apply(lambda d: d.date() if hasattr(d, 'date') else d) >= start_dt]
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
            df = df[df['date'].apply(lambda d: d.date() if hasattr(d, 'date') else d) <= end_dt]

        # 转换为列表格式
        data = []
        for _, row in df.iterrows():
            data.append({
                "date": str(row["date"]),
                "open": float(row["open"]) if row["open"] else None,
                "high": float(row["high"]) if row["high"] else None,
                "low": float(row["low"]) if row["low"] else None,
                "close": float(row["close"]) if row["close"] else None,
                "volume": float(row["volume"]) if row["volume"] else None,
            })

        return {
            "symbol": symbol,
            "data": data[-252:] if len(data) > 252 else data  # 最多返回一年数据
        }
    except Exception as e:
        return {"error": str(e)}


def get_industry_data(industry: str) -> dict[str, Any]:
    """获取行业数据"""
    try:
        # 获取行业板块数据
        df = ak.stock_board_industry_name_em()
        industry_data = df[df['板块名称'] == industry]

        if industry_data.empty:
            return {"error": f"Industry {industry} not found"}

        # 获取行业成分股
        try:
            stocks_df = ak.stock_board_industry_cons_em(symbol=industry)
            stocks = stocks_df.to_dict('records')[:20]  # 取前20只
        except:
            stocks = []

        return {
            "industry": industry,
            "changePercent": float(industry_data.iloc[0]['涨跌幅']) if '涨跌幅' in industry_data.columns else None,
            "stocks": stocks
        }
    except Exception as e:
        return {"error": str(e)}


def search_stocks(keyword: str) -> dict[str, Any]:
    """搜索股票"""
    try:
        # 获取A股股票列表
        df = ak.stock_info_a_code_name()

        # 模糊搜索
        matches = df[
            df['code'].str.contains(keyword, case=False, na=False) |
            df['name'].str.contains(keyword, case=False, na=False)
        ]

        results = []
        for _, row in matches.head(20).iterrows():
            results.append({
                "symbol": row['code'],
                "name": row['name'],
                "exchange": "SH" if row['code'].startswith('6') else "SZ"
            })

        return {"results": results}
    except Exception as e:
        return {"error": str(e)}


def _parse_number(value: Any) -> float | None:
    """解析数字"""
    if value is None or value == '' or str(value) == 'nan':
        return None
    try:
        # 处理带单位的数字
        s = str(value).replace(',', '').strip()
        if s.endswith('亿'):
            return float(s[:-1]) * 1e8
        elif s.endswith('万'):
            return float(s[:-1]) * 1e4
        elif s.endswith('%'):
            return float(s[:-1]) / 100
        else:
            return float(s)
    except:
        return None


def main():
    """主函数 - 从命令行参数读取请求并返回结果"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No arguments provided"}))
        sys.exit(1)

    try:
        request = json.loads(sys.argv[1])
        endpoint = request.get("endpoint")
        params = request.get("params", {})

        result = {"error": "Unknown endpoint"}

        if endpoint == "stock-info":
            result = get_stock_info(params.get("symbol", ""))
        elif endpoint == "financials":
            result = get_financials(params.get("symbol", ""))
        elif endpoint == "market-data":
            result = get_market_data(
                params.get("symbol", ""),
                params.get("startDate"),
                params.get("endDate")
            )
        elif endpoint == "industry-data":
            result = get_industry_data(params.get("industry", ""))
        elif endpoint == "search":
            result = search_stocks(params.get("keyword", ""))

        print(json.dumps(result, ensure_ascii=False, default=str))

    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()