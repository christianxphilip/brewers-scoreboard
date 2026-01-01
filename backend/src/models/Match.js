const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Match = sequelize.define('Match', {
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
        location: {
            type: DataTypes.STRING,
            allowNull: true
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        status: {
            type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'scheduled'
        },
        createdBy: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        isEdited: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'matches',
        timestamps: true
    });

    return Match;
};
