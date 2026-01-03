const ss = require('simple-statistics');

/**
 * Quantitative Analysis Utilities for MEAN-QUANT
 * Provides statistical and financial analysis functions
 */

/**
 * Calculate simple returns from price series
 * @param {number[]} prices - Array of prices
 * @returns {number[]} Array of returns
 */
function calculateReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

/**
 * Calculate logarithmic returns from price series
 * @param {number[]} prices - Array of prices
 * @returns {number[]} Array of log returns
 */
function calculateLogReturns(prices) {
  const logReturns = [];
  for (let i = 1; i < prices.length; i++) {
    logReturns.push(Math.log(prices[i] / prices[i - 1]));
  }
  return logReturns;
}

/**
 * Calculate cumulative returns
 * @param {number[]} returns - Array of returns
 * @returns {number[]} Array of cumulative returns
 */
function calculateCumulativeReturns(returns) {
  const cumulative = [];
  let product = 1;
  for (const r of returns) {
    product *= (1 + r);
    cumulative.push(product - 1);
  }
  return cumulative;
}

/**
 * Calculate annualized return
 * @param {number[]} returns - Array of daily returns
 * @param {number} tradingDays - Number of trading days (default 252)
 * @returns {number} Annualized return
 */
function calculateAnnualizedReturn(returns, tradingDays = 252) {
  const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const periods = returns.length / tradingDays;
  return Math.pow(1 + totalReturn, 1 / periods) - 1;
}

/**
 * Calculate annualized volatility (standard deviation)
 * @param {number[]} returns - Array of daily returns
 * @param {number} tradingDays - Number of trading days (default 252)
 * @returns {number} Annualized volatility
 */
function calculateVolatility(returns, tradingDays = 252) {
  const stdDev = ss.standardDeviation(returns);
  return stdDev * Math.sqrt(tradingDays);
}

/**
 * Calculate Sharpe Ratio
 * @param {number[]} returns - Array of returns
 * @param {number} riskFreeRate - Annual risk-free rate (default 0.02)
 * @param {number} tradingDays - Number of trading days (default 252)
 * @returns {number} Sharpe ratio
 */
function calculateSharpeRatio(returns, riskFreeRate = 0.02, tradingDays = 252) {
  const annualizedReturn = calculateAnnualizedReturn(returns, tradingDays);
  const annualizedVol = calculateVolatility(returns, tradingDays);

  if (annualizedVol === 0) {
    return 0;
  }

  return (annualizedReturn - riskFreeRate) / annualizedVol;
}

/**
 * Calculate Sortino Ratio (uses downside deviation)
 * @param {number[]} returns - Array of returns
 * @param {number} riskFreeRate - Annual risk-free rate (default 0.02)
 * @param {number} tradingDays - Number of trading days (default 252)
 * @returns {number} Sortino ratio
 */
function calculateSortinoRatio(returns, riskFreeRate = 0.02, tradingDays = 252) {
  const annualizedReturn = calculateAnnualizedReturn(returns, tradingDays);
  const dailyRiskFree = riskFreeRate / tradingDays;

  // Calculate downside returns
  const downsideReturns = returns
    .filter(r => r < dailyRiskFree)
    .map(r => Math.pow(r - dailyRiskFree, 2));

  if (downsideReturns.length === 0) {
    return Infinity;
  }

  const downsideDeviation = Math.sqrt(ss.mean(downsideReturns)) * Math.sqrt(tradingDays);

  if (downsideDeviation === 0) {
    return Infinity;
  }

  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Maximum Drawdown
 * @param {number[]} prices - Array of prices
 * @returns {object} Max drawdown info { maxDrawdown, peakDate, troughDate }
 */
function calculateMaxDrawdown(prices) {
  let maxDrawdown = 0;
  let peak = prices[0];
  let peakIndex = 0;
  let troughIndex = 0;

  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
      peakIndex = i;
    }

    const drawdown = (peak - prices[i]) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      troughIndex = i;
    }
  }

  return {
    maxDrawdown,
    peakIndex,
    troughIndex
  };
}

/**
 * Calculate Beta relative to a benchmark
 * @param {number[]} assetReturns - Asset returns
 * @param {number[]} benchmarkReturns - Benchmark returns
 * @returns {number} Beta
 */
function calculateBeta(assetReturns, benchmarkReturns) {
  const minLength = Math.min(assetReturns.length, benchmarkReturns.length);
  const asset = assetReturns.slice(0, minLength);
  const benchmark = benchmarkReturns.slice(0, minLength);

  const covariance = calculateCovariance(asset, benchmark);
  const benchmarkVariance = ss.variance(benchmark);

  if (benchmarkVariance === 0) {
    return 0;
  }

  return covariance / benchmarkVariance;
}

/**
 * Calculate Alpha (Jensen's Alpha)
 * @param {number[]} assetReturns - Asset returns
 * @param {number[]} benchmarkReturns - Benchmark returns
 * @param {number} riskFreeRate - Annual risk-free rate
 * @param {number} tradingDays - Number of trading days
 * @returns {number} Alpha
 */
