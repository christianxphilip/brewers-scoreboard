# Running Scoreboard App with Docker Compose

This guide shows you how to run the entire Scoreboard application using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Start all services** (database, backend, frontend):
   ```bash
   docker-compose up --build
   ```

2. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database: localhost:5432

3. **Login credentials** (after seeding):
   - Admin: `admin@scoreboard.com` / `admin123`
   - Scorer: `scorer@scoreboard.com` / `scorer123`

## What Docker Compose Does

The `docker-compose up` command will:
1. ✅ Start PostgreSQL database
2. ✅ Build and start backend service
3. ✅ Run database migrations automatically
4. ✅ Build and start frontend service
5. ✅ Set up networking between all services

## Useful Commands

### Start services in background
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
```

### Stop all services
```bash
docker-compose down
```

### Rebuild and restart
```bash
docker-compose up --build
```

### Seed sample data
```bash
docker-compose exec backend npm run seed
```

### Access backend shell
```bash
docker-compose exec backend sh
```

### Reset everything (including database)
```bash
docker-compose down -v
docker-compose up --build
```

## Services

### PostgreSQL Database
- **Port**: 5432
- **Database**: scoreboard_db
- **User**: postgres
- **Password**: postgres

### Backend API
- **Port**: 5000
- **Health Check**: http://localhost:5000/health
- **Auto-runs migrations** on startup

### Frontend
- **Port**: 5173
- **Vite dev server** with hot reload
- **API URL**: http://localhost:5000

## Troubleshooting

### Port already in use
If you get port conflicts, stop the conflicting service or change ports in `docker-compose.yml`.

### Database connection issues
Wait for the database health check to pass before backend starts. The `depends_on` configuration handles this automatically.

### Changes not reflecting
For code changes:
- Frontend: Changes auto-reload (hot module replacement)
- Backend: Changes auto-reload (nodemon)

For dependency changes:
```bash
docker-compose down
docker-compose up --build
```

### View container status
```bash
docker-compose ps
```

## Development Workflow

1. Start services: `docker-compose up`
2. Make code changes (auto-reloads)
3. View logs: `docker-compose logs -f`
4. Stop when done: `Ctrl+C` or `docker-compose down`

## Production Deployment

For production deployment to Render.com, see [DEPLOYMENT.md](./DEPLOYMENT.md).
