const { sequelize } = require('../config/database');

// Import all models
const User = require('./User')(sequelize);
const Player = require('./Player')(sequelize);
const Team = require('./Team')(sequelize);
const TeamPlayer = require('./TeamPlayer')(sequelize);
const Scoreboard = require('./Scoreboard')(sequelize);
const ScoreboardTeam = require('./ScoreboardTeam')(sequelize);
const Match = require('./Match')(sequelize);
const MatchParticipant = require('./MatchParticipant')(sequelize);
const ScorerUser = require('./ScorerUser')(sequelize);

// Define associations

// User associations
User.hasMany(Scoreboard, { foreignKey: 'createdBy', as: 'scoreboards' });
User.hasMany(Match, { foreignKey: 'createdBy', as: 'matches' });
User.hasMany(ScorerUser, { foreignKey: 'userId', as: 'scorerAssignments' });

// Player associations
Player.belongsToMany(Team, { through: TeamPlayer, foreignKey: 'playerId', as: 'teams' });
Player.hasMany(MatchParticipant, { foreignKey: 'playerId', as: 'matchParticipations' });

// Team associations
Team.belongsToMany(Player, { through: TeamPlayer, foreignKey: 'teamId', as: 'players' });
Team.belongsToMany(Scoreboard, { through: ScoreboardTeam, foreignKey: 'teamId', as: 'scoreboards' });
Team.hasMany(MatchParticipant, { foreignKey: 'teamId', as: 'matchParticipations' });

// Scoreboard associations
Scoreboard.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Scoreboard.belongsToMany(Team, { through: ScoreboardTeam, foreignKey: 'scoreboardId', as: 'teams' });
Scoreboard.hasMany(Match, { foreignKey: 'scoreboardId', as: 'matches' });
Scoreboard.hasMany(ScorerUser, { foreignKey: 'scoreboardId', as: 'scorers' });

// Match associations
Match.belongsTo(Scoreboard, { foreignKey: 'scoreboardId', as: 'scoreboard' });
Match.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
Match.hasMany(MatchParticipant, { foreignKey: 'matchId', as: 'participants' });

// MatchParticipant associations
MatchParticipant.belongsTo(Match, { foreignKey: 'matchId', as: 'match' });
MatchParticipant.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
MatchParticipant.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

// ScorerUser associations
ScorerUser.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ScorerUser.belongsTo(Scoreboard, { foreignKey: 'scoreboardId', as: 'scoreboard' });

// Export all models
module.exports = {
    sequelize,
    User,
    Player,
    Team,
    TeamPlayer,
    Scoreboard,
    ScoreboardTeam,
    Match,
    MatchParticipant,
    ScorerUser
};
