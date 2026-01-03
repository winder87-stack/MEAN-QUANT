const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  shares: {
    type: Number,
    required: true,
    min: 0
  },
  averageCost: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buy', 'sell', 'dividend', 'split'],
    required: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  shares: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  fees: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { _id: true });

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  cashBalance: {
    type: Number,
    default: 0
  },
  holdings: [holdingSchema],
  transactions: [transactionSchema],
  benchmarkSymbol: {
    type: String,
    default: 'SPY'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for efficient queries
portfolioSchema.index({ userId: 1, name: 1 });

// Virtual for total market value (requires external price data)
portfolioSchema.virtual('totalHoldings').get(function() {
  return this.holdings.reduce((sum, holding) => {
    return sum + (holding.shares * holding.averageCost);
  }, 0);
});

// Method to add a transaction and update holdings
portfolioSchema.methods.addTransaction = function(transaction) {
  this.transactions.push(transaction);

  const existingHolding = this.holdings.find(
    h => h.symbol === transaction.symbol.toUpperCase()
  );

  if (transaction.type === 'buy') {
    if (existingHolding) {
      // Update average cost
      const totalShares = existingHolding.shares + transaction.shares;
      const totalCost = (existingHolding.shares * existingHolding.averageCost) +
        (transaction.shares * transaction.price);
      existingHolding.averageCost = totalCost / totalShares;
      existingHolding.shares = totalShares;
    } else {
      this.holdings.push({
        symbol: transaction.symbol.toUpperCase(),
        shares: transaction.shares,
        averageCost: transaction.price,
        purchaseDate: transaction.date
      });
    }
    this.cashBalance -= (transaction.shares * transaction.price + transaction.fees);
  } else if (transaction.type === 'sell') {
    if (existingHolding) {
      existingHolding.shares -= transaction.shares;
      if (existingHolding.shares <= 0) {
        this.holdings = this.holdings.filter(
          h => h.symbol !== transaction.symbol.toUpperCase()
        );
      }
    }
    this.cashBalance += (transaction.shares * transaction.price - transaction.fees);
  } else if (transaction.type === 'dividend') {
    this.cashBalance += transaction.shares * transaction.price;
  }

  return this;
};

// Method to calculate portfolio allocation
portfolioSchema.methods.getAllocation = function() {
  const totalValue = this.holdings.reduce((sum, h) => {
    return sum + (h.shares * h.averageCost);
  }, 0) + this.cashBalance;

  const allocation = this.holdings.map(h => ({
    symbol: h.symbol,
    value: h.shares * h.averageCost,
    percentage: ((h.shares * h.averageCost) / totalValue) * 100
  }));

  allocation.push({
    symbol: 'CASH',
    value: this.cashBalance,
    percentage: (this.cashBalance / totalValue) * 100
  });

  return allocation;
};

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
