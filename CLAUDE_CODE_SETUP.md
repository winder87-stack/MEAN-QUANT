# Claude Code Setup Guide for MEAN-QUANT Development

This guide will help you set up Claude Code with optimal configuration and powerful MCP servers for developing the MEAN-QUANT platform.

---

## 📦 Installing Claude Code

### Option 1: Desktop App (Recommended)
1. Download from: https://claude.ai/download
2. Install for your platform (Windows, macOS, Linux)
3. Sign in with your Anthropic account

### Option 2: VS Code Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Claude Code"
4. Install and authenticate

---

## 🎯 Initial Setup

### 1. Configure Your Workspace

Create a `.claud.json` (or similar config) in your project root:

```json
{
  "projectName": "MEAN-QUANT",
  "projectType": "fullstack",
  "mainLanguages": ["typescript", "javascript"],
  "frameworks": ["express", "angular", "mongodb"],
  "testFramework": "jest",
  "linter": "eslint",
  "packageManager": "npm"
}
```

### 2. Set Up Project Context

Create a `.claud/context.md` file to give Claude ongoing context:

```markdown
# MEAN-QUANT Project Context

## Overview
Quantitative trading and analysis platform using MEAN stack.

## Current Status
- Backend API complete with Express.js + MongoDB
- 37 passing unit tests
- Need to build Angular frontend
- Need to integrate external market data APIs

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose
- Frontend: Angular (to be built)
- Auth: JWT
- Testing: Jest
- Charts: Chart.js or Plotly (to decide)

## Key Files
- `server/index.js` - Main server
- `server/routes/` - API endpoints
- `server/models/` - MongoDB schemas
- `server/utils/quantAnalysis.js` - Analysis functions
- `TODO.md` - Development roadmap

## Coding Standards
- Use ES6+ features
- Follow ESLint rules
- Write tests for new features
- Use descriptive commit messages (conventional commits)
```

---

## 🔌 MCP (Model Context Protocol) Servers

MCP servers give Claude superpowers by connecting to external tools and services. Here are the most useful ones for MEAN-QUANT:

### Essential MCP Servers

#### 1. **Filesystem MCP** (File operations)
```bash
# Install
npm install -g @modelcontextprotocol/server-filesystem

# Configure in Claude settings
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/ink/projects/MEAN-QUANT"]
    }
  }
}
```

**What it does**: Lets Claude read/write files, search code, navigate directories

#### 2. **GitHub MCP** (Git operations)
```bash
# Install
npm install -g @modelcontextprotocol/server-github

# Configure
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_github_personal_access_token"
      }
    }
  }
}
```

**What it does**: 
- Create branches and commits
- Make pull requests
- Search repositories
- Manage issues

#### 3. **MongoDB MCP** (Database operations)
```bash
# Install
npm install -g @modelcontextprotocol/server-mongodb

# Configure
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mongodb"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/mean-quant"
      }
    }
  }
}
```

**What it does**:
- Query database
- Inspect collections
- Run aggregations
- Test data operations

#### 4. **npm MCP** (Package management)
```bash
# Install
npm install -g @modelcontextprotocol/server-npm

# Configure
{
  "mcpServers": {
    "npm": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-npm", "/home/ink/projects/MEAN-QUANT"]
    }
  }
}
```

**What it does**:
- Install/update packages
- Search npm registry
- Manage dependencies
- Run scripts

#### 5. **Puppeteer MCP** (Browser automation for testing)
```bash
# Install
npm install -g @modelcontextprotocol/server-puppeteer

# Configure
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**What it does**:
- Take screenshots
- Test UI
- Scrape web data (for market data)

#### 6. **PostgreSQL MCP** (If you add PostgreSQL later)
```bash
npm install -g @modelcontextprotocol/server-postgres
```

---

## ⚙️ Complete MCP Configuration

Create `~/.config/Claude/claude_desktop_config.json` (or similar):

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/home/ink/projects/MEAN-QUANT"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    },
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mongodb"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/mean-quant"
      }
    },
    "npm": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-npm", "/home/ink/projects/MEAN-QUANT"]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### Getting GitHub Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`, `write:packages`
4. Copy token and add to config

---

## 🚀 Using Claude Code Features

### 1. **Multi-File Editing**
```
You: "Create the Angular authentication module with login, register, 
and profile components. Include the auth service and guard."
```
Claude will create multiple files at once:
- `client/src/app/auth/login/login.component.ts`
- `client/src/app/auth/register/register.component.ts`
- `client/src/app/auth/auth.service.ts`
- `client/src/app/auth/auth.guard.ts`