function calculateAlpha(assetReturns, benchmarkReturns, riskFreeRate = 0.02, tradingDays = 252) {
  const assetAnnualized = calculateAnnualizedReturn(assetReturns, tradingDays);
  const benchmarkAnnualized = calculateAnnualizedReturn(benchmarkReturns, tradingDays);
  const beta = calculateBeta(assetReturns, benchmarkReturns);

  return assetAnnualized - (riskFreeRate + beta * (benchmarkAnnualized - riskFreeRate));
}

/**
 * Calculate Covariance between two arrays
 * @param {number[]} x - First array
 * @param {number[]} y - Second array
 * @returns {number} Covariance
 */
function calculateCovariance(x, y) {
  const meanX = ss.mean(x);
  const meanY = ss.mean(y);
  let sum = 0;

  for (let i = 0; i < x.length; i++) {
    sum += (x[i] - meanX) * (y[i] - meanY);
  }

  return sum / (x.length - 1);
}

/**
 * Calculate Correlation between two arrays
 * @param {number[]} x - First array
 * @param {number[]} y - Second array
 * @returns {number} Correlation coefficient
 */
function calculateCorrelation(x, y) {
  return ss.sampleCorrelation(x, y);
}

/**
 * Calculate Simple Moving Average
 * @param {number[]} prices - Array of prices
 * @param {number} period - Period for moving average
 * @returns {number[]} Array of SMA values
 */
function calculateSMA(prices, period) {
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

/**
 * Calculate Exponential Moving Average
 * @param {number[]} prices - Array of prices
 * @param {number} period - Period for EMA
 * @returns {number[]} Array of EMA values
 */
function calculateEMA(prices, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);

  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const newEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(newEma);
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param {number[]} prices - Array of prices
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} Array of RSI values
 */
function calculateRSI(prices, period = 14) {
  const rsi = [];
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate initial averages
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Calculate RSI
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

/**
 * Calculate Bollinger Bands
 * @param {number[]} prices - Array of prices
 * @param {number} period - Period for SMA (default 20)
 * @param {number} stdDevMultiplier - Standard deviation multiplier (default 2)
 * @returns {object} { upper, middle, lower } bands
 */
function calculateBollingerBands(prices, period = 20, stdDevMultiplier = 2) {
  const middle = calculateSMA(prices, period);
  const upper = [];
  const lower = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const stdDev = ss.standardDeviation(slice);
    const idx = i - period + 1;
    upper.push(middle[idx] + stdDevMultiplier * stdDev);
    lower.push(middle[idx] - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {number[]} prices - Array of prices
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line period (default 9)
 * @returns {object} { macdLine, signalLine, histogram }
 */
function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // Align the EMAs
  const offset = slowPeriod - fastPeriod;
  const macdLine = [];

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram
  const histogramOffset = signalPeriod - 1;
  const histogram = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[i + histogramOffset] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Value at Risk (VaR) using historical simulation
 * @param {number[]} returns - Array of returns
 * @param {number} confidenceLevel - Confidence level (default 0.95)
 * @returns {number} VaR value
 */
function calculateVaR(returns, confidenceLevel = 0.95) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  return -sortedReturns[index];
}

/**
 * Calculate Conditional VaR (Expected Shortfall)
 * @param {number[]} returns - Array of returns
 * @param {number} confidenceLevel - Confidence level (default 0.95)
 * @returns {number} CVaR value
 */
function calculateCVaR(returns, confidenceLevel = 0.95) {
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const cutoffIndex = Math.floor((1 - confidenceLevel) * sortedReturns.length);
  const tailReturns = sortedReturns.slice(0, cutoffIndex + 1);
  return -ss.mean(tailReturns);
}

/**
 * Generate comprehensive statistics summary
 * @param {number[]} prices - Array of prices
 * @param {number[]} benchmarkPrices - Optional benchmark prices
 * @returns {object} Statistics summary
 */
function generateStatsSummary(prices, benchmarkPrices = null) {
  const returns = calculateReturns(prices);

  const summary = {
    totalReturn: (prices[prices.length - 1] / prices[0]) - 1,
    annualizedReturn: calculateAnnualizedReturn(returns),
    volatility: calculateVolatility(returns),
    sharpeRatio: calculateSharpeRatio(returns),
    sortinoRatio: calculateSortinoRatio(returns),
    maxDrawdown: calculateMaxDrawdown(prices).maxDrawdown,
    var95: calculateVaR(returns, 0.95),
    cvar95: calculateCVaR(returns, 0.95),
    skewness: ss.sampleSkewness(returns),
    kurtosis: ss.sampleKurtosis(returns),
    mean: ss.mean(returns),
    median: ss.median(returns),
    standardDeviation: ss.standardDeviation(returns),
    min: ss.min(returns),
    max: ss.max(returns)
  };

  if (benchmarkPrices && benchmarkPrices.length > 0) {
    const benchmarkReturns = calculateReturns(benchmarkPrices);
    summary.beta = calculateBeta(returns, benchmarkReturns);
    summary.alpha = calculateAlpha(returns, benchmarkReturns);
    summary.correlation = calculateCorrelation(returns, benchmarkReturns);
  }

  return summary;
}

module.exports = {
  calculateReturns,
  calculateLogReturns,
  calculateCumulativeReturns,
  calculateAnnualizedReturn,
  calculateVolatility,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateBeta,
  calculateAlpha,
  calculateCovariance,
  calculateCorrelation,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateVaR,
  calculateCVaR,
  generateStatsSummary
};
