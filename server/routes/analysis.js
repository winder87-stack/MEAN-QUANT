const express = require('express');
const router = express.Router();
const { param, query, body, validationResult } = require('express-validator');
const Stock = require('../models/Stock');
const quantAnalysis = require('../utils/quantAnalysis');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/analysis/stats/:symbol
 * Get comprehensive statistics for a stock
 */
router.get('/stats/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('benchmark').optional().isString(),
  query('period').optional().isInt({ min: 30, max: 1000 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { benchmark = 'SPY', period = 252 } = req.query;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    // Get price data
    const priceData = stock.priceHistory
      .slice(-parseInt(period))
      .map(p => p.adjustedClose);

    if (priceData.length < 30) {
      return res.status(400).json({
        error: {
          message: 'Insufficient price data for analysis (minimum 30 data points required)',
          status: 400
        }
      });
    }

    // Get benchmark data if available
    let benchmarkPrices = null;
    const benchmarkStock = await Stock.findBySymbol(benchmark);

    if (benchmarkStock) {
      benchmarkPrices = benchmarkStock.priceHistory
        .slice(-parseInt(period))
        .map(p => p.adjustedClose);
    }

    const stats = quantAnalysis.generateStatsSummary(priceData, benchmarkPrices);

    res.json({
      symbol: stock.symbol,
      name: stock.name,
      period: priceData.length,
      benchmark: benchmarkStock ? benchmark : null,
      statistics: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/returns/:symbol
 * Get return calculations for a stock
 */
router.get('/returns/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('type').optional().isIn(['simple', 'log', 'cumulative']),
  query('period').optional().isInt({ min: 1, max: 1000 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { type = 'simple', period = 252 } = req.query;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    const priceData = stock.priceHistory.slice(-parseInt(period));
    const prices = priceData.map(p => p.adjustedClose);

    let returns;
    switch (type) {
    case 'log':
      returns = quantAnalysis.calculateLogReturns(prices);
      break;
    case 'cumulative':
      returns = quantAnalysis.calculateCumulativeReturns(
        quantAnalysis.calculateReturns(prices)
      );
      break;
    default:
      returns = quantAnalysis.calculateReturns(prices);
    }

    // Pair returns with dates
    const dates = priceData.slice(1).map(p => p.date);
    const data = returns.map((r, i) => ({
      date: dates[i],
      return: r
    }));

    res.json({
      symbol: stock.symbol,
      type,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/indicators/:symbol
 * Get technical indicators for a stock
 */
router.get('/indicators/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('indicator').isIn(['sma', 'ema', 'rsi', 'macd', 'bollinger']),
  query('period').optional().isInt({ min: 1, max: 200 }),
  query('limit').optional().isInt({ min: 1, max: 500 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { indicator, period = 14, limit = 100 } = req.query;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    // Get enough price data for the calculation
    const dataNeeded = parseInt(limit) + parseInt(period) * 2;
    const priceData = stock.priceHistory.slice(-dataNeeded);
    const prices = priceData.map(p => p.adjustedClose);
    const dates = priceData.map(p => p.date);

    let result;
    let startIndex;

    switch (indicator) {
    case 'sma':
      result = quantAnalysis.calculateSMA(prices, parseInt(period));
      startIndex = parseInt(period) - 1;
      break;
    case 'ema':
      result = quantAnalysis.calculateEMA(prices, parseInt(period));
      startIndex = parseInt(period) - 1;
      break;
    case 'rsi':
      result = quantAnalysis.calculateRSI(prices, parseInt(period));
      startIndex = parseInt(period) + 1;
      break;
    case 'macd':
      result = quantAnalysis.calculateMACD(prices);
      startIndex = 33; // 26 + 9 - 2 for MACD
      break;
    case 'bollinger':
      result = quantAnalysis.calculateBollingerBands(prices, parseInt(period));
      startIndex = parseInt(period) - 1;
      break;
    default:
      return res.status(400).json({
        error: {
          message: 'Invalid indicator',
          status: 400
        }
      });
    }

    // Format response based on indicator type
    let data;
    if (indicator === 'macd') {
      const macdDates = dates.slice(startIndex);
      data = result.histogram.slice(-parseInt(limit)).map((h, i) => ({
        date: macdDates[startIndex + i],
        macdLine: result.macdLine[result.macdLine.length - parseInt(limit) + i],
        signalLine: result.signalLine[result.signalLine.length - parseInt(limit) + i],
        histogram: h
      }));
    } else if (indicator === 'bollinger') {
      const bbDates = dates.slice(startIndex);
      data = result.middle.slice(-parseInt(limit)).map((m, i) => ({
        date: bbDates[i],
        upper: result.upper[result.upper.length - parseInt(limit) + i],
        middle: m,
        lower: result.lower[result.lower.length - parseInt(limit) + i]
      }));
    } else {
      const indicatorDates = dates.slice(startIndex);
      const values = Array.isArray(result) ? result : [result];
      data = values.slice(-parseInt(limit)).map((v, i) => ({
        date: indicatorDates[values.length - parseInt(limit) + i],
        value: v
      }));
    }

    res.json({
      symbol: stock.symbol,
      indicator,
      period: parseInt(period),
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/correlation
 * Calculate correlation between multiple stocks
 */
router.post('/correlation', [
  body('symbols').isArray({ min: 2, max: 20 }),
  body('symbols.*').isString().isLength({ min: 1, max: 10 }),
  body('period').optional().isInt({ min: 30, max: 1000 })
], validate, async (req, res, next) => {
  try {
    const { symbols, period = 252 } = req.body;

    const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];

    // Fetch all stocks
    const stocks = await Stock.find({
      symbol: { $in: uniqueSymbols }
    });

    if (stocks.length < 2) {
      return res.status(400).json({
        error: {
          message: 'At least 2 valid stocks are required for correlation analysis',
          status: 400
        }
      });
    }

    // Calculate returns for each stock
    const stockReturns = {};
    stocks.forEach(stock => {
      const prices = stock.priceHistory
        .slice(-parseInt(period))
        .map(p => p.adjustedClose);
      stockReturns[stock.symbol] = quantAnalysis.calculateReturns(prices);
    });

    // Build correlation matrix
    const matrix = {};
    const symbolList = stocks.map(s => s.symbol);

    symbolList.forEach(sym1 => {
      matrix[sym1] = {};
      symbolList.forEach(sym2 => {
        if (sym1 === sym2) {
          matrix[sym1][sym2] = 1;
        } else {
          matrix[sym1][sym2] = quantAnalysis.calculateCorrelation(
            stockReturns[sym1],
            stockReturns[sym2]
          );
        }
      });
    });

    res.json({
      symbols: symbolList,
      period: parseInt(period),
      correlationMatrix: matrix
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analysis/risk
 * Calculate risk metrics for a portfolio or stock
 */
router.post('/risk', [
  body('symbols').isArray({ min: 1, max: 20 }),
  body('symbols.*').isString().isLength({ min: 1, max: 10 }),
  body('weights').optional().isArray(),
  body('weights.*').optional().isFloat({ min: 0, max: 1 }),
  body('period').optional().isInt({ min: 30, max: 1000 }),
  body('confidenceLevel').optional().isFloat({ min: 0.9, max: 0.99 })
], validate, async (req, res, next) => {
  try {
    const {
      symbols,
      weights,
      period = 252,
      confidenceLevel = 0.95
    } = req.body;

    const uniqueSymbols = [...new Set(symbols.map(s => s.toUpperCase()))];

    // Default to equal weights if not provided
    const portfolioWeights = weights || uniqueSymbols.map(() => 1 / uniqueSymbols.length);

    if (portfolioWeights.length !== uniqueSymbols.length) {
      return res.status(400).json({
        error: {
          message: 'Number of weights must match number of symbols',
          status: 400
        }
      });
    }

    // Fetch all stocks
    const stocks = await Stock.find({
      symbol: { $in: uniqueSymbols }
    });

    if (stocks.length !== uniqueSymbols.length) {
      const foundSymbols = stocks.map(s => s.symbol);
      const missingSymbols = uniqueSymbols.filter(s => !foundSymbols.includes(s));
      return res.status(404).json({
        error: {
          message: `Stocks not found: ${missingSymbols.join(', ')}`,
          status: 404
        }
      });
    }

    // Calculate portfolio returns
    const stockReturns = stocks.map(stock => {
      const prices = stock.priceHistory
        .slice(-parseInt(period))
        .map(p => p.adjustedClose);
      return quantAnalysis.calculateReturns(prices);
    });

    // Calculate weighted portfolio returns
    const minLength = Math.min(...stockReturns.map(r => r.length));
    const portfolioReturns = [];

    for (let i = 0; i < minLength; i++) {
      let weightedReturn = 0;
      for (let j = 0; j < stockReturns.length; j++) {
        weightedReturn += stockReturns[j][i] * portfolioWeights[j];
      }
      portfolioReturns.push(weightedReturn);
    }

    // Calculate risk metrics
    const var95 = quantAnalysis.calculateVaR(portfolioReturns, confidenceLevel);
    const cvar95 = quantAnalysis.calculateCVaR(portfolioReturns, confidenceLevel);

    // Get price arrays for max drawdown
    const portfolioPrices = [100]; // Start with $100
    portfolioReturns.forEach(r => {
      portfolioPrices.push(portfolioPrices[portfolioPrices.length - 1] * (1 + r));
    });
    const maxDrawdown = quantAnalysis.calculateMaxDrawdown(portfolioPrices);

    res.json({
      symbols: stocks.map(s => s.symbol),
      weights: portfolioWeights,
      period: minLength,
      confidenceLevel,
      riskMetrics: {
        valueAtRisk: var95,
        conditionalVaR: cvar95,
        maxDrawdown: maxDrawdown.maxDrawdown,
        volatility: quantAnalysis.calculateVolatility(portfolioReturns),
        sharpeRatio: quantAnalysis.calculateSharpeRatio(portfolioReturns),
        sortinoRatio: quantAnalysis.calculateSortinoRatio(portfolioReturns)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analysis/compare
 * Compare multiple stocks
 */
router.get('/compare', [
  query('symbols').isString(),
  query('period').optional().isInt({ min: 30, max: 1000 })
], validate, async (req, res, next) => {
  try {
    const { symbols, period = 252 } = req.query;
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());

    if (symbolList.length < 2) {
      return res.status(400).json({
        error: {
          message: 'At least 2 symbols are required for comparison',
          status: 400
        }
      });
    }

    const stocks = await Stock.find({
      symbol: { $in: symbolList }
    });

    const comparison = stocks.map(stock => {
      const prices = stock.priceHistory
        .slice(-parseInt(period))
        .map(p => p.adjustedClose);
      const returns = quantAnalysis.calculateReturns(prices);

      return {
        symbol: stock.symbol,
        name: stock.name,
        metrics: {
          totalReturn: (prices[prices.length - 1] / prices[0]) - 1,
          annualizedReturn: quantAnalysis.calculateAnnualizedReturn(returns),
          volatility: quantAnalysis.calculateVolatility(returns),
          sharpeRatio: quantAnalysis.calculateSharpeRatio(returns),
          maxDrawdown: quantAnalysis.calculateMaxDrawdown(prices).maxDrawdown
        }
      };
    });

    res.json({
      period: parseInt(period),
      comparison
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
