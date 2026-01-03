const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').isString().isLength({ min: 1, max: 100 }).trim()
], validate, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        error: {
          message: 'User with this email already exists',
          status: 409
        }
      });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isString().notEmpty()
], validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401
        }
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid email or password',
          status: 401
        }
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware to verify JWT token
 */
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        message: 'Access token is required',
        status: 401
      }
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        message: 'Invalid or expired token',
        status: 403
      }
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/me
 * Update current user profile
 */
router.put('/me', authenticateToken, [
  body('name').optional().isString().isLength({ min: 1, max: 100 }).trim(),
  body('preferences').optional().isObject()
], validate, async (req, res, next) => {
  try {
    const { name, preferences } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    if (name) {
      user.name = name;
    }
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth/password
 * Change password
 */
router.put('/password', authenticateToken, [
  body('currentPassword').isString().notEmpty(),
  body('newPassword').isLength({ min: 8 })
], validate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          message: 'Current password is incorrect',
          status: 401
        }
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/watchlist/:symbol
 * Add symbol to watchlist
 */
router.post('/watchlist/:symbol', authenticateToken, async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    await user.addToWatchlist(symbol);

    res.json({
      message: `${symbol.toUpperCase()} added to watchlist`,
      watchlist: user.watchlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/auth/watchlist/:symbol
 * Remove symbol from watchlist
 */
router.delete('/watchlist/:symbol', authenticateToken, async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    await user.removeFromWatchlist(symbol);

    res.json({
      message: `${symbol.toUpperCase()} removed from watchlist`,
      watchlist: user.watchlist
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/watchlist
 * Get user's watchlist
 */
router.get('/watchlist', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          status: 404
        }
      });
    }

    res.json({ watchlist: user.watchlist });
  } catch (error) {
    next(error);
  }
});

// Export router and middleware
module.exports = router;
module.exports.authenticateToken = authenticateToken;
