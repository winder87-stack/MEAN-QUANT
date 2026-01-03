const quantAnalysis = require('../server/utils/quantAnalysis');

describe('Quantitative Analysis Utilities', () => {
  // Sample price data for testing
  const samplePrices = [100, 102, 101, 105, 103, 108, 110, 107, 112, 115];
  const sampleReturns = quantAnalysis.calculateReturns(samplePrices);

  describe('calculateReturns', () => {
    test('should calculate simple returns correctly', () => {
      const returns = quantAnalysis.calculateReturns(samplePrices);

      expect(returns.length).toBe(samplePrices.length - 1);
      expect(returns[0]).toBeCloseTo(0.02, 4); // (102-100)/100 = 0.02
      expect(returns[1]).toBeCloseTo(-0.0098, 4); // (101-102)/102
    });

    test('should handle empty array', () => {
      const returns = quantAnalysis.calculateReturns([]);
      expect(returns).toEqual([]);
    });

    test('should handle single element', () => {
      const returns = quantAnalysis.calculateReturns([100]);
      expect(returns).toEqual([]);
    });
  });

  describe('calculateLogReturns', () => {
    test('should calculate log returns correctly', () => {
      const logReturns = quantAnalysis.calculateLogReturns(samplePrices);

      expect(logReturns.length).toBe(samplePrices.length - 1);
      expect(logReturns[0]).toBeCloseTo(Math.log(102 / 100), 6);
    });
  });

  describe('calculateCumulativeReturns', () => {
    test('should calculate cumulative returns correctly', () => {
      const returns = [0.1, 0.05, -0.02];
      const cumulative = quantAnalysis.calculateCumulativeReturns(returns);

      expect(cumulative.length).toBe(3);
      expect(cumulative[0]).toBeCloseTo(0.1, 4);
      expect(cumulative[1]).toBeCloseTo(0.155, 4); // (1.1 * 1.05) - 1
      expect(cumulative[2]).toBeCloseTo(0.1319, 4); // (1.155 * 0.98) - 1
    });
  });

  describe('calculateVolatility', () => {
    test('should calculate annualized volatility', () => {
      const volatility = quantAnalysis.calculateVolatility(sampleReturns);

      expect(volatility).toBeGreaterThan(0);
      expect(typeof volatility).toBe('number');
    });

    test('should scale by trading days', () => {
      const vol252 = quantAnalysis.calculateVolatility(sampleReturns, 252);
      const vol365 = quantAnalysis.calculateVolatility(sampleReturns, 365);

      expect(vol365).toBeGreaterThan(vol252);
    });
  });

  describe('calculateSharpeRatio', () => {
    test('should calculate Sharpe ratio', () => {
      const sharpe = quantAnalysis.calculateSharpeRatio(sampleReturns);

      expect(typeof sharpe).toBe('number');
      expect(isFinite(sharpe)).toBe(true);
    });

    test('should incorporate risk-free rate', () => {
      const sharpe0 = quantAnalysis.calculateSharpeRatio(sampleReturns, 0);
      const sharpe5 = quantAnalysis.calculateSharpeRatio(sampleReturns, 0.05);

      // Higher risk-free rate should lower Sharpe ratio
      expect(sharpe0).toBeGreaterThan(sharpe5);
    });
  });

  describe('calculateSortinoRatio', () => {
    test('should calculate Sortino ratio', () => {
      const sortino = quantAnalysis.calculateSortinoRatio(sampleReturns);

      expect(typeof sortino).toBe('number');
    });

    test('should be different from Sharpe ratio', () => {
      const sharpe = quantAnalysis.calculateSharpeRatio(sampleReturns);
      const sortino = quantAnalysis.calculateSortinoRatio(sampleReturns);

      // Sortino and Sharpe should generally differ
      expect(sortino).not.toBeCloseTo(sharpe, 1);
    });
  });

  describe('calculateMaxDrawdown', () => {
    test('should calculate maximum drawdown correctly', () => {
      const drawdownPrices = [100, 110, 95, 105, 90, 100];
      const result = quantAnalysis.calculateMaxDrawdown(drawdownPrices);

      expect(result.maxDrawdown).toBeGreaterThan(0);
      expect(result.maxDrawdown).toBeLessThanOrEqual(1);
    });

    test('should return 0 for monotonically increasing prices', () => {
      const increasingPrices = [100, 101, 102, 103, 104];
      const result = quantAnalysis.calculateMaxDrawdown(increasingPrices);

      expect(result.maxDrawdown).toBe(0);
    });

    test('should identify correct drawdown for known case', () => {
      // Peak at 120, trough at 80 = 33.33% drawdown
      const prices = [100, 120, 90, 80, 100];
      const result = quantAnalysis.calculateMaxDrawdown(prices);

      expect(result.maxDrawdown).toBeCloseTo(0.333, 2);
    });
  });

  describe('calculateBeta', () => {
    test('should calculate beta relative to benchmark', () => {
      const assetReturns = [0.02, 0.01, -0.01, 0.03, 0.02];
      const benchmarkReturns = [0.01, 0.02, -0.02, 0.01, 0.01];

      const beta = quantAnalysis.calculateBeta(assetReturns, benchmarkReturns);

      expect(typeof beta).toBe('number');
      expect(isFinite(beta)).toBe(true);
    });

    test('should return positive beta for positively correlated returns', () => {
      const assetReturns = [0.01, 0.02, -0.01, 0.03, 0.02];
      const benchmarkReturns = [0.008, 0.018, -0.008, 0.025, 0.015];

      const beta = quantAnalysis.calculateBeta(assetReturns, benchmarkReturns);

      expect(beta).toBeGreaterThan(0);
    });
  });

  describe('calculateCorrelation', () => {
    test('should return 1 for identical arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      const correlation = quantAnalysis.calculateCorrelation(arr, arr);

      expect(correlation).toBeCloseTo(1, 6);
    });

    test('should return -1 for perfectly negatively correlated', () => {
      const arr1 = [1, 2, 3, 4, 5];
      const arr2 = [5, 4, 3, 2, 1];
      const correlation = quantAnalysis.calculateCorrelation(arr1, arr2);

      expect(correlation).toBeCloseTo(-1, 6);
    });

    test('should return value between -1 and 1', () => {
      const arr1 = [1, 3, 2, 5, 4];
      const arr2 = [2, 1, 4, 3, 5];
      const correlation = quantAnalysis.calculateCorrelation(arr1, arr2);

      expect(correlation).toBeGreaterThanOrEqual(-1);
      expect(correlation).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateSMA', () => {
    test('should calculate simple moving average correctly', () => {
      const prices = [10, 11, 12, 13, 14, 15];
      const sma = quantAnalysis.calculateSMA(prices, 3);

      expect(sma.length).toBe(4); // 6 - 3 + 1
      expect(sma[0]).toBeCloseTo(11, 4); // (10+11+12)/3
      expect(sma[1]).toBeCloseTo(12, 4); // (11+12+13)/3
    });

    test('should handle period equal to array length', () => {
      const prices = [10, 20, 30];
      const sma = quantAnalysis.calculateSMA(prices, 3);

      expect(sma.length).toBe(1);
      expect(sma[0]).toBeCloseTo(20, 4);
    });
  });

  describe('calculateEMA', () => {
    test('should calculate exponential moving average', () => {
      const prices = [10, 11, 12, 13, 14, 15];
      const ema = quantAnalysis.calculateEMA(prices, 3);

      expect(ema.length).toBe(4);
      expect(ema[0]).toBeCloseTo(11, 4); // First EMA = SMA
    });

    test('should give more weight to recent prices', () => {
      const prices = [10, 10, 10, 10, 20]; // Sudden jump
      const sma = quantAnalysis.calculateSMA(prices, 3);
      const ema = quantAnalysis.calculateEMA(prices, 3);

      // EMA should react more to the jump
      expect(ema[ema.length - 1]).toBeGreaterThan(sma[sma.length - 1]);
    });
  });

  describe('calculateRSI', () => {
    test('should return values between 0 and 100', () => {
      const prices = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08,
        45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64];
      const rsi = quantAnalysis.calculateRSI(prices, 14);

      rsi.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('calculateBollingerBands', () => {
    test('should return upper, middle, and lower bands', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      const bands = quantAnalysis.calculateBollingerBands(prices, 20, 2);

      expect(bands).toHaveProperty('upper');
      expect(bands).toHaveProperty('middle');
      expect(bands).toHaveProperty('lower');
    });

    test('should have upper > middle > lower', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
      const bands = quantAnalysis.calculateBollingerBands(prices, 20, 2);

      for (let i = 0; i < bands.middle.length; i++) {
        expect(bands.upper[i]).toBeGreaterThan(bands.middle[i]);
        expect(bands.middle[i]).toBeGreaterThan(bands.lower[i]);
      }
    });
  });

  describe('calculateMACD', () => {
    test('should return macdLine, signalLine, and histogram', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
      const macd = quantAnalysis.calculateMACD(prices);

      expect(macd).toHaveProperty('macdLine');
      expect(macd).toHaveProperty('signalLine');
      expect(macd).toHaveProperty('histogram');
    });
  });

  describe('calculateVaR', () => {
    test('should calculate Value at Risk', () => {
      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.02, 0.01];
      const var95 = quantAnalysis.calculateVaR(returns, 0.95);

      expect(var95).toBeGreaterThan(0);
    });

    test('should increase with lower confidence level', () => {
      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.02, 0.01];
      const var95 = quantAnalysis.calculateVaR(returns, 0.95);
      const var99 = quantAnalysis.calculateVaR(returns, 0.99);

      expect(var99).toBeGreaterThanOrEqual(var95);
    });
  });

  describe('calculateCVaR', () => {
    test('should calculate Conditional VaR', () => {
      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.02, 0.01];
      const cvar95 = quantAnalysis.calculateCVaR(returns, 0.95);

      expect(cvar95).toBeGreaterThan(0);
    });

    test('should be greater than or equal to VaR', () => {
      const returns = [-0.05, -0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.04, -0.02, 0.01];
      const var95 = quantAnalysis.calculateVaR(returns, 0.95);
      const cvar95 = quantAnalysis.calculateCVaR(returns, 0.95);

      expect(cvar95).toBeGreaterThanOrEqual(var95);
    });
  });

  describe('generateStatsSummary', () => {
    test('should generate comprehensive statistics', () => {
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i + Math.random() * 5);
      const summary = quantAnalysis.generateStatsSummary(prices);

      expect(summary).toHaveProperty('totalReturn');
      expect(summary).toHaveProperty('annualizedReturn');
      expect(summary).toHaveProperty('volatility');
      expect(summary).toHaveProperty('sharpeRatio');
      expect(summary).toHaveProperty('sortinoRatio');
      expect(summary).toHaveProperty('maxDrawdown');
      expect(summary).toHaveProperty('var95');
      expect(summary).toHaveProperty('cvar95');
      expect(summary).toHaveProperty('skewness');
      expect(summary).toHaveProperty('kurtosis');
    });

    test('should include benchmark metrics when provided', () => {
      const prices = Array.from({ length: 100 }, (_, i) => 100 + i);
      const benchmarkPrices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.8);

      const summary = quantAnalysis.generateStatsSummary(prices, benchmarkPrices);

      expect(summary).toHaveProperty('beta');
      expect(summary).toHaveProperty('alpha');
      expect(summary).toHaveProperty('correlation');
    });
  });

  describe('calculateCovariance', () => {
    test('should calculate covariance correctly', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];

      const covariance = quantAnalysis.calculateCovariance(x, y);

      expect(covariance).toBeGreaterThan(0);
    });

    test('should return 0 for uncorrelated data', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [3, 3, 3, 3, 3]; // Constant

      const covariance = quantAnalysis.calculateCovariance(x, y);

      expect(covariance).toBeCloseTo(0, 6);
    });
  });

  describe('calculateAnnualizedReturn', () => {
    test('should annualize returns correctly', () => {
      // 1% daily return for 252 days
      const dailyReturn = 0.01;
      const returns = Array(252).fill(dailyReturn);

      const annualized = quantAnalysis.calculateAnnualizedReturn(returns);

      // Should be significantly higher than daily return
      expect(annualized).toBeGreaterThan(dailyReturn);
    });
  });

  describe('calculateAlpha', () => {
    test('should calculate Jensens alpha', () => {
      const assetReturns = Array.from({ length: 100 }, () => 0.001 + Math.random() * 0.02 - 0.01);
      const benchmarkReturns = Array.from({ length: 100 }, () => 0.0005 + Math.random() * 0.015 - 0.0075);

      const alpha = quantAnalysis.calculateAlpha(assetReturns, benchmarkReturns);

      expect(typeof alpha).toBe('number');
      expect(isFinite(alpha)).toBe(true);
    });
  });
});
