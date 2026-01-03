const mongoose = require('mongoose');

const priceDataSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  open: {
    type: Number,
    required: true
  },
  high: {
    type: Number,
    required: true
  },
  low: {
    type: Number,
    required: true
  },
  close: {
    type: Number,
    required: true
  },
  adjustedClose: {
    type: Number,
    required: true
  },
  volume: {
    type: Number,
    required: true
  }
}, { _id: false });

const stockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  exchange: {
    type: String,
    trim: true
  },
  sector: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  marketCap: {
    type: Number
  },
  priceHistory: [priceDataSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  metadata: {
    currency: {
      type: String,
      default: 'USD'
    },
    country: {
      type: String,
      default: 'US'
    },
    ipoDate: Date,
    delistingDate: Date,
    status: {
      type: String,
      enum: ['active', 'delisted', 'suspended'],
      default: 'active'
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
stockSchema.index({ 'priceHistory.date': -1 });
stockSchema.index({ sector: 1 });
stockSchema.index({ exchange: 1 });

// Virtual for latest price
stockSchema.virtual('latestPrice').get(function() {
  if (this.priceHistory && this.priceHistory.length > 0) {
    return this.priceHistory[this.priceHistory.length - 1];
  }
  return null;
});

// Method to get price data within date range
stockSchema.methods.getPriceRange = function(startDate, endDate) {
  return this.priceHistory.filter(price => {
    const priceDate = new Date(price.date);
    return priceDate >= new Date(startDate) && priceDate <= new Date(endDate);
  });
};

// Method to calculate simple returns
stockSchema.methods.calculateReturns = function() {
  const returns = [];
  for (let i = 1; i < this.priceHistory.length; i++) {
    const prevClose = this.priceHistory[i - 1].adjustedClose;
    const currClose = this.priceHistory[i].adjustedClose;
    returns.push({
      date: this.priceHistory[i].date,
      return: (currClose - prevClose) / prevClose
    });
  }
  return returns;
};

// Static method to find by symbol
stockSchema.statics.findBySymbol = function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase() });
};

const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;
