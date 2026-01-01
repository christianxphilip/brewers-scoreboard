const { User, Player, Team, TeamPlayer, Scoreboard, ScoreboardTeam } = require('../src/models');

const seed = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // Create admin user
        const admin = await User.create({
            email: 'admin@scoreboard.com',
            password: 'admin123',
            name: 'Admin User',
            role: 'admin'
        });
        console.log('✅ Created admin user');

        // Create scorer user
        const scorer = await User.create({
            email: 'scorer@scoreboard.com',
            password: 'scorer123',
            name: 'Scorer User',
            role: 'scorer'
        });
        console.log('✅ Created scorer user');

        // Create players
        const players = await Promise.all([
            Player.create({ name: 'John Doe', photo: null }),
            Player.create({ name: 'Jane Smith', photo: null }),
            Player.create({ name: 'Mike Johnson', photo: null }),
            Player.create({ name: 'Sarah Williams', photo: null }),
            Player.create({ name: 'Tom Brown', photo: null }),
            Player.create({ name: 'Emily Davis', photo: null })
        ]);
        console.log('✅ Created 6 players');

        // Create teams
        const teamA = await Team.create({ name: 'Team Alpha', logo: null });
        const teamB = await Team.create({ name: 'Team Beta', logo: null });
        console.log('✅ Created 2 teams');

        // Assign players to teams
        await TeamPlayer.create({ teamId: teamA.id, playerId: players[0].id });
        await TeamPlayer.create({ teamId: teamA.id, playerId: players[1].id });
        await TeamPlayer.create({ teamId: teamA.id, playerId: players[2].id });
        await TeamPlayer.create({ teamId: teamB.id, playerId: players[3].id });
        await TeamPlayer.create({ teamId: teamB.id, playerId: players[4].id });
        await TeamPlayer.create({ teamId: teamB.id, playerId: players[5].id });
        console.log('✅ Assigned players to teams');

        // Create scoreboard
        const scoreboard = await Scoreboard.create({
            name: 'Championship 2026',
            description: 'Annual championship scoreboard',
            publicSlug: 'championship-2026',
            status: 'active',
            createdBy: admin.id
        });
        console.log('✅ Created scoreboard');

        // Assign teams to scoreboard
        await ScoreboardTeam.create({ scoreboardId: scoreboard.id, teamId: teamA.id });
        await ScoreboardTeam.create({ scoreboardId: scoreboard.id, teamId: teamB.id });
        console.log('✅ Assigned teams to scoreboard');

        console.log('\n📋 Seed Data Summary:');
        console.log('  Admin: admin@scoreboard.com / admin123');
        console.log('  Scorer: scorer@scoreboard.com / scorer123');
        console.log('  Public URL: /public/scoreboard/championship-2026');
        console.log('\n✅ Database seeding completed successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seed();
