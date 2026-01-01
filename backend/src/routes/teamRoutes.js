const express = require('express');
const { Team, Player, TeamPlayer } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { getStorage, getFileUrl, deleteFile } = require('../services/storage');

const upload = multer({ storage: getStorage('teams') });

const router = express.Router();

// Get all teams
router.get('/', authenticate, async (req, res) => {
    try {
        const teams = await Team.findAll({
            include: [
                {
                    association: 'players',
                    attributes: ['id', 'name', 'photo'],
                    through: { attributes: ['removalRequested'] }
                }
            ],
            order: [['name', 'ASC']]
        });
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get team by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id, {
            include: [
                {
                    association: 'players',
                    attributes: ['id', 'name', 'photo'],
                    through: { attributes: ['removalRequested'] }
                }
            ]
        });

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        res.json(team);
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Create team (admin only)
router.post('/', authenticate, requireAdmin, upload.single('logo'), async (req, res) => {
    try {
        const { name } = req.body;
        let logo = req.body.logo;

        if (req.file) {
            logo = getFileUrl(req.file.key || req.file.path, 'teams');
        }

        if (!name) {
            return res.status(400).json({ error: 'Team name is required' });
        }

        const team = await Team.create({ name, logo });
        res.status(201).json(team);
    } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
});

// Update team (admin only)
router.put('/:id', authenticate, requireAdmin, upload.single('logo'), async (req, res) => {
    try {
        const { name } = req.body;
        let logo = req.body.logo;
        const team = await Team.findByPk(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (req.file) {
            // Delete old logo if it exists
            if (team.logo) {
                await deleteFile(team.logo, 'teams');
            }
            logo = getFileUrl(req.file.key || req.file.path, 'teams');
        }

        await team.update({ name, logo });
        res.json(team);
    } catch (error) {
        console.error('Error updating team:', error);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete team (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        if (team.logo) {
            await deleteFile(team.logo, 'teams');
        }
        await team.destroy();
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        console.error('Error deleting team:', error);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

// Assign player to team (admin or scorer)
router.post('/:id/players', authenticate, async (req, res) => {
    try {
        const { playerId } = req.body;
        const teamId = req.params.id;

        if (!playerId) {
            return res.status(400).json({ error: 'Player ID is required' });
        }

        const team = await Team.findByPk(teamId);
        const player = await Player.findByPk(playerId);

        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Check if already assigned
        const existing = await TeamPlayer.findOne({
            where: { teamId, playerId }
        });

        if (existing) {
            // If it was requested for removal, clear the flag
            if (existing.removalRequested) {
                await existing.update({ removalRequested: false });
                return res.json({ message: 'Player removal request cancelled, player is back in team' });
            }
            return res.status(400).json({ error: 'Player already assigned to this team' });
        }

        await TeamPlayer.create({ teamId, playerId });

        const updatedTeam = await Team.findByPk(teamId, {
            include: [
                {
                    association: 'players',
                    attributes: ['id', 'name', 'photo'],
                    through: { attributes: ['removalRequested'] }
                }
            ]
        });

        res.json(updatedTeam);
    } catch (error) {
        console.error('Error assigning player to team:', error);
        res.status(500).json({ error: 'Failed to assign player to team' });
    }
});

// Remove player from team (admin deletes, scorer requests removal)
router.delete('/:id/players/:playerId', authenticate, async (req, res) => {
    try {
        const { id: teamId, playerId } = req.params;

        const teamPlayer = await TeamPlayer.findOne({
            where: { teamId, playerId }
        });

        if (!teamPlayer) {
            return res.status(404).json({ error: 'Player not assigned to this team' });
        }

        if (req.user.role === 'admin') {
            // Admin deletes directly
            await teamPlayer.destroy();
            res.json({ message: 'Player removed from team successfully' });
        } else {
            // Scorer requests removal
            await teamPlayer.update({ removalRequested: true });
            res.json({ message: 'Removal request sent to admin for approval' });
        }
    } catch (error) {
        console.error('Error removing player from team:', error);
        res.status(500).json({ error: 'Failed to process player removal' });
    }
});

// Approve or Reject player removal (admin only)
router.post('/:id/players/:playerId/approval', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id: teamId, playerId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const teamPlayer = await TeamPlayer.findOne({
            where: { teamId, playerId }
        });

        if (!teamPlayer) {
            return res.status(404).json({ error: 'Player assignment not found' });
        }

        if (action === 'approve') {
            await teamPlayer.destroy();
            res.json({ message: 'Player removal approved and processed' });
        } else if (action === 'reject') {
            await teamPlayer.update({ removalRequested: false });
            res.json({ message: 'Player removal request rejected' });
        } else {
            res.status(400).json({ error: 'Invalid action. Use "approve" or "reject".' });
        }
    } catch (error) {
        console.error('Error processing removal approval:', error);
        res.status(500).json({ error: 'Failed to process approval' });
    }
});

module.exports = router;
