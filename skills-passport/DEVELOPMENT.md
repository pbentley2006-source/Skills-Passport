# Skills Passport - Development Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ (or use Docker)
- OpenAI API key

### 1. Environment Setup

```bash
# Clone and navigate to project
cd skills-passport

# Copy environment files
cp backend/.env.example backend/.env
cp docker/.env.example docker/.env

# Update backend/.env with your OpenAI API key
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skills_passport
# OPENAI_API_KEY=your-openai-api-key-here
# JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
```

### 2. Database Setup

**Option A: Docker (Recommended)**
```bash
cd docker
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL and create database
createdb skills_passport
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Backend will be available at http://localhost:3001

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

### 5. AI Services Setup

```bash
cd ai-services

# Install dependencies
npm install

# Run tests to verify setup
npm test
```

## Full Docker Setup

For a complete containerized environment:

```bash
cd docker

# Copy and configure environment
cp .env.example .env
# Edit .env with your OpenAI API key

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432

## Development Workflow

### Database Management

```bash
# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio

# Generate new migration
npx prisma migrate dev --name your-migration-name
```

### Testing

```bash
# Backend tests
cd backend && npm test

# AI services tests
cd ai-services && npm test

# Frontend tests (when implemented)
cd frontend && npm test
```

### Code Quality

```bash
# TypeScript checking
npm run type-check

# Linting (when configured)
npm run lint

# Formatting (when configured)
npm run format
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### CV Processing
- `POST /cv/upload` - Upload CV file
- `GET /cv/:id/status` - Check processing status
- `GET /cv/:id/parsed` - Get parsed CV data
- `POST /cv/:id/generate-profile` - Generate anonymized profile
- `GET /cv/user/uploads` - List user's CV uploads

### Profiles
- `GET /profiles/:id` - Get profile by ID
- `GET /profiles/candidate/:candidateId` - Get profile by candidate ID
- `PUT /profiles/:id` - Update profile

### Skills
- `GET /skills/taxonomy` - Get skills taxonomy
- `GET /skills/search` - Search skills

## Demo Flow

1. **Register/Login**: Create account or sign in
2. **Upload CV**: Upload PDF, DOCX, or TXT file
3. **Processing**: AI parses and extracts information
4. **Anonymization**: Personal data is anonymized
5. **Profile Generation**: Skills-focused profile created
6. **Visualization**: View skills radar chart and profile
7. **Sharing**: Share anonymized profile via public link

## Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# Or for local: pg_isready
```

**OpenAI API Errors**
- Verify API key is set correctly
- Check API quota and billing
- Ensure proper network connectivity

**File Upload Issues**
- Check file size limits (10MB default)
- Verify supported formats (PDF, DOCX, TXT)
- Ensure uploads directory exists and is writable

**Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debugging

**Backend Debugging**
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# View detailed logs
tail -f logs/combined.log
```

**Database Debugging**
```bash
# Connect to database
psql postgresql://postgres:postgres@localhost:5432/skills_passport

# View tables
\dt

# Check recent uploads
SELECT * FROM "CVUpload" ORDER BY "createdAt" DESC LIMIT 5;
```

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Services  │
│   (React)       │◄──►│   (Express)     │◄──►│   (OpenAI)      │
│   Port 3000     │    │   Port 3001     │    │   Skills Match  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Port 5432     │
                       └─────────────────┘
```

## Next Steps

- [ ] Add comprehensive error handling
- [ ] Implement admin panel
- [ ] Add data export functionality
- [ ] Enhance security measures
- [ ] Add monitoring and analytics
- [ ] Implement caching layer
- [ ] Add email notifications
- [ ] Create mobile-responsive design
- [ ] Add internationalization
- [ ] Implement advanced search features
