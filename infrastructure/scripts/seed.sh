# infrastructure/scripts/seed.sh
#!/bin/bash

# Set script to exit on any error
set -e

echo "🌱 Starting database seeding..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Default database connection variables
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-adherant_real_estate}
DB_USER=${DB_USER:-postgres}

echo "📡 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Run seed files
echo "🌱 Running seed files..."

for seed in database/seeds/*.sql; do
    if [ -f "$seed" ]; then
        echo "📝 Applying seed: $(basename $seed)"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$seed"
    fi
done

echo "✅ Database seeding completed successfully!"

// docker-compose.yml (Updated)
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:15-alpine
    container_name: adherant-postgres
    environment:
      POSTGRES_DB: adherant_real_estate
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 5

  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    container_name: adherant-api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - AUTH_SERVICE_URL=http://auth-service:3001
      - PROFILE_SERVICE_URL=http://profile-service:3002
      - PROPERTY_SERVICE_URL=http://property-service:3003
      - DOCUMENT_SERVICE_URL=http://document-service:3004
      - TRANSACTION_SERVICE_URL=http://transaction-service:3005
    depends_on:
      - auth-service
      - profile-service
      - property-service
      - document-service
      - transaction-service
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules

  # Auth Service
  auth-service:
    build: ./services/auth-service
    container_name: adherant-auth-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=adherant_real_estate
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/auth-service:/app
      - /app/node_modules

  # Profile Service
  profile-service:
    build: ./services/profile-service
    container_name: adherant-profile-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=adherant_real_estate
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/profile-service:/app
      - /app/node_modules
      - ./uploads/avatars:/app/uploads/avatars

  # Property Service
  property-service:
    build: ./services/property-service
    container_name: adherant-property-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=adherant_real_estate
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
      - BASE_URL=http://localhost:3003
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/property-service:/app
      - /app/node_modules
      - ./uploads/property-images:/app/uploads/property-images

  # Document Service
  document-service:
    build: ./services/document-service
    container_name: adherant-document-service
    ports:
      - "3004:3004"
    environment:
      - NODE_ENV=development
      - PORT=3004
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=adherant_real_estate
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/document-service:/app
      - /app/node_modules
      - ./uploads/documents:/app/uploads/documents

  # Transaction Service
  transaction-service:
    build: ./services/transaction-service
    container_name: adherant-transaction-service
    ports:
      - "3005:3005"
    environment:
      - NODE_ENV=development
      - PORT=3005
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=adherant_real_estate
      - DB_USER=postgres
      - DB_PASSWORD=password
      - JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./services/transaction-service:/app
      - /app/node_modules

volumes:
  postgres_data:

// docs/README.md
# Adherant Real Estate Platform - Backend

A comprehensive microservices-based backend for real estate management platform built with Node.js, TypeScript, and PostgreSQL.

## 🏗️ Architecture

This backend follows a microservices architecture with the following services:

### Core Services
- **API Gateway** (Port 3000) - Central routing and load balancing
- **Auth Service** (Port 3001) - User authentication and authorization
- **Profile Service** (Port 3002) - User profile management
- **Document Service** (Port 3004) - File upload and management
- **Property Service** (Port 3003) - Property listings and search
- **Transaction Service** (Port 3005) - Deal and transaction management

### Database
- **PostgreSQL** - Primary database with 7 core tables
- **Shared Types** - TypeScript interfaces shared across services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Installation

1. **Clone and setup**
```bash
git clone <repository>
cd adherant-backend
npm run install:all
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Database Setup**
```bash
# Make scripts executable (Linux/Mac)
chmod +x infrastructure/scripts/*.sh

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

4. **Start Development**
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:auth
npm run dev:property
npm run dev:transaction
```

### Docker Setup (Alternative)

```bash
# Start with Docker Compose
docker-compose up --build

# Stop services
docker-compose down
```

## 📋 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - User login
POST /api/auth/refresh      - Refresh access token
GET  /api/auth/me           - Get current user
```

### Property Endpoints
```
GET    /api/properties           - List properties
POST   /api/properties           - Create property (agents only)
GET    /api/properties/:id       - Get property details
PUT    /api/properties/:id       - Update property
DELETE /api/properties/:id       - Delete property
POST   /api/properties/:id/images - Upload property images
```

### Transaction Endpoints
```
GET    /api/transactions         - List transactions
POST   /api/transactions         - Create transaction
GET    /api/transactions/:id     - Get transaction details
PUT    /api/transactions/:id     - Update transaction
PATCH  /api/transactions/:id/status - Update status
```

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts (admin, agent, client)
- **profiles** - Extended user information
- **properties** - Property listings
- **property_images** - Property photos
- **transactions** - Deal tracking
- **documents** - File storage metadata
- **favorites** - User property favorites

## 🔧 Development

### Project Structure
```
adherant-backend/
├── shared/           # Shared types and utilities
├── services/         # Microservices
├── database/         # Migrations and seeds
├── infrastructure/   # Docker and deployment
├── uploads/          # File storage
└── docs/            # Documentation
```

### Adding New Features

1. **Update shared types** in `shared/types/`
2. **Add database migration** in `database/migrations/`
3. **Implement service logic** in relevant service
4. **Update API documentation**

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
See `.env.example` for all required environment variables.

### Docker Production
```bash
docker-compose -f docker-compose.prod.yml up
```

## 📊 Monitoring

- **Logs**: Each service generates structured logs
- **Health Checks**: `/health` endpoint on each service
- **Performance**: Built-in request logging and metrics

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Input validation
- File upload security
- SQL injection prevention

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Follow TypeScript/ESLint rules
4. Add tests for new features
5. Update documentation
6. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

// docs/API.md
# API Documentation

## Base URL
```
Development: http://localhost:3000
Production: https://api.adherant.com
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Auth Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "client" // Optional: "admin", "agent", "client"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

### Property Endpoints

#### List Properties
```http
GET /api/properties?page=1&limit=20&type=house&city=Miami
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Property type
- `status` (optional): Property status
- `minPrice`, `maxPrice` (optional): Price range
- `city`, `state`, `country` (optional): Location filters
- `minBedrooms`, `maxBedrooms` (optional): Bedroom range
- `minArea`, `maxArea` (optional): Area range
- `features` (optional): Array of features
- `isFeatured` (optional): Boolean for featured properties

#### Create Property
```http
POST /api/properties
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Beautiful Miami Beach Condo",
  "description": "Stunning oceanfront condo with panoramic views",
  "type": "condo",
  "status": "available",
  "price": 850000,
  "currency": "USD",
  "address": "123 Ocean Drive",
  "city": "Miami Beach",
  "state": "Florida",
  "country": "USA",
  "postalCode": "33139",
  "latitude": 25.7617,
  "longitude": -80.1918,
  "bedrooms": 3,
  "bathrooms": 2.5,
  "area": 1800,
  "areaUnit": "sqft",
  "yearBuilt": 2018,
  "features": ["ocean_view", "balcony", "parking", "gym"],
  "virtualTourUrl": "https://example.com/tour",
  "isFeatured": false
}
```

#### Upload Property Images
```http
POST /api/properties/:id/images
Authorization: Bearer <token>
Content-Type: multipart/form-data

images: [file1, file2, file3] // Max 10 images, 10MB each
```

### Transaction Endpoints

#### Create Transaction
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "property-uuid",
  "clientId": "client-uuid",
  "buyerId": "buyer-uuid", // Optional
  "sellerId": "seller-uuid", // Optional
  "type": "sale",
  "price": 850000,
  "commission": 6,
  "commissionType": "percentage",
  "notes": "Client very interested, quick closing needed"
}
```

#### Update Transaction Status
```http
PATCH /api/transactions/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "offer_accepted"
}
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": { // For paginated responses
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ // For validation errors
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limits

- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute
- General API: 100 requests per minute

## File Upload Limits

- Property images: Max 10 files, 10MB each
- Documents: Max 1 file, 10MB
- Avatars: Max 1 file, 2MB

Supported formats:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, DOC, DOCX, TXT