### 2. **Context-Aware Code Generation**
```
You: "Add a method to calculate portfolio beta in the Portfolio model"
```
Claude reads your existing Portfolio.js and adds a method that:
- Fits your existing code style
- Uses your mongoose patterns
- Handles errors consistently
- Adds appropriate JSDoc comments

### 3. **Interactive Debugging**
```
You: "I'm getting an error when running npm test. The calculateBeta 
function is returning NaN."
```
Claude will:
- Read the test file
- Check the implementation
- Identify the issue
- Suggest fixes with code

### 4. **Refactoring**
```
You: "Refactor the analysis routes to use async/await more consistently 
and add better error handling"
```

### 5. **Documentation Generation**
```
You: "Generate JSDoc comments for all functions in quantAnalysis.js"
```

### 6. **Test Generation**
```
You: "Create integration tests for the market data routes"
```

---

## 💡 Best Practices for Using Claude Code

### 1. **Be Specific with Context**
❌ Bad: "Add a chart"
✅ Good: "Add a line chart component in client/src/app/charts/ using Chart.js that displays stock price history. It should accept an array of price data as input and be reusable."

### 2. **Reference Existing Code**
```
You: "Looking at server/routes/marketData.js, create a similar route 
file for cryptocurrency data with the same error handling patterns"
```

### 3. **Break Down Large Tasks**
Instead of: "Build the entire Angular frontend"

Do:
1. "Set up the Angular project with routing and Angular Material"
2. "Create the authentication module"
3. "Create the dashboard layout"
4. "Build the stock search component"

### 4. **Use TODO.md**
```
You: "Complete Phase 2.2 from TODO.md - create the Authentication Module 
with all components listed"
```

### 5. **Ask for Explanations**
```
You: "Explain how the calculateBeta function works and why we divide 
by benchmarkVariance"
```

### 6. **Iterate and Refine**
```
You: "The login form works but could use better validation. Add email 
format validation and password strength indicator"
```

---

## 🎨 Workflow Examples

### Example 1: Building a New Feature

```
You: "I want to add a stock comparison feature. Looking at TODO.md 
Phase 2.2, create:
1. A comparison component that lets users select multiple stocks
2. A side-by-side metrics table
3. A chart showing price history overlays
4. Use the existing /api/analysis/compare endpoint"

Claude: [Creates 4-5 files with full implementation]

You: "This looks good but the chart is too cluttered with 5+ stocks. 
Add a max of 4 stocks and show a warning if they try to add more"

Claude: [Updates the component]

You: "Perfect! Now add unit tests for the comparison component"

Claude: [Creates test file]
```

### Example 2: Fixing a Bug

```
You: "When I create a portfolio and add a transaction, the cashBalance 
isn't updating correctly. The transaction is a 'buy' for 10 shares at 
$100 but cashBalance stays at 1000 instead of going to 0."

Claude: [Analyzes Portfolio.js addTransaction method, finds issue]

You: "Thanks! Can you also add a validation to prevent transactions 
if there isn't enough cash?"

Claude: [Adds validation and error handling]
```

### Example 3: Setting Up a Complex Integration

```
You: "Help me set up Alpha Vantage API integration. Looking at TODO.md 
Phase 3.1, I need:
1. A service file to handle API calls
2. Rate limiting (5 calls per minute)
3. A route to fetch and store stock data
4. Error handling for API failures
My API key is in .env as ALPHA_VANTAGE_API_KEY"

Claude: [Creates service, adds routes, includes rate limiting logic]

You: "Can we also cache the responses for 1 hour to reduce API calls?"

Claude: [Adds Redis caching or in-memory cache]
```

---

## 🔧 Advanced Features

### 1. **Custom Instructions**
Add to your Claude settings:
```
When working on MEAN-QUANT:
- Always write tests for new features
- Use conventional commit messages
- Follow the existing code style in server/ and client/
- Add JSDoc comments for functions
- Consider edge cases in financial calculations
- Use proper error handling with try-catch
```

### 2. **Project Templates**
Create templates for common tasks:

**Component Template:**
```
You: "Create a new Angular component using the project template:
- Component name: [name]
- Location: client/src/app/[module]/
- Include: component.ts, component.html, component.scss, component.spec.ts
- Use OnPush change detection
- Inject necessary services
- Add to module declarations"
```

