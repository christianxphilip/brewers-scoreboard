const express = require('express');
const { Match, MatchParticipant, Scoreboard, Team, Player, ScorerUser, ScoreboardTeam } = require('../models');
const { authenticate, requireScorer } = require('../middleware/auth');

const router = express.Router();

// Get matches created by the current user
router.get('/my-matches', authenticate, requireScorer, async (req, res) => {
    try {
        const matches = await Match.findAll({
            where: { createdBy: req.user.id },
            include: [
                {
                    association: 'scoreboard',
                    attributes: ['id', 'name']
                },
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
                }
            ],
            order: [['date', 'DESC']]
        });

        res.json(matches);
    } catch (error) {
        console.error('Error fetching my matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get all matches for a scoreboard
router.get('/scoreboard/:scoreboardId', authenticate, async (req, res) => {
    try {
        const { scoreboardId } = req.params;

        // Verify access
        const scoreboard = await Scoreboard.findByPk(scoreboardId);
        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: { userId: req.user.id, scoreboardId }
            });
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const matches = await Match.findAll({
            where: { scoreboardId },
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
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['date', 'DESC']]
        });

        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// Get match by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id, {
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
                    association: 'scoreboard',
                    attributes: ['id', 'name', 'publicSlug']
                },
                {
                    association: 'creator',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Verify access
        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: { userId: req.user.id, scoreboardId: match.scoreboardId }
            });
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(match);
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

// Create match (scorer or admin)
router.post('/', authenticate, requireScorer, async (req, res) => {
    try {
        const { scoreboardId, location, date, participants } = req.body;

        if (!scoreboardId || !participants || !Array.isArray(participants) || participants.length === 0) {
            return res.status(400).json({ error: 'Scoreboard ID and participants are required' });
        }

        // Verify scoreboard exists
        const scoreboard = await Scoreboard.findByPk(scoreboardId);
        if (!scoreboard) {
            return res.status(404).json({ error: 'Scoreboard not found' });
        }

        // Verify user has access to this scoreboard
        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: { userId: req.user.id, scoreboardId }
            });
            if (!hasAccess) {
                return res.status(403).json({ error: 'You are not assigned to this scoreboard' });
            }
        }

        // Validate all teams belong to scoreboard
        const teamIds = [...new Set(participants.map(p => p.teamId))];
        for (const teamId of teamIds) {
            const scoreboardTeam = await ScoreboardTeam.findOne({
                where: { scoreboardId, teamId }
            });
            if (!scoreboardTeam) {
                return res.status(400).json({ error: `Team ${teamId} is not in this scoreboard` });
            }
        }

        // Validate all players exist and belong to their teams
        for (const participant of participants) {
            const player = await Player.findByPk(participant.playerId);
            if (!player) {
                return res.status(404).json({ error: `Player ${participant.playerId} not found` });
            }

            // Check if player belongs to the team
            const team = await Team.findByPk(participant.teamId, {
                include: [
                    {
                        association: 'players',
                        where: { id: participant.playerId },
                        required: false
                    }
                ]
            });

            if (!team || team.players.length === 0) {
                return res.status(400).json({
                    error: `Player ${participant.playerId} does not belong to team ${participant.teamId}`
                });
            }

            // Validate result
            if (!['win', 'loss'].includes(participant.result)) {
                return res.status(400).json({ error: 'Result must be "win" or "loss"' });
            }
        }

        // Create match
        const match = await Match.create({
            scoreboardId,
            location,
            date: date || new Date(),
            status: 'completed',
            createdBy: req.user.id
        });

        // Create participants
        const participantRecords = await Promise.all(
            participants.map(p =>
                MatchParticipant.create({
                    matchId: match.id,
                    teamId: p.teamId,
                    playerId: p.playerId,
                    result: p.result
                })
            )
        );

        // Fetch complete match with participants
        const completeMatch = await Match.findByPk(match.id, {
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
                }
            ]
        });

        res.status(201).json(completeMatch);
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Failed to create match' });
    }
});

// Update match (scorer or admin)
router.put('/:id', authenticate, requireScorer, async (req, res) => {
    try {
        const { location, date, status, participants, remarks } = req.body;
        const match = await Match.findByPk(req.params.id);

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Verify access
        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: { userId: req.user.id, scoreboardId: match.scoreboardId }
            });
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        // Admin edit logic
        const updateData = { location, date, status };
        if (req.user.role === 'admin') {
            if (!remarks) {
                return res.status(400).json({ error: 'Remarks are required when an admin edits a match' });
            }
            updateData.isEdited = true;
            updateData.remarks = remarks;

            // Update participants if provided
            if (participants && Array.isArray(participants)) {
                // Delete existing participants and recreate
                await MatchParticipant.destroy({ where: { matchId: match.id } });
                await Promise.all(
                    participants.map(p =>
                        MatchParticipant.create({
                            matchId: match.id,
                            teamId: p.teamId,
                            playerId: p.playerId,
                            result: p.result
                        })
                    )
                );
            }
        }

        await match.update(updateData);

        // Fetch updated match
        const updatedMatch = await Match.findByPk(match.id, {
            include: [
                {
                    association: 'participants',
                    include: [
                        { association: 'player', attributes: ['id', 'name'] },
                        { association: 'team', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        res.json(updatedMatch);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Failed to update match' });
    }
});

// Delete match (scorer or admin)
router.delete('/:id', authenticate, requireScorer, async (req, res) => {
    try {
        const match = await Match.findByPk(req.params.id);

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Verify access
        if (req.user.role !== 'admin') {
            const hasAccess = await ScorerUser.findOne({
                where: { userId: req.user.id, scoreboardId: match.scoreboardId }
            });
            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await match.destroy();
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ error: 'Failed to delete match' });
    }
});

module.exports = router;
