const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Player = sequelize.define('Player', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'URL or path to player photo'
        }
    }, {
        tableName: 'players',
        timestamps: true
    });

    return Player;
};