### 3. **Code Review**
```
You: "Review my implementation of the portfolio optimization feature 
in server/utils/optimization.js. Check for:
- Performance issues
- Edge cases
- Code quality
- Missing tests
- Security concerns"
```

---

## 📊 MCP Server Usage Examples

### Using GitHub MCP
```
You: "Create a new branch 'feature/alpha-vantage-integration' and 
commit the new Alpha Vantage service file"

You: "Create a PR for this branch with title 'Add Alpha Vantage 
integration' and link to issue #5"

You: "Show me all open issues tagged with 'frontend'"
```

### Using MongoDB MCP
```
You: "Show me the structure of the Stock collection"

You: "Query the database for all stocks in the Technology sector"

You: "Create a sample stock document with price history for testing"

You: "Run an aggregation to find the average price for AAPL over the 
last 30 days"
```

### Using npm MCP
```
You: "Install chart.js and save it as a dependency"

You: "What's the latest version of mongoose? Should we update?"

You: "Run npm test and show me the results"

You: "Add a new script to package.json for building production"
```

### Using Filesystem MCP
```
You: "Search all files for uses of the deprecated old-api-endpoint"

You: "Show me the project structure of server/routes/"

You: "Find all TODO comments in the codebase"

You: "What's in the .env.example file?"
```

---

## 🎯 Optimal Setup Checklist

- [ ] Claude Code installed (desktop or VS Code)
- [ ] Project cloned to `~/projects/MEAN-QUANT`
- [ ] `.claud/context.md` created
- [ ] MCP servers installed:
  - [ ] filesystem
  - [ ] github (with token)
  - [ ] mongodb (with URI)
  - [ ] npm
- [ ] MCP config file created with all servers
- [ ] GitHub token generated and added
- [ ] MongoDB running locally
- [ ] Custom instructions added to Claude settings
- [ ] Read through TODO.md
- [ ] Tested Claude with a simple request

---

## 🚦 Getting Started Workflow

Once everything is set up:

1. **Start Your Session**
```
You: "I'm ready to work on MEAN-QUANT. Can you read TODO.md and 
summarize where we are in the development process?"
```

2. **Pick a Task**
```
You: "I want to start with Phase 2.1 - Angular Project Setup. 
Can you help me create the Angular project with the right 
configuration?"
```

3. **Implement**
```
You: "Now let's do Phase 2.2 - create the authentication module. 
Start with the login component."
```

4. **Test & Iterate**
```
You: "The login works! But I want to add a 'Remember Me' checkbox. 
Can you add that feature and update the auth service to handle it?"
```

5. **Commit**
```
You: "Great! Commit these changes with message 'feat: add login 
component with remember me option'"
```

---

## 📚 Resources

- **MCP Documentation**: https://modelcontextprotocol.io/
- **Available MCP Servers**: https://github.com/modelcontextprotocol/servers
- **Claude Code Features**: https://claude.ai/docs
- **Creating Custom MCP Servers**: https://modelcontextprotocol.io/docs/create

---

## 💪 Pro Tips

1. **Keep Context Fresh**: Start new conversations for new features to avoid context pollution

2. **Use Code Mode**: Switch to Code mode for implementation tasks (you're in it now!)

3. **Ask for Alternatives**: "Show me 3 different ways to implement this feature"

4. **Learn as You Go**: Ask "Why did you implement it this way?" to understand decisions

5. **Save Useful Patterns**: Keep a note of good prompts that work well

6. **Use the MCP**: Let Claude use MCP servers instead of you running commands manually

7. **Review Generated Code**: Always review before committing, especially for security-sensitive parts

8. **Break Down Epic Tasks**: If a task seems too large, break it down more

9. **Leverage Existing Code**: Point Claude to similar existing code as examples

10. **Iterate Quickly**: Don't try to get it perfect on first try - iterate!

---

## 🎉 You're Ready!

With this setup, you have a powerful development environment where Claude can:
- ✅ Read and write code across your entire project
- ✅ Manage git operations and create PRs
- ✅ Query and manipulate the database
- ✅ Install packages and run scripts
- ✅ Generate tests and documentation
- ✅ Help debug issues
- ✅ Build entire features end-to-end

Start with something small to test the setup, then tackle the big features from TODO.md!

**First test command:**
```
You: "Using the filesystem MCP, show me the structure of the server/ 
directory and count how many route files we have"
```

Good luck building MEAN-QUANT! 🚀📈
