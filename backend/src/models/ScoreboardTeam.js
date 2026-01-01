const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScoreboardTeam = sequelize.define('ScoreboardTeam', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        scoreboardId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'scoreboards',
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
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: 'scoreboard_teams',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['scoreboardId', 'teamId']
            }
        ]
    });

    return ScoreboardTeam;
};
