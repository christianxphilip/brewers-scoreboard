const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScorerUser = sequelize.define('ScorerUser', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
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
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'scorer',
            comment: 'Role within this scoreboard'
        }
    }, {
        tableName: 'scorer_users',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'scoreboardId']
            }
        ]
    });

    return ScorerUser;
};
