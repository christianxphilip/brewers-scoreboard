const express = require('express');
const { Scoreboard, Team, ScoreboardTeam, ScorerUser, User } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all scoreboards (admin sees all, scorer sees assigned)
router.get('/', authenticate, async (req, res) => {
    try {
        let scoreboards;

        if (req.user.role === 'admin') {
            scoreboards = await Scoreboard.findAll({
                include: [
                    {
                        association: 'teams',
                        attributes: ['id', 'name', 'logo'],
                        through: { attributes: [] }
                    },
                    {
                        association: 'creator',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        association: 'scorers',
                        include: [
                            {
                                association: 'user',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Scorers see only assigned scoreboards
            const scorerAssignments = await ScorerUser.findAll({
                where: { userId: req.user.id },
                include: [
                    {
                        association: 'scoreboard',
                        include: [
                            {
                                association: 'teams',
                                attributes: ['id', 'name', 'logo'],
                                through: { attributes: [] }
                            }
                        ]
                    }
                ]
            });
            scoreboards = scorerAssignments.map(sa => sa.scoreboard);
        }

        res.json(scoreboards);
    } catch (error) {
        console.error('Error fetching scoreboards:', error);
        res.status(500).json({ error: 'Failed to fetch scoreboards' });
    }
});

// Get scoreboard by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const scoreboard = await Scoreboard.findByPk(req.params.id, {
            include: [
                {
                    association: 'teams',
                    attributes: ['id', 'name', 'logo'],
                    through: { attributes: [] },
                    include: [
                        {
                            association: 'players',
                            attributes: ['id', 'name', 'photo'],
                            through: { attributes: [] }
                        }
                    ]
                },
                {
                    association: 'creator',
                    attributes: ['id', 'name', 'email']
                },
                {
                    association: 'scorers',
                    include: [
                        {
                            association: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        // Check access: admin or assigned scorer
        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: {
                    userId: req.user.id,
                    scoreboardId: scoreboard.id
                }
            });

            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied to this scoreboard' });
            }
        }

        res.json(scoreboard);
    } catch (error) {
        console.error('Error fetching scoreboard:', error);
        res.status(500).json({ error: 'Failed to fetch scoreboard' });
    }
});

// Create scoreboard (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, description, publicSlug, status } = req.body;

        if (!name || !publicSlug) {
            return res.status(400).json({ error: 'Name and public slug are required' });
        }

        // Check if slug is unique
        const existing = await Scoreboard.findOne({ where: { publicSlug } });
        if (existing) {
            return res.status(400).json({ error: 'Public slug already exists' });
        }

        const scoreboard = await Scoreboard.create({
            name,
            description,
            publicSlug,
            status: status || 'active',
            createdBy: req.user.id
        });

        res.status(201).json(scoreboard);
    } catch (error) {
        console.error('Error creating scoreboard:', error);
        res.status(500).json({ error: 'Failed to create scoreboard' });
    }
});

// Update scoreboard (admin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, description, publicSlug, status } = req.body;
        const scoreboard = await Scoreboard.findByPk(req.params.id);

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        // If changing slug, check uniqueness
        if (publicSlug && publicSlug !== scoreboard.publicSlug) {
            const existing = await Scoreboard.findOne({ where: { publicSlug } });
            if (existing) {
                return res.status(400).json({ error: 'Public slug already exists' });
            }
        }

        await scoreboard.update({ name, description, publicSlug, status });
        res.json(scoreboard);
    } catch (error) {
        console.error('Error updating scoreboard:', error);
        res.status(500).json({ error: 'Failed to update scoreboard' });
    }
});

// Delete scoreboard (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const scoreboard = await Scoreboard.findByPk(req.params.id);

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        await scoreboard.destroy();
        res.json({ message: 'Scoreboard deleted successfully' });
    } catch (error) {
        console.error('Error deleting scoreboard:', error);
        res.status(500).json({ error: 'Failed to delete scoreboard' });
    }
});

// Assign team to scoreboard (admin only)
router.post('/:id/teams', authenticate, requireAdmin, async (req, res) => {
    try {
        const { teamId } = req.body;
        const scoreboardId = req.params.id;

        if (!teamId) {
            return res.status(400).json({ error: 'Team ID is required' });
        }

        const scoreboard = await Scoreboard.findByPk(scoreboardId);
        const team = await Team.findByPk(teamId);

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if already assigned
        const existing = await ScoreboardTeam.findOne({
            where: { scoreboardId, teamId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Team already assigned to this scoreboard' });
        }

        await ScoreboardTeam.create({ scoreboardId, teamId });

        const updatedScoreboard = await Scoreboard.findByPk(scoreboardId, {
            include: [
                {
                    association: 'teams',
                    attributes: ['id', 'name', 'logo'],
                    through: { attributes: [] }
                }
            ]
        });

        res.json(updatedScoreboard);
    } catch (error) {
        console.error('Error assigning team to scoreboard:', error);
        res.status(500).json({ error: 'Failed to assign team to scoreboard' });
    }
});

// Remove team from scoreboard (admin only)
router.delete('/:id/teams/:teamId', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id: scoreboardId, teamId } = req.params;

        const scoreboardTeam = await ScoreboardTeam.findOne({
            where: { scoreboardId, teamId }
        });

        if (!scoreboardTeam) {
            return res.status(404).json({ error: 'Team not assigned to this scoreboard' });
        }

        await scoreboardTeam.destroy();
        res.json({ message: 'Team removed from scoreboard successfully' });
    } catch (error) {
        console.error('Error removing team from scoreboard:', error);
        res.status(500).json({ error: 'Failed to remove team from scoreboard' });
    }
});

// Assign scorer to scoreboard (admin only)
router.post('/:id/scorers', authenticate, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.body;
        const scoreboardId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const scoreboard = await Scoreboard.findByPk(scoreboardId);
        const user = await User.findByPk(userId);

        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        if (user.role !== 'scorer' && user.role !== 'admin') {
            return res.status(400).json({ error: 'User must be a scorer or admin' });
        }

        // Check if already assigned
        const existing = await ScorerUser.findOne({
            where: { userId, scoreboardId }
        });

        if (existing) {
            return res.status(400).json({ error: 'User already assigned to this scoreboard' });
        }

        await ScorerUser.create({ userId, scoreboardId, role: 'scorer' });

        const updatedScoreboard = await Scoreboard.findByPk(scoreboardId, {
            include: [
                {
                    association: 'scorers',
                    include: [
                        {
                            association: 'user',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });

        res.json(updatedScoreboard);
    } catch (error) {
        console.error('Error assigning scorer to scoreboard:', error);
        res.status(500).json({ error: 'Failed to assign scorer to scoreboard' });
    }
});

// Remove scorer from scoreboard (admin only)
router.delete('/:id/scorers/:userId', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id: scoreboardId, userId } = req.params;

        const scorerUser = await ScorerUser.findOne({
            where: { scoreboardId, userId }
        });

        if (!scorerUser) {
            return res.status(404).json({ error: 'User not assigned to this scoreboard' });
        }

        await scorerUser.destroy();
        res.json({ message: 'Scorer removed from scoreboard successfully' });
    } catch (error) {
        console.error('Error removing scorer from scoreboard:', error);
        res.status(500).json({ error: 'Failed to remove scorer from scoreboard' });
    }
});

module.exports = router;
