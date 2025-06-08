# 🎮 GameHub Backend API

A comprehensive Node.js backend API for the GameHub free-to-play game discovery platform. This RESTful API provides secure authentication, game management, user favorites, reviews, and comprehensive game data integration.

## ✨ Features

- **🔐 Google OAuth 2.0 Authentication**: Secure user authentication with JWT tokens
- **🎯 Game Management**: Complete CRUD operations for game data
- **📊 External API Integration**: Seamless integration with FreeToGame API
- **⭐ Favorites System**: User-specific game bookmarking
- **📝 Reviews & Ratings**: Comprehensive review system with user ratings
- **👤 User Profile Management**: Profile updates with avatar upload support
- **🔒 Security & Rate Limiting**: Enterprise-grade security with request throttling
- **📱 CORS Optimized**: Configured for web and mobile app compatibility
- **🚀 Performance**: Optimized database queries with indexing and caching
- **🧪 Test Coverage**: Comprehensive test suite for all endpoints

## ✅ Implementation Status

### Phase 1: Core Infrastructure ✅

- [x] Express server with security middleware (Helmet, CORS)
- [x] MongoDB Atlas integration with Mongoose ODM
- [x] Rate limiting (100 requests/15min per IP)
- [x] Static file serving for avatar uploads
- [x] Comprehensive error handling middleware
- [x] Health check and API info endpoints

### Phase 2: Authentication System ✅

- [x] Google OAuth 2.0 with Passport.js strategy
- [x] JWT access + refresh token system
- [x] User model with Google authentication fields
- [x] Protected route middleware
- [x] Complete auth flow (login, callback, refresh, logout)
- [x] User profile management with validation

### Phase 3: Game System ✅

- [x] Game model with comprehensive schema
- [x] FreeToGame API integration and data synchronization
- [x] Advanced search and filtering capabilities
- [x] Game CRUD operations with validation
- [x] Pagination and performance optimization
- [x] Automated game data sync with cron jobs

### Phase 4: User Features ✅

- [x] Favorites system (add, remove, list)
- [x] Review system with ratings (1-5 stars)
- [x] User-generated content management
- [x] Avatar upload with Multer integration
- [x] Profile customization features

## 🛠️ Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth 2.0 + Passport.js
- **File Uploads**: Multer for avatar management
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest with comprehensive test coverage
- **Task Scheduling**: Node-Cron for automated game syncing
- **External APIs**: FreeToGame API integration
- **Validation**: Express-validator for input sanitization

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or local MongoDB instance
- Google OAuth 2.0 credentials
- Optional: FreeToGame API access

### Installation

1. **Clone the repository**

   ```pwsh
   git clone <repository-url>
   cd my_gamehub/server
   ```

2. **Install dependencies**

   ```pwsh
   npm install
   ```

3. **Environment Configuration**

   Copy the example environment file:

   ```pwsh
   cp .env.example .env
   ```

   Update `.env` with your credentials:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gamehub

   # JWT Configuration
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # URLs
   CLIENT_URL=http://localhost:3000
   SERVER_URL=http://localhost:5000

   # External APIs
   FREETOGAME_API_URL=https://www.freetogame.com/api
   ```

4. **Start the Development Server**

   ```pwsh
   npm run dev
   ```

5. **Initialize Game Database (Optional)**
   ```pwsh
   npm run sync-games
   ```

## 🔧 Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run comprehensive test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run sync-games` - Fetch and sync games from FreeToGame API
- `npm run lint` - Check code quality with ESLint

## 📋 API Endpoints

### Health & Information

- `GET /health` - Server health status and uptime
- `GET /api` - API information and available endpoints

### Authentication

- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback handler
- `POST /api/auth/refresh` - Refresh access token using refresh token
- `POST /api/auth/logout` - Logout user and invalidate tokens (Protected)
- `GET /api/auth/me` - Get current authenticated user details (Protected)

### User Management

- `GET /api/users/profile` - Get detailed user profile (Protected)
- `PUT /api/users/profile` - Update user profile information (Protected)
- `POST /api/users/avatar` - Upload user avatar image (Protected)
- `DELETE /api/users/avatar` - Remove user avatar (Protected)

### Games

- `GET /api/games` - Get paginated games list with filtering and search
- `GET /api/games/:id` - Get detailed game information by ID
- `GET /api/games/search` - Advanced game search with multiple filters
- `GET /api/games/stats` - Get game statistics and analytics
- `POST /api/games/sync` - Manually trigger game data synchronization (Admin)

