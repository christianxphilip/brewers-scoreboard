const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MatchParticipant = sequelize.define('MatchParticipant', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        matchId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'matches',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        teamId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'teams',
                key: 'id'
            }
        },
        playerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'players',
                key: 'id'
            }
        },
        result: {
            type: DataTypes.ENUM('win', 'loss'),
            allowNull: false,
            comment: 'Match result for this participant'
        }
    }, {
        tableName: 'match_participants',
        timestamps: true,
        indexes: [
            {
                fields: ['matchId']
            },
            {
                fields: ['playerId']
            },
            {
                fields: ['teamId']
            }
        ]
    });

    return MatchParticipant;
};
