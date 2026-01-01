# Scoreboard Management System

A comprehensive multi-role scoreboard system for managing players, teams, matches, and automatically calculating player statistics.

## Features

- **Admin Panel**: Manage players, teams, and scoreboards
- **Scorer Interface**: Record match results with team and player selection
- **Public View**: Display standings and match history via public URLs
- **Role-Based Access**: Admin and Scorer roles with proper permissions
- **Real-Time Stats**: Automatic calculation of wins/losses per player
- **Render-Ready**: Configured for easy deployment to Render.com

## Tech Stack

- **Backend**: Node.js + Express + PostgreSQL + Sequelize
- **Frontend**: React + Vite + React Router
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Render.com (PostgreSQL + Web Service + Static Site)

## Local Development

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd scoreboard-app
   ```

2. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```
   Or use your local PostgreSQL installation.

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   npm run migrate
   npm run seed
   npm run dev
   ```

4. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/health

### Demo Credentials

After running the seed script:
- **Admin**: admin@scoreboard.com / admin123
- **Scorer**: scorer@scoreboard.com / scorer123

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Render.com.

### Quick Deploy with Blueprint

1. Push code to GitHub/GitLab
2. Go to Render Dashboard → New → Blueprint
3. Connect your repository
4. Render will auto-detect `render.yaml` and deploy all services

## Project Structure

```
scoreboard-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth middleware
│   │   └── server.js       # Express server
│   ├── scripts/
│   │   ├── migrate.js      # Database migration
│   │   └── seed.js         # Seed data
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # API client
│   │   └── App.jsx         # Main app
│   └── package.json
├── render.yaml             # Render blueprint
├── docker-compose.yml      # Local PostgreSQL
└── DEPLOYMENT.md           # Deployment guide
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin (requires admin role)
- `GET /api/players` - List players
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/players` - Assign player to team
- `GET /api/scoreboards` - List scoreboards
- `POST /api/scoreboards` - Create scoreboard
- `POST /api/scoreboards/:id/teams` - Assign team to scoreboard

### Scorer (requires scorer or admin role)
- `GET /api/matches/scoreboard/:scoreboardId` - List matches
- `POST /api/matches` - Create match with participants
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match

### Public (no auth required)
- `GET /api/public/scoreboard/:slug` - Get scoreboard info
- `GET /api/public/scoreboard/:slug/standings` - Get player standings
- `GET /api/public/scoreboard/:slug/matches` - Get match history

## Development

### Run Tests
```bash
cd backend
npm test
```

### Database Migrations
```bash
cd backend
npm run migrate
```

### Seed Sample Data
```bash
cd backend
npm run seed
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT
