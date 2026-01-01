const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CORS_ORIGIN
].filter(Boolean).map(origin => {
    if (origin && !origin.startsWith('http')) {
        return `https://${origin}`;
    }
    return origin;
});

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
            callback(null, true);
        } else {
            console.log('CORS Blocked for origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/players', require('./routes/playerRoutes'));
app.use('/api/teams', require('./routes/teamRoutes'));
app.use('/api/scoreboards', require('./routes/scoreboardRoutes'));
app.use('/api/matches', require('./routes/matchRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});

// Start server
const startServer = async () => {
    try {
        await testConnection();

        // Seed default admin if it doesn't exist
        const { User } = require('./models');
        const adminExists = await User.findOne({ where: { role: 'admin' } });
        if (!adminExists) {
            console.log('🌱 Seeding default admin user...');
            await User.create({
                email: 'admin@scoreboard.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin'
            });
            console.log('✅ Default admin user created');
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
