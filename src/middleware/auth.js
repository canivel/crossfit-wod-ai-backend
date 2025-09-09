import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authMiddleware = (req, res, next) => {
  try {
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'];
    const authorization = req.headers.authorization;
    
    // For development, allow requests with the correct API secret
    if (apiKey && apiKey === process.env.API_SECRET_KEY) {
      req.authenticated = true;
      req.source = 'api_key';
      return next();
    }
    
    // Check for JWT token
    if (authorization && authorization.startsWith('Bearer ')) {
      const token = authorization.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.authenticated = true;
        req.source = 'jwt';
        return next();
      } catch (jwtError) {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid or expired'
        });
      }
    }
    
    // No valid authentication found
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid API key or JWT token'
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Generate JWT token (for future use with user authentication)
export const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};