const express = require('express');
const { Scoreboard, Team, Player, Match, MatchParticipant, sequelize } = require('../models');

const router = express.Router();

// Get public scoreboard by slug
router.get('/scoreboard/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const scoreboard = await Scoreboard.findOne({
            where: { publicSlug: slug, status: 'active' },
            include: [
                {
                    association: 'teams',
                    attributes: ['id', 'name', 'logo'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        res.json(scoreboard);
    } catch (error) {
        console.error('Error fetching public scoreboard:', error);
        res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }
});

// Get standings for a scoreboard
router.get('/scoreboard/:slug/standings', async (req, res) => {
    try {
        const { slug } = req.params;

        const scoreboard = await Scoreboard.findOne({
            where: { publicSlug: slug, status: 'active' }
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        // Get all players from teams in this scoreboard with their stats
        const standings = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.photo,
        t.id as "teamId",
        t.name as "teamName",
        t.logo as "teamLogo",
        COALESCE(SUM(CASE WHEN mp.result = 'win' THEN 1 ELSE 0 END), 0) as wins,
        COALESCE(SUM(CASE WHEN mp.result = 'loss' THEN 1 ELSE 0 END), 0) as losses
      FROM players p
      INNER JOIN team_players tp ON p.id = tp."playerId"
      INNER JOIN teams t ON tp."teamId" = t.id
      INNER JOIN scoreboard_teams st ON t.id = st."teamId"
      LEFT JOIN match_participants mp ON p.id = mp."playerId"
      LEFT JOIN matches m ON mp."matchId" = m.id AND m."scoreboardId" = :scoreboardId AND m.status = 'completed'
      WHERE st."scoreboardId" = :scoreboardId
      GROUP BY p.id, p.name, p.photo, t.id, t.name, t.logo
      ORDER BY wins DESC, losses ASC, p.name ASC
    `, {
            replacements: { scoreboardId: scoreboard.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.json(standings);
    } catch (error) {
        console.error('Error fetching standings:', error);
        res.status(500).json({ error: 'Failed to fetch standings' });
    }
});

// Get team standings for a scoreboard
router.get('/scoreboard/:slug/team-standings', async (req, res) => {
    try {
        const { slug } = req.params;

        const scoreboard = await Scoreboard.findOne({
            where: { publicSlug: slug, status: 'active' }
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        const standings = await sequelize.query(`
      SELECT 
        t.id,
        t.name,
        t.logo,
        COALESCE(SUM(CASE WHEN mp.result = 'win' THEN 1 ELSE 0 END), 0) / NULLIF(COUNT(DISTINCT m.id), 0) * COUNT(DISTINCT m.id) as wins_raw,
        COUNT(DISTINCT CASE WHEN mp.result = 'win' THEN m.id END) as wins,
        COUNT(DISTINCT CASE WHEN mp.result = 'loss' THEN m.id END) as losses
      FROM teams t
      INNER JOIN scoreboard_teams st ON t.id = st."teamId"
      LEFT JOIN match_participants mp ON t.id = mp."teamId"
      LEFT JOIN matches m ON mp."matchId" = m.id AND m."scoreboardId" = :scoreboardId AND m.status = 'completed'
      WHERE st."scoreboardId" = :scoreboardId
      GROUP BY t.id, t.name, t.logo
      ORDER BY wins DESC, losses ASC, t.name ASC
    `, {
            replacements: { scoreboardId: scoreboard.id },
            type: sequelize.QueryTypes.SELECT
        });

        res.json(standings);
    } catch (error) {
        console.error('Error fetching team standings:', error);
        res.status(500).json({ error: 'Failed to fetch team standings' });
    }
});

// Get match logs for a scoreboard
router.get('/scoreboard/:slug/matches', async (req, res) => {
    try {
        const { slug } = req.params;

        const scoreboard = await Scoreboard.findOne({
            where: { publicSlug: slug, status: 'active' }
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        const matches = await Match.findAll({
            where: {
                scoreboardId: scoreboard.id,
                status: 'completed'
            },
            include: [
                {
                    association: 'participants',
                    include: [
                        {
                            association: 'player',
                            attributes: ['id', 'name', 'photo']
                        },
                        {
                            association: 'team',
                            attributes: ['id', 'name', 'logo']
                        }
                    ]
                },
                {
                    association: 'creator',
                    attributes: ['id', 'name']
                }
            ],
            order: [['date', 'DESC']],
            limit: 50 // Limit to recent 50 matches
        });

        // Format matches for display
        const formattedMatches = matches.map(match => {
            const winners = match.participants.filter(p => p.result === 'win');
            const losers = match.participants.filter(p => p.result === 'loss');

            return {
                id: match.id,
                date: match.date,
                location: match.location,
                scorer: match.creator?.name || 'Unknown',
                isEdited: match.isEdited,
                remarks: match.remarks,
                winners: winners.map(w => ({
                    player: w.player,
                    team: w.team
                })),
                losers: losers.map(l => ({
                    player: l.player,
                    team: l.team
                }))
            };
        });

        res.json(formattedMatches);
    } catch (error) {
        console.error('Error fetching match logs:', error);
        res.status(500).json({ error: 'Failed to fetch match logs' });
    }
});

// Get player stats for a scoreboard
router.get('/scoreboard/:slug/player/:playerId', async (req, res) => {
    try {
        const { slug, playerId } = req.params;

        const scoreboard = await Scoreboard.findOne({
            where: { publicSlug: slug, status: 'active' }
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        const player = await Player.findByPk(playerId, {
            include: [
                {
                    association: 'teams',
                    attributes: ['id', 'name', 'logo'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Get player stats for this scoreboard
        const stats = await MatchParticipant.findAll({
            include: [
                {
                    association: 'match',
                    where: {
                        scoreboardId: scoreboard.id,
                        status: 'completed'
                    },
                    attributes: ['id', 'date', 'location']
                },
                {
                    association: 'team',
                    attributes: ['id', 'name', 'logo']
                }
            ],
            where: { playerId }
        });

        const wins = stats.filter(s => s.result === 'win').length;
        const losses = stats.filter(s => s.result === 'loss').length;

        res.json({
            player,
            stats: {
                wins,
                losses,
                totalMatches: wins + losses
            },
            matchHistory: stats.map(s => ({
                matchId: s.match.id,
                date: s.match.date,
                location: s.match.location,
                team: s.team,
                result: s.result
            }))
        });
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ error: 'Failed to fetch player stats' });
    }
});

module.exports = router;
