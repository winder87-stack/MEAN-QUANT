const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const Stock = require('../models/Stock');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * GET /api/market-data/stocks
 * Get all stocks with optional filtering
 */
router.get('/stocks', [
  query('sector').optional().isString(),
  query('exchange').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('skip').optional().isInt({ min: 0 })
], validate, async (req, res, next) => {
  try {
    const { sector, exchange, limit = 50, skip = 0 } = req.query;

    const filter = {};
    if (sector) {
      filter.sector = sector;
    }
    if (exchange) {
      filter.exchange = exchange;
    }

    const stocks = await Stock.find(filter)
      .select('-priceHistory')
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ symbol: 1 });

    const total = await Stock.countDocuments(filter);

    res.json({
      data: stocks,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + stocks.length < total
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/market-data/stocks/:symbol
 * Get stock details by symbol
 */
router.get('/stocks/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    res.json({ data: stock });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/market-data/stocks/:symbol/prices
 * Get price history for a stock
 */
router.get('/stocks/:symbol/prices', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { startDate, endDate, limit = 365 } = req.query;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    let prices = stock.priceHistory;

    // Filter by date range if provided
    if (startDate || endDate) {
      prices = prices.filter(price => {
        const priceDate = new Date(price.date);
        if (startDate && priceDate < new Date(startDate)) {
          return false;
        }
        if (endDate && priceDate > new Date(endDate)) {
          return false;
        }
        return true;
      });
    }

    // Sort by date descending and limit
    prices = prices
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));

    res.json({
      symbol: stock.symbol,
      name: stock.name,
      data: prices,
      count: prices.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/market-data/stocks
 * Create or update a stock
 */
router.post('/stocks', [
  body('symbol').isString().isLength({ min: 1, max: 10 }).toUpperCase(),
  body('name').isString().isLength({ min: 1, max: 200 }),
  body('exchange').optional().isString(),
  body('sector').optional().isString(),
  body('industry').optional().isString()
], validate, async (req, res, next) => {
  try {
    const { symbol, name, exchange, sector, industry } = req.body;

    let stock = await Stock.findBySymbol(symbol);

    if (stock) {
      // Update existing stock
      stock.name = name;
      if (exchange) {
        stock.exchange = exchange;
      }
      if (sector) {
        stock.sector = sector;
      }
      if (industry) {
        stock.industry = industry;
      }
      stock.lastUpdated = new Date();
      await stock.save();
    } else {
      // Create new stock
      stock = new Stock({
        symbol: symbol.toUpperCase(),
        name,
        exchange,
        sector,
        industry
      });
      await stock.save();
    }

    res.status(201).json({ data: stock });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/market-data/stocks/:symbol/prices
 * Add price data to a stock
 */
router.post('/stocks/:symbol/prices', [
  param('symbol').isString().isLength({ min: 1, max: 10 }),
  body('prices').isArray({ min: 1 }),
  body('prices.*.date').isISO8601(),
  body('prices.*.open').isNumeric(),
  body('prices.*.high').isNumeric(),
  body('prices.*.low').isNumeric(),
  body('prices.*.close').isNumeric(),
  body('prices.*.adjustedClose').optional().isNumeric(),
  body('prices.*.volume').isNumeric()
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;
    const { prices } = req.body;

    const stock = await Stock.findBySymbol(symbol);

    if (!stock) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    // Process and add price data
    const newPrices = prices.map(p => ({
      date: new Date(p.date),
      open: parseFloat(p.open),
      high: parseFloat(p.high),
      low: parseFloat(p.low),
      close: parseFloat(p.close),
      adjustedClose: parseFloat(p.adjustedClose || p.close),
      volume: parseInt(p.volume)
    }));

    // Add new prices and remove duplicates by date
    const existingDates = new Set(stock.priceHistory.map(p => p.date.toISOString()));
    const uniqueNewPrices = newPrices.filter(p => !existingDates.has(p.date.toISOString()));

    stock.priceHistory.push(...uniqueNewPrices);
    stock.priceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    stock.lastUpdated = new Date();

    await stock.save();

    res.status(201).json({
      message: `Added ${uniqueNewPrices.length} price records`,
      totalRecords: stock.priceHistory.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/market-data/search
 * Search stocks by name or symbol
 */
router.get('/search', [
  query('q').isString().isLength({ min: 1, max: 50 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], validate, async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    const stocks = await Stock.find({
      $or: [
        { symbol: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
      .select('symbol name exchange sector')
      .limit(parseInt(limit));

    res.json({ data: stocks });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/market-data/stocks/:symbol
 * Delete a stock
 */
router.delete('/stocks/:symbol', [
  param('symbol').isString().isLength({ min: 1, max: 10 })
], validate, async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const result = await Stock.deleteOne({ symbol: symbol.toUpperCase() });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: {
          message: `Stock with symbol ${symbol} not found`,
          status: 404
        }
      });
    }

    res.json({ message: `Stock ${symbol} deleted successfully` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