### Favorites

- `GET /api/favorites` - Get user's favorite games list (Protected)
- `POST /api/favorites/:gameId` - Add game to favorites (Protected)
- `DELETE /api/favorites/:gameId` - Remove game from favorites (Protected)
- `GET /api/favorites/check/:gameId` - Check if game is favorited (Protected)

### Reviews

- `GET /api/reviews/game/:gameId` - Get all reviews for a specific game
- `GET /api/reviews/user` - Get current user's reviews (Protected)
- `POST /api/reviews` - Create a new game review (Protected)
- `PUT /api/reviews/:reviewId` - Update existing review (Protected)
- `DELETE /api/reviews/:reviewId` - Delete review (Protected)

## 🗂️ Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection & configuration
│   │   ├── googleAuth.js        # Google OAuth Passport strategy
│   │   └── jwt.js               # JWT token utilities & validation
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic & OAuth flow
│   │   ├── gameController.js    # Game CRUD operations & search
│   │   ├── favoriteController.js # Favorites management
│   │   ├── reviewController.js  # Reviews & ratings system
│   │   └── userController.js    # User profile management
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── upload.js            # Multer configuration for avatars
│   │   └── validation.js        # Input validation middleware
│   ├── models/
│   │   ├── User.js              # User schema with Google auth
│   │   ├── Game.js              # Game schema with indexing
│   │   ├── Favorite.js          # User favorites schema
│   │   └── Review.js            # Game reviews & ratings schema
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── users.js             # User profile endpoints
│   │   ├── games.js             # Game management endpoints
│   │   ├── favorites.js         # Favorites endpoints
│   │   └── reviews.js           # Reviews endpoints
│   ├── services/
│   │   ├── gameService.js       # External API integration logic
│   │   ├── favoriteService.js   # Favorites business logic
│   │   ├── reviewService.js     # Reviews business logic
│   │   └── cronService.js       # Scheduled task management
│   ├── utils/
│   │   ├── constants.js         # Application constants
│   │   ├── helpers.js           # Utility helper functions
│   │   └── performance.js       # Performance monitoring utilities
│   └── app.js                   # Express app configuration
├── scripts/
│   └── fetchGames.js            # Game data synchronization script
├── tests/
│   ├── auth.test.js             # Authentication tests
│   ├── games.test.js            # Game endpoints tests
│   ├── favorites.test.js        # Favorites tests
│   ├── reviews.test.js          # Reviews tests
│   └── setup.js                 # Test environment configuration
├── uploads/
│   ├── avatars/                 # User avatar storage
│   └── temp/                    # Temporary file storage
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Environment template
├── jest.config.json             # Jest testing configuration
├── package.json                 # Dependencies and scripts
└── server.js                    # Application entry point
```

## 🔧 Development & Testing

### Development Workflow

```pwsh
# Start development server with hot reload
npm run dev

# Run in production mode
npm start

# Run test suite
npm test

# Run tests in watch mode
npm run test:watch

# Sync game data from external API
npm run sync-games
```

### Testing

The API includes comprehensive test coverage with Jest:

```pwsh
# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run tests with coverage report
npm test -- --coverage

# Watch mode for development
npm run test:watch
```

### API Testing Examples

```pwsh
# Test server health
curl "http://localhost:5000/health"

# Test API information
curl "http://localhost:5000/api"

# Test Google OAuth flow (returns redirect)
curl -I "http://localhost:5000/api/auth/google"

# Test protected endpoint (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:5000/api/auth/me"

# Test game search
curl "http://localhost:5000/api/games?search=battle&genre=shooter&page=1"

# Test favorites (requires authentication)
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:5000/api/favorites/123"
```

## 🔐 Authentication & Security

### Authentication Flow

1. **Initiate OAuth**: `GET /api/auth/google` → Redirects to Google OAuth
2. **OAuth Callback**: Google redirects to `/api/auth/google/callback`
3. **Token Response**: Returns JWT access token + refresh token + user data
4. **Protected Requests**: Include `Authorization: Bearer <access_token>` header
5. **Token Refresh**: Use `POST /api/auth/refresh` with refresh token when access token expires

### Security Features

- **Helmet.js**: Comprehensive security headers (CSP, HSTS, XSS protection)
- **Rate Limiting**: 100 requests per 15 minutes per IP address
- **CORS Configuration**: Optimized for web and mobile applications
- **JWT Security**: Secure token generation with proper expiration
- **Input Validation**: Request validation and sanitization with express-validator
- **Error Handling**: Sanitized error responses (no stack traces in production)
- **File Upload Security**: Secure avatar uploads with type and size validation
- **Database Security**: MongoDB connection with authentication and connection pooling

### Example Authentication Usage

```javascript
// Frontend authentication example
const authResponse = await fetch("/api/auth/google");

