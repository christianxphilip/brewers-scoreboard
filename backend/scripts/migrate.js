const { sequelize } = require('../src/config/database');
const models = require('../src/models');

const migrate = async () => {
    try {
        console.log('🔄 Starting database migration...');

        // Sync all models with database
        // Use alter: true to update schema without dropping tables
        try {
            await sequelize.sync({ alter: true });
        } catch (syncError) {
            console.warn('⚠️ Automatic sync failed, attempting manual column updates...', syncError.message);

            // Manually add missing columns if sync fails (common with unique constraints/enums)
            const queryInterface = sequelize.getQueryInterface();
            const tables = await queryInterface.showAllTables();

            if (tables.includes('matches')) {
                const matchCols = await queryInterface.describeTable('matches');
                if (!matchCols.isEdited) {
                    await queryInterface.addColumn('matches', 'isEdited', {
                        type: DataTypes.BOOLEAN,
                        allowNull: false,
                        defaultValue: false
                    });
                }
                if (!matchCols.remarks) {
                    await queryInterface.addColumn('matches', 'remarks', {
                        type: DataTypes.TEXT,
                        allowNull: true
                    });
                }
            }

            if (tables.includes('team_players')) {
                const tpCols = await queryInterface.describeTable('team_players');
                if (!tpCols.removalRequested) {
                    await queryInterface.addColumn('team_players', 'removalRequested', {
                        type: DataTypes.BOOLEAN,
                        allowNull: false,
                        defaultValue: false
                    });
                }
            }

            console.log('✅ Manual column updates completed');
        }

        console.log('✅ Database migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

const { DataTypes } = require('sequelize');
migrate();
