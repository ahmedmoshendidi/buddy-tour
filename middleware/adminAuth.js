// Simple admin authentication middleware
// In production, you should implement proper JWT authentication

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // For now, use a simple token approach
  // In production, implement proper JWT authentication with user roles
  const adminToken = process.env.ADMIN_TOKEN || 'admin_secret_token_2024';
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Authorization header required' 
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token || token !== adminToken) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Invalid admin token' 
    });
  }

  // Add admin info to request
  req.admin = {
    id: 'admin',
    role: 'admin',
    name: 'Administrator'
  };

  next();
};

// Optional: More permissive middleware for development
const adminAuthDev = (req, res, next) => {
  // Skip authentication in development mode
  if (process.env.NODE_ENV === 'development') {
    req.admin = {
      id: 'admin',
      role: 'admin', 
      name: 'Development Admin'
    };
    return next();
  }
  
  // Use normal auth in production
  return adminAuth(req, res, next);
};

module.exports = {
  adminAuth,
  adminAuthDev
};