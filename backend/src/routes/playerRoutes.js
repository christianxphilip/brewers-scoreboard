const express = require('express');
const { Player } = require('../models');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const { getStorage, getFileUrl, deleteFile } = require('../services/storage');

const upload = multer({ storage: getStorage('players') });

const router = express.Router();

// Get all players
router.get('/', authenticate, async (req, res) => {
    try {
        const players = await Player.findAll({
            order: [['name', 'ASC']]
        });
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Get player by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const player = await Player.findByPk(req.params.id, {
            include: [
                {
                    association: 'teams',
                    attributes: ['id', 'name', 'logo']
                }
            ]
        });

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.json(player);
    } catch (error) {
        console.error('Error fetching player:', error);
        res.status(500).json({ error: 'Failed to fetch player' });
    }
});

// Create player (admin only)
router.post('/', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name } = req.body;
        let photo = req.body.photo;

        if (req.file) {
            photo = getFileUrl(req.file.key || req.file.path, 'players');
        }

        if (!name) {
            return res.status(400).json({ error: 'Player name is required' });
        }

        const player = await Player.create({ name, photo });
        res.status(201).json(player);
    } catch (error) {
        console.error('Error creating player:', error);
        res.status(500).json({ error: 'Failed to create player' });
    }
});

// Update player (admin only)
router.put('/:id', authenticate, requireAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name } = req.body;
        let photo = req.body.photo;
        const player = await Player.findByPk(req.params.id);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (req.file) {
            // Delete old photo if it exists
            if (player.photo) {
                await deleteFile(player.photo, 'players');
            }
            photo = getFileUrl(req.file.key || req.file.path, 'players');
        }

        await player.update({ name, photo });
        res.json(player);
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// Delete player (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const player = await Player.findByPk(req.params.id);

        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }

        if (player.photo) {
            await deleteFile(player.photo, 'players');
        }
        await player.destroy();
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: 'Failed to delete player' });
    }
});

module.exports = router;
