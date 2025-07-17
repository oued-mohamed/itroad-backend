// services/auth-service/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/authController';
import { UserController } from '../controllers/userController';
import { authMiddleware, requireRole, requireAdmin, rateLimit, logApiUsage } from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = Router();

// Apply logging to all routes
router.use(logApiUsage);

// Public routes with rate limiting
router.post('/register', 
  rateLimit(5, 15 * 60 * 1000), // 5 requests per 15 minutes
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    body('role')
      .optional()
      .isIn(['admin', 'agent', 'client'])
      .withMessage('Role must be admin, agent, or client'),
    handleValidationErrors
  ], 
  AuthController.register
);

router.post('/login', 
  rateLimit(10, 15 * 60 * 1000), // 10 requests per 15 minutes
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ], 
  AuthController.login
);

router.post('/refresh-token', 
  rateLimit(20, 15 * 60 * 1000), // 20 requests per 15 minutes
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required'),
    handleValidationErrors
  ],
  AuthController.refreshToken
);

router.post('/logout', AuthController.logout);

// Password reset routes - stub implementations to prevent undefined errors
router.post('/forgot-password',
  rateLimit(3, 15 * 60 * 1000), // 3 requests per 15 minutes
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    // Stub implementation - implement later if needed
    res.status(501).json({
      success: false,
      message: 'Forgot password feature not implemented yet'
    });
  }
);

router.post('/reset-password',
  rateLimit(5, 15 * 60 * 1000),
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    // Stub implementation - implement later if needed
    res.status(501).json({
      success: false,
      message: 'Reset password feature not implemented yet'
    });
  }
);

// Protected routes - require authentication
router.use(authMiddleware);

// User profile routes
router.get('/me', AuthController.me);

router.get('/profile', UserController.getProfile);

router.put('/profile', [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date'),
  handleValidationErrors
], UserController.updateProfile);

router.put('/change-password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
], UserController.changePassword);

// Admin only routes
router.get('/users', 
  requireAdmin,
  [
    query('role')
      .optional()
      .isIn(['admin', 'agent', 'client'])
      .withMessage('Role filter must be admin, agent, or client'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search term must not be empty'),
    handleValidationErrors
  ],
  UserController.getUsers
);

router.get('/users/stats', requireAdmin, UserController.getUserStats);

router.get('/users/:id', 
  requireAdmin,
  [
    param('id')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  UserController.getUserById
);

router.put('/users/:id/role',
  requireAdmin,
  [
    param('id')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    body('newRole')
      .isIn(['admin', 'agent', 'client'])
      .withMessage('Role must be admin, agent, or client'),
    handleValidationErrors
  ],
  UserController.updateUserRole
);

router.put('/users/:id/reactivate',
  requireAdmin,
  [
    param('id')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  UserController.reactivateUser
);

router.delete('/users/:id', 
  requireAdmin,
  [
    param('id')
      .isUUID()
      .withMessage('User ID must be a valid UUID'),
    handleValidationErrors
  ],
  UserController.deactivateUser
);

// Agent and Admin routes
router.get('/agents', 
  requireRole(['admin', 'agent']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('active')
      .optional()
      .isBoolean()
      .withMessage('Active filter must be a boolean'),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      // Get all agents with proper type handling
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = (page - 1) * limit;
      const activeFilter = req.query['active'] as string;

      // Dynamic import to avoid circular dependencies
      const { UserModel } = await import('../models/user');
      
      // Get agents with proper pagination
      const result = await UserModel.findByRole('agent', limit, offset);
      
      // Handle different return formats - check if result has users property or is array
      let agents: any[];
      let total: number;
      
      if (Array.isArray(result)) {
        agents = result;
        total = result.length;
      } else if (result && typeof result === 'object' && 'users' in result) {
        agents = (result as any).users;
        total = (result as any).total || agents.length;
      } else {
        agents = [];
        total = 0;
      }
      
      // Apply active filter if provided
      if (activeFilter !== undefined) {
        const isActive = activeFilter === 'true';
        agents = agents.filter((user: any) => user.isActive === isActive);
      }

      res.json({
        success: true,
        data: agents.map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt || null
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching agents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch agents',
        error: process.env['NODE_ENV'] === 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
);

// Get clients (for agents and admins)
router.get('/clients',
  requireRole(['admin', 'agent']),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = (page - 1) * limit;

      const { UserModel } = await import('../models/user');
      const result = await UserModel.findByRole('client', limit, offset);
      
      // Handle different return formats
      let clients: any[];
      let total: number;
      
      if (Array.isArray(result)) {
        clients = result;
        total = result.length;
      } else if (result && typeof result === 'object' && 'users' in result) {
        clients = (result as any).users;
        total = (result as any).total || clients.length;
      } else {
        clients = [];
        total = 0;
      }

      res.json({
        success: true,
        data: clients.map((user: any) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          createdAt: user.createdAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch clients',
        error: process.env['NODE_ENV ']=== 'development' ? (error as Error).message : 'Internal server error'
      });
    }
  }
);

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Service info route
router.get('/info', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'auth-service',
    version: '1.0.0',
    description: 'Authentication and user management service',
    endpoints: {
      public: [
        'POST /register',
        'POST /login', 
        'POST /refresh-token',
        'POST /logout',
        'GET /health'
      ],
      protected: [
        'GET /me',
        'GET /profile',
        'PUT /profile',
        'PUT /change-password'
      ],
      admin: [
        'GET /users',
        'GET /users/stats',
        'GET /users/:id',
        'PUT /users/:id/role',
        'DELETE /users/:id'
      ]
    }
  });
});

export default router;