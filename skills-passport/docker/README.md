# Skills Passport Docker Setup

This directory contains Docker configuration files for running the Skills Passport application in containers.

## Quick Start

1. **Copy environment file:**
   ```bash
   cp docker/.env.example docker/.env
   ```

2. **Update environment variables:**
   Edit `docker/.env` and set your OpenAI API key and other configuration values.

3. **Start the application:**
   ```bash
   cd docker
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: localhost:5432

## Services

### Frontend (Port 3000)
- React.js application with TypeScript
- Nginx reverse proxy for production
- Handles client-side routing
- Proxies API requests to backend

### Backend (Port 3001)
- Node.js/Express API server
- Handles authentication, CV processing, and data management
- Connects to PostgreSQL database
- Integrates with OpenAI API for CV parsing

### Database (Port 5432)
- PostgreSQL 15 with Alpine Linux
- Persistent data storage
- Health checks enabled
- Automatic initialization

### AI Services (Port 3002)
- Skills matching and processing services
- Mock data generation for testing
- Automated testing suite

## Environment Variables

Key environment variables to configure:

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `JWT_SECRET`: Secret key for JWT tokens (change in production)
- `POSTGRES_PASSWORD`: Database password
- `NODE_ENV`: Environment (development/production)

## Development

For development with hot reloading:

```bash
# Start only the database
docker-compose up -d postgres

# Run backend and frontend locally
cd ../backend && npm run dev
cd ../frontend && npm run dev
```

## Production Deployment

1. Update environment variables for production
2. Use strong passwords and secrets
3. Configure proper SSL/TLS termination
4. Set up monitoring and logging
5. Configure backup strategies for the database

## Troubleshooting

### Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

## Health Checks

All services include health checks:
- Database: PostgreSQL ready check
- Backend: HTTP health endpoint
- Frontend: Nginx status

Check service health:
```bash
docker-compose ps
```

## Data Persistence

- Database data is persisted in the `postgres_data` volume
- Uploaded files are stored in `../backend/uploads`
- AI services data is mounted from `../ai-services/data`

## Security Notes

- Change default passwords in production
- Use environment-specific JWT secrets
- Configure proper CORS settings
- Enable HTTPS in production
- Regular security updates for base images
