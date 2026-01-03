# MEAN-QUANT

A quantitative trading and analysis platform built with the MEAN stack (MongoDB, Express, Angular, Node.js).

## Features

- **Market Data Management**: Store and retrieve historical price data for stocks
- **Quantitative Analysis**: Calculate statistical metrics, risk measures, and technical indicators
- **Portfolio Management**: Track holdings, transactions, and portfolio performance
- **User Authentication**: Secure JWT-based authentication with watchlist functionality

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Analysis**: simple-statistics library for statistical calculations

## Prerequisites

- Node.js 18.x or higher
- MongoDB 6.x or higher
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/winder87-stack/MEAN-QUANT.git
   cd MEAN-QUANT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/mean-quant
   JWT_SECRET=your-super-secret-key
   ```

5. Start MongoDB (if running locally):
   ```bash
   mongod
   ```

6. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev:server
   ```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update user profile |
| PUT | `/api/auth/password` | Change password |
| GET | `/api/auth/watchlist` | Get user watchlist |
| POST | `/api/auth/watchlist/:symbol` | Add to watchlist |
| DELETE | `/api/auth/watchlist/:symbol` | Remove from watchlist |

### Market Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market-data/stocks` | List all stocks |
| GET | `/api/market-data/stocks/:symbol` | Get stock by symbol |
| GET | `/api/market-data/stocks/:symbol/prices` | Get price history |
| POST | `/api/market-data/stocks` | Create/update stock |
| POST | `/api/market-data/stocks/:symbol/prices` | Add price data |
| GET | `/api/market-data/search` | Search stocks |
| DELETE | `/api/market-data/stocks/:symbol` | Delete stock |

### Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analysis/stats/:symbol` | Comprehensive statistics |
| GET | `/api/analysis/returns/:symbol` | Return calculations |
| GET | `/api/analysis/indicators/:symbol` | Technical indicators |
| POST | `/api/analysis/correlation` | Correlation matrix |
| POST | `/api/analysis/risk` | Risk metrics |
| GET | `/api/analysis/compare` | Compare multiple stocks |

### Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio` | List user portfolios |
| GET | `/api/portfolio/:id` | Get portfolio by ID |
| POST | `/api/portfolio` | Create portfolio |
| PUT | `/api/portfolio/:id` | Update portfolio |
| DELETE | `/api/portfolio/:id` | Delete portfolio |
| POST | `/api/portfolio/:id/transaction` | Add transaction |
| GET | `/api/portfolio/:id/allocation` | Get allocation |
| GET | `/api/portfolio/:id/performance` | Get performance |
| GET | `/api/portfolio/:id/risk` | Risk analysis |

## Quantitative Analysis Features

### Statistical Metrics

- Simple and logarithmic returns
- Cumulative returns
- Annualized return and volatility
- Sharpe Ratio and Sortino Ratio
- Maximum Drawdown
- Value at Risk (VaR) and Conditional VaR
- Skewness and Kurtosis

### Risk Metrics

- Beta and Alpha (Jensen's Alpha)
- Correlation analysis
- Covariance calculations
- Portfolio risk aggregation

### Technical Indicators

- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- MACD (Moving Average Convergence Divergence)
- Bollinger Bands

## Project Structure

```
MEAN-QUANT/
├── server/
│   ├── index.js           # Express app entry point
│   ├── models/
│   │   ├── Stock.js       # Stock/price data model
│   │   ├── Portfolio.js   # Portfolio model
│   │   └── User.js        # User model
│   ├── routes/
│   │   ├── marketData.js  # Market data endpoints
│   │   ├── analysis.js    # Analysis endpoints
│   │   ├── portfolio.js   # Portfolio endpoints
│   │   └── auth.js        # Authentication endpoints
│   └── utils/
│       └── quantAnalysis.js # Analysis utilities
├── tests/
│   └── quantAnalysis.test.js # Unit tests
├── .env.example
├── .eslintrc.json
├── .gitignore
├── package.json
└── README.md
```

## Running Tests

```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

## Linting

```bash
npm run lint
```

## Example Usage

### Add Stock Data

```bash
curl -X POST http://localhost:3000/api/market-data/stocks \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"}'
```

### Add Price Data

```bash
curl -X POST http://localhost:3000/api/market-data/stocks/AAPL/prices \
  -H "Content-Type: application/json" \
  -d '{
    "prices": [
      {"date": "2024-01-02", "open": 150, "high": 152, "low": 149, "close": 151, "volume": 1000000},
      {"date": "2024-01-03", "open": 151, "high": 153, "low": 150, "close": 152, "volume": 1100000}
    ]
  }'
```

### Get Statistics

```bash
curl http://localhost:3000/api/analysis/stats/AAPL?period=252
```

### Calculate Correlation

```bash
curl -X POST http://localhost:3000/api/analysis/correlation \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["AAPL", "MSFT", "GOOGL"], "period": 252}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/mean-quant |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:4200 |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Angular frontend application
- [ ] Real-time data integration (WebSockets)
- [ ] External API integrations (Alpha Vantage, Yahoo Finance)
- [ ] Advanced portfolio optimization (Mean-Variance)
- [ ] Backtesting framework
- [ ] Machine learning predictions
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
