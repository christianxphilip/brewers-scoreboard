const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TeamPlayer = sequelize.define('TeamPlayer', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        teamId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'teams',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        playerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'players',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        removalRequested: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: 'Flag for scorers requesting player removal from team'
        }
    }, {
        tableName: 'team_players',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['teamId', 'playerId']
            }
        ]
    });

    return TeamPlayer;
};