// Using JWT token for protected requests
const response = await fetch("/api/users/profile", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});

// Token refresh when access token expires
const refreshResponse = await fetch("/api/auth/refresh", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refreshToken: userRefreshToken }),
});
```

## 📊 Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  googleId: String (unique, required),
  email: String (unique, lowercase, required),
  name: String (required),
  avatar: String,                    // Local file path for uploaded avatar
  avatarUrl: String (virtual),       // Full URL for serving avatar
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
```

### Game Model

```javascript
{
  _id: ObjectId,
  externalId: Number (unique, required),  // FreeToGame API ID
  title: String (required, indexed),
  thumbnail: String (required),
  shortDescription: String (required, text-indexed),
  gameUrl: String (required),
  genre: String (required, indexed),
  platform: String (required, indexed),
  publisher: String (required),
  developer: String (required),
  releaseDate: Date (required),
  freetogameProfileUrl: String,
  screenshots: [String],              // Array of screenshot URLs
  minimumSystemRequirements: Object,
  status: String (default: 'Live'),
  createdAt: Date,
  updatedAt: Date
}
```

### Favorite Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  game: ObjectId (ref: 'Game', required),
  createdAt: Date (default: now)
}
// Compound index on [user, game] for uniqueness
```

### Review Model

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  game: ObjectId (ref: 'Game', required),
  rating: Number (1-5, required),
  title: String (required, max: 100),
  content: String (required, max: 1000),
  createdAt: Date (default: now),
  updatedAt: Date (default: now)
}
// Compound index on [user, game] for uniqueness
```

## 🚀 Performance & Optimization

### Database Optimization

- **Indexing Strategy**: Optimized indexes for search, filtering, and joins
- **Connection Pooling**: MongoDB connection pooling for concurrent requests
- **Query Optimization**: Efficient aggregation pipelines for complex queries
- **Data Validation**: Mongoose schema validation for data integrity

### API Performance

- **Pagination**: Efficient pagination for large datasets
- **Caching Strategy**: Response caching for frequently accessed data
- **Rate Limiting**: Request throttling to prevent abuse
- **Compression**: Gzip compression for response optimization

### External API Integration

- **Data Synchronization**: Automated game data sync with FreeToGame API
- **Error Handling**: Robust error handling for external API failures
- **Data Transformation**: Efficient data mapping and validation
- **Cron Jobs**: Scheduled tasks for regular data updates

## 🚀 Deployment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/gamehub
JWT_SECRET=super-secure-production-secret
JWT_REFRESH_SECRET=super-secure-refresh-secret
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret
CLIENT_URL=https://yourdomain.com
SERVER_URL=https://api.yourdomain.com
```

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas connection string updated
- [ ] Google OAuth redirect URIs updated
- [ ] CORS origins configured for production domain
- [ ] Security headers properly configured
- [ ] File upload directory permissions set
- [ ] Rate limiting configured for production traffic
- [ ] Logging configured for monitoring
- [ ] Health check endpoint accessible

## 📚 Documentation

### API Documentation

- **Full API Reference**: `API_DOCUMENTATION.md`
- **Authentication Guide**: `AUTHENTICATION_README.md`
- **Development Plan**: `devplan.md`
- **Avatar Upload Guide**: `AVATAR_UPLOAD_IMPLEMENTATION.md`

### Additional Resources

- **Postman Collection**: Available for API testing
- **OpenAPI/Swagger**: API specification for frontend integration
- **Error Codes Reference**: Comprehensive error handling documentation

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up environment variables
5. Run tests: `npm test`
6. Make your changes
7. Run tests again to ensure nothing breaks
8. Commit changes: `git commit -m 'Add amazing feature'`
9. Push to branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Write tests for new features
- Use meaningful commit messages
- Update documentation as needed
- Follow REST API conventions

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support & Issues

- **Documentation**: Check the `/docs` directory for detailed guides
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **API Questions**: Refer to `API_DOCUMENTATION.md`
- **Authentication**: Check `AUTHENTICATION_README.md` for auth-related issues

---

**Server Status**: Production Ready ✅  
**Last Updated**: June 2025  
**API Version**: 1.0.0
