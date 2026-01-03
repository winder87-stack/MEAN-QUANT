const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Portfolio = require('../models/Portfolio');
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

// Temporary auth middleware (replace with proper JWT auth)
const tempAuth = (req, _res, next) => {
  // For demo purposes, use a fixed user ID
  // In production, this would be extracted from JWT token
  req.userId = req.headers['x-user-id'] || '000000000000000000000001';
  next();
};

router.use(tempAuth);

/**
 * GET /api/portfolio
 * Get all portfolios for the current user
 */
router.get('/', async (req, res, next) => {
  try {
    const portfolios = await Portfolio.find({ userId: req.userId })
      .select('-transactions')
      .sort({ createdAt: -1 });

    res.json({ data: portfolios });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio/:id
 * Get a specific portfolio by ID
 */
router.get('/:id', [
  param('id').isMongoId()
], validate, async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    res.json({ data: portfolio });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/portfolio
 * Create a new portfolio
 */
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('cashBalance').optional().isFloat({ min: 0 }),
  body('benchmarkSymbol').optional().isString()
], validate, async (req, res, next) => {
  try {
    const { name, description, currency, cashBalance, benchmarkSymbol } = req.body;

    const portfolio = new Portfolio({
      userId: req.userId,
      name,
      description,
      currency: currency || 'USD',
      cashBalance: cashBalance || 0,
      benchmarkSymbol: benchmarkSymbol || 'SPY'
    });

    await portfolio.save();

    res.status(201).json({ data: portfolio });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/portfolio/:id
 * Update a portfolio
 */
router.put('/:id', [
  param('id').isMongoId(),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('cashBalance').optional().isFloat({ min: 0 }),
  body('benchmarkSymbol').optional().isString(),
  body('isPublic').optional().isBoolean()
], validate, async (req, res, next) => {
  try {
    const { name, description, cashBalance, benchmarkSymbol, isPublic } = req.body;

    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    if (name) {
      portfolio.name = name;
    }
    if (description !== undefined) {
      portfolio.description = description;
    }
    if (cashBalance !== undefined) {
      portfolio.cashBalance = cashBalance;
    }
    if (benchmarkSymbol) {
      portfolio.benchmarkSymbol = benchmarkSymbol;
    }
    if (isPublic !== undefined) {
      portfolio.isPublic = isPublic;
    }

    await portfolio.save();

    res.json({ data: portfolio });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/portfolio/:id
 * Delete a portfolio
 */
router.delete('/:id', [
  param('id').isMongoId()
], validate, async (req, res, next) => {
  try {
    const result = await Portfolio.deleteOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    res.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/portfolio/:id/transaction
 * Add a transaction to a portfolio
 */
router.post('/:id/transaction', [
  param('id').isMongoId(),
  body('type').isIn(['buy', 'sell', 'dividend', 'split']),
  body('symbol').isString().isLength({ min: 1, max: 10 }),
  body('shares').isFloat({ min: 0.0001 }),
  body('price').isFloat({ min: 0 }),
  body('fees').optional().isFloat({ min: 0 }),
  body('date').optional().isISO8601(),
  body('notes').optional().isString().isLength({ max: 500 })
], validate, async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    const transaction = {
      type: req.body.type,
      symbol: req.body.symbol.toUpperCase(),
      shares: req.body.shares,
      price: req.body.price,
      fees: req.body.fees || 0,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      notes: req.body.notes
    };

    portfolio.addTransaction(transaction);
    await portfolio.save();

    res.status(201).json({
      message: 'Transaction added successfully',
      data: portfolio
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio/:id/allocation
 * Get portfolio allocation
 */
router.get('/:id/allocation', [
  param('id').isMongoId()
], validate, async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    const allocation = portfolio.getAllocation();

    res.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.name,
      allocation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio/:id/performance
 * Get portfolio performance metrics
 */
router.get('/:id/performance', [
  param('id').isMongoId()
], validate, async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    // Get current prices for holdings
    const symbols = portfolio.holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } });

    const stockPrices = {};
    stocks.forEach(stock => {
      if (stock.priceHistory.length > 0) {
        const latestPrice = stock.priceHistory[stock.priceHistory.length - 1];
        stockPrices[stock.symbol] = latestPrice.adjustedClose;
      }
    });

    // Calculate portfolio value and returns
    let totalCost = 0;
    let totalValue = 0;
    const holdingsDetails = portfolio.holdings.map(holding => {
      const currentPrice = stockPrices[holding.symbol] || holding.averageCost;
      const cost = holding.shares * holding.averageCost;
      const value = holding.shares * currentPrice;
      const gain = value - cost;
      const gainPercent = cost > 0 ? (gain / cost) * 100 : 0;

      totalCost += cost;
      totalValue += value;

      return {
        symbol: holding.symbol,
        shares: holding.shares,
        averageCost: holding.averageCost,
        currentPrice,
        cost,
        value,
        gain,
        gainPercent
      };
    });

    const totalValueWithCash = totalValue + portfolio.cashBalance;
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    res.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.name,
      summary: {
        totalCost,
        totalValue,
        cashBalance: portfolio.cashBalance,
        totalValueWithCash,
        totalGain,
        totalGainPercent
      },
      holdings: holdingsDetails
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/portfolio/:id/risk
 * Get portfolio risk analysis
 */
router.get('/:id/risk', [
  param('id').isMongoId()
], validate, async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!portfolio) {
      return res.status(404).json({
        error: {
          message: 'Portfolio not found',
          status: 404
        }
      });
    }

    if (portfolio.holdings.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Portfolio has no holdings for risk analysis',
          status: 400
        }
      });
    }

    const symbols = portfolio.holdings.map(h => h.symbol);
    const stocks = await Stock.find({ symbol: { $in: symbols } });

    // Calculate weights based on current allocation
    const allocation = portfolio.getAllocation();
    const totalValue = allocation.reduce((sum, a) => sum + a.value, 0);
    const weights = portfolio.holdings.map(h => {
      const alloc = allocation.find(a => a.symbol === h.symbol);
      return alloc ? alloc.value / totalValue : 0;
    });

    // Get returns for each stock
    const stockReturns = [];
    stocks.forEach(stock => {
      if (stock.priceHistory.length > 30) {
        const prices = stock.priceHistory
          .slice(-252)
          .map(p => p.adjustedClose);
        stockReturns.push(quantAnalysis.calculateReturns(prices));
      }
    });

    if (stockReturns.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Insufficient price history for risk analysis',
          status: 400
        }
      });
    }

    // Calculate weighted portfolio returns
    const minLength = Math.min(...stockReturns.map(r => r.length));
    const portfolioReturns = [];

    for (let i = 0; i < minLength; i++) {
      let weightedReturn = 0;
      for (let j = 0; j < stockReturns.length; j++) {
        weightedReturn += stockReturns[j][i] * (weights[j] || 0);
      }
      portfolioReturns.push(weightedReturn);
    }

    // Calculate risk metrics
    const portfolioPrices = [100];
    portfolioReturns.forEach(r => {
      portfolioPrices.push(portfolioPrices[portfolioPrices.length - 1] * (1 + r));
    });

    res.json({
      portfolioId: portfolio._id,
      portfolioName: portfolio.name,
      period: minLength,
      riskMetrics: {
        volatility: quantAnalysis.calculateVolatility(portfolioReturns),
        sharpeRatio: quantAnalysis.calculateSharpeRatio(portfolioReturns),
        sortinoRatio: quantAnalysis.calculateSortinoRatio(portfolioReturns),
        maxDrawdown: quantAnalysis.calculateMaxDrawdown(portfolioPrices).maxDrawdown,
        valueAtRisk95: quantAnalysis.calculateVaR(portfolioReturns, 0.95),
        conditionalVaR95: quantAnalysis.calculateCVaR(portfolioReturns, 0.95)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
