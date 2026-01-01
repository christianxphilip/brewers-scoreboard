import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';

export default function PublicScoreboard() {
    const { slug } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const [scoreboard, setScoreboard] = useState(null);
    const [standings, setStandings] = useState([]);
    const [teamStandings, setTeamStandings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('standings');
    const [standingType, setStandingType] = useState('player');

    useEffect(() => {
        fetchData();
    }, [slug]);

    const fetchData = async () => {
        try {
            const [scoreboardRes, standingsRes, teamStandingsRes, matchesRes] = await Promise.all([
                api.get(`/public/scoreboard/${slug}`),
                api.get(`/public/scoreboard/${slug}/standings`),
                api.get(`/public/scoreboard/${slug}/team-standings`),
                api.get(`/public/scoreboard/${slug}/matches`)
            ]);

            setScoreboard(scoreboardRes.data);
            setStandings(standingsRes.data);
            setTeamStandings(teamStandingsRes.data);
            setMatches(matchesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMatch = (matchId) => {
        navigate(`/admin/matches/${matchId}/edit`);
    };

    if (loading) return <div className="loading">Loading Scoreboard...</div>;

    if (!scoreboard) {
        return (
            <div className="public-error fade-in">
                <div className="error-card glass">
                    <h1>Scoreboard Not Found</h1>
                    <p>The scoreboard "{slug}" does not exist or is not active.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-scoreboard fade-in">
            <header className="public-header glass">
                <div className="container">
                    <div className="header-content">
                        <div className="logo-badge">🏆</div>
                        <div>
                            <h1>{scoreboard.name}</h1>
                            {scoreboard.description && <p className="desc">{scoreboard.description}</p>}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container main-content">
                <div className="tabs-container glass">
                    <div className="tabs">
                        <button
                            className={activeTab === 'standings' ? 'active' : ''}
                            onClick={() => setActiveTab('standings')}
                        >
                            <span className="icon">📊</span> Standings
                        </button>
                        <button
                            className={activeTab === 'matches' ? 'active' : ''}
                            onClick={() => setActiveTab('matches')}
                        >
                            <span className="icon">🕒</span> Match History
                        </button>
                    </div>
                </div>

                <div className="tab-content slide-up">
                    {activeTab === 'standings' && (
                        <div className="standings-view card glass">
                            <div className="view-header">
                                <div className="view-title-group">
                                    <h2>{standingType === 'player' ? 'Player Standings' : 'Team Standings'}</h2>
                                    <span className="player-count">
                                        {standingType === 'player' ? `${standings.length} Players` : `${teamStandings.length} Teams`}
                                    </span>
                                </div>
                                <div className="dropdown-wrapper">
                                    <select
                                        value={standingType}
                                        onChange={(e) => setStandingType(e.target.value)}
                                        className="standing-dropdown"
                                    >
                                        <option value="player">Player Standings</option>
                                        <option value="team">Team Standings</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-wrapper">
                                <table className={`standings-table ${standingType === 'team' ? 'team-table' : ''}`}>
                                    {standingType === 'player' ? (
                                        <>
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Player</th>
                                                    <th className="hide-mobile">Team</th>
                                                    <th className="hide-mobile">W</th>
                                                    <th className="hide-mobile">L</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {standings.map((player, index) => (
                                                    <tr key={player.id} className="standings-row">
                                                        <td className="rank-cell">
                                                            <span className={`rank-badge rank-${index + 1}`}>{index + 1}</span>
                                                        </td>
                                                        <td className="player-main-cell">
                                                            <div className="player-cell">
                                                                <div className="player-avatar hide-mobile">
                                                                    {player.photo ? (
                                                                        <img src={getImageUrl(player.photo)} alt="" />
                                                                    ) : (
                                                                        <div className="avatar-placeholder">{player.name.charAt(0)}</div>
                                                                    )}
                                                                </div>
                                                                <div className="player-info">
                                                                    <span className="name">{player.name}</span>
                                                                    <span className="team-mobile">{player.teamName}</span>
                                                                    <div className="stats-mobile">
                                                                        <span className="stat">W: {player.wins}</span>
                                                                        <span className="stat">L: {player.losses}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="hide-mobile">{player.teamName}</td>
                                                        <td className="stat-win hide-mobile">{player.wins}</td>
                                                        <td className="stat-loss hide-mobile">{player.losses}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </>
                                    ) : (
                                        <>
                                            <thead>
                                                <tr>
                                                    <th className="rank-cell">Rank</th>
                                                    <th>Team</th>
                                                    <th className="hide-mobile">Wins</th>
                                                    <th className="hide-mobile">Losses</th>
                                                    <th className="hide-mobile">Win Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {teamStandings.map((team, index) => {
                                                    const total = parseInt(team.wins) + parseInt(team.losses);
                                                    const winRate = total > 0 ? Math.round((parseInt(team.wins) / total) * 100) : 0;

                                                    return (
                                                        <tr key={team.id}>
                                                            <td className="rank-cell">
                                                                <div className={`rank-badge rank-${index + 1}`}>{index + 1}</div>
                                                            </td>
                                                            <td className="player-main-cell">
                                                                <div className="player-cell">
                                                                    <div className="player-avatar team-avatar">
                                                                        {team.logo ? (
                                                                            <img src={getImageUrl(team.logo)} alt={team.name} className="team-img" />
                                                                        ) : (
                                                                            <div className="avatar-placeholder">{team.name.charAt(0)}</div>
                                                                        )}
                                                                    </div>
                                                                    <div className="player-info">
                                                                        <span className="name">{team.name}</span>
                                                                        <div className="stats-mobile">
                                                                            <span className="stat">W: {team.wins}</span>
                                                                            <span className="stat">L: {team.losses}</span>
                                                                            <span className="stat">{winRate}% WR</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="hide-mobile stat-win">{team.wins}</td>
                                                            <td className="hide-mobile stat-loss">{team.losses}</td>
                                                            <td className="hide-mobile">
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <div style={{ width: '60px', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                                        <div style={{ width: `${winRate}%`, height: '100%', background: 'var(--primary)' }}></div>
                                                                    </div>
                                                                    <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{winRate}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </>
                                    )}
                                </table>
                            </div>
                            {((standingType === 'player' && standings.length === 0) || (standingType === 'team' && teamStandings.length === 0)) && (
                                <div className="empty-state">
                                    <p>No data recorded yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'matches' && (
                        <div className="matches-view">
                            <div className="matches-grid">
                                {matches.map((match) => (
                                    <div key={match.id} className="match-card card glass">
                                        <div className="match-card-header">
                                            <div className="match-info">
                                                <span className="match-date">📅 {new Date(match.date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                {match.location && <span className="match-location">📍 {match.location}</span>}
                                            </div>
                                            <div className="match-meta">
                                                {match.isEdited && <span className="edited-badge">Edited by Admin</span>}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div className="scorer-pill">
                                                        <span className="icon">👤</span>
                                                        <span className="label">Scorer:</span>
                                                        <span className="name">{match.scorer}</span>
                                                    </div>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleEditMatch(match.id)}
                                                            className="btn-edit-match"
                                                            title="Edit Match Results"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {match.isEdited && match.remarks && (
                                            <div className="match-remarks">
                                                <span className="remarks-label">Admin Remarks:</span>
                                                <p>{match.remarks}</p>
                                            </div>
                                        )}

                                        <div className="match-results-grid">
                                            <div className="result-side winner">
                                                <div className="side-header">
                                                    <span className="status-badge">WINNERS</span>
                                                </div>
                                                <div className="participants-list">
                                                    {match.winners.map((w, i) => (
                                                        <div key={i} className="participant-item">
                                                            <span className="p-name">{w.player.name}</span>
                                                            <span className="p-team">{w.team.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="result-side loser">
                                                <div className="side-header">
                                                    <span className="status-badge">LOSERS</span>
                                                </div>
                                                <div className="participants-list">
                                                    {match.losers.map((l, i) => (
                                                        <div key={i} className="participant-item">
                                                            <span className="p-name">{l.player.name}</span>
                                                            <span className="p-team">{l.team.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {matches.length === 0 && (
                                <div className="empty-state card glass">
                                    <p>No matches recorded yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >

            <style>{`
                .public-scoreboard {
                    min-height: 100vh;
                    background: #f8fafc;
                    padding-bottom: 4rem;
                }
                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 0 1.5rem;
                }
                .public-header {
                    background: white;
                    padding: 3rem 0;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid var(--border);
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .logo-badge {
                    font-size: 3rem;
                    background: var(--primary-light);
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 20px;
                    box-shadow: var(--shadow-lg);
                }
                .public-header h1 { margin: 0; font-size: 2.25rem; font-weight: 800; color: #1e293b; }
                .public-header .desc { color: var(--text-light); margin-top: 0.5rem; font-size: 1.125rem; }

                .tabs-container {
                    margin-bottom: 2rem;
                    padding: 0.5rem;
                    border-radius: 16px;
                    display: inline-block;
                }
                .tabs { display: flex; gap: 0.5rem; }
                .tabs button {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: transparent;
                    border-radius: 12px;
                    font-weight: 700;
                    color: var(--text-light);
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .tabs button.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: var(--shadow-md);
                }
                .tabs button:hover:not(.active) {
                    background: var(--primary-light);
                    color: var(--primary);
                }

                .view-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .view-title-group {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .view-title-group h2 { margin: 0; }
                .standing-dropdown {
                    padding: 0.5rem 2rem 0.5rem 1rem;
                    border-radius: 10px;
                    border: 1px solid var(--border);
                    background: white;
                    font-weight: 700;
                    color: var(--text);
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 0.5rem center;
                    background-size: 1rem;
                    transition: all 0.2s;
                }
                .standing-dropdown:hover { border-color: var(--primary); }
                .standing-dropdown:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }

                .player-count {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: var(--primary);
                    background: var(--primary-light);
                    padding: 0.4rem 1rem;
                    border-radius: 100px;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    height: fit-content;
                }

                .table-wrapper { overflow-x: auto; }
                .standings-table { width: 100%; border-collapse: collapse; }
                .standings-table th {
                    text-align: left;
                    padding: 1rem;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-light);
                    border-bottom: 2px solid var(--border);
                }
                .standings-table td { padding: 1rem; border-bottom: 1px solid var(--border); }
                .team-table td { padding: 0.5rem 1rem; }
                
                .rank-badge {
                    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
                    border-radius: 8px; font-weight: 800; font-size: 0.875rem; background: #f1f5f9;
                }
                .rank-1 { background: #fef3c7; color: #92400e; }
                .rank-2 { background: #f1f5f9; color: #475569; }
                .rank-3 { background: #ffedd5; color: #9a3412; }

                .player-cell { display: flex; align-items: center; gap: 1rem; }
                .player-avatar { 
                    width: 48px; 
                    height: 48px; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    border: 1px solid var(--border);
                    background: white;
                    flex-shrink: 0;
                }
                .player-avatar.team-avatar {
                    width: 84px;
                    height: 84px;
                    border-radius: 16px;
                }
                .player-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .player-avatar img.team-img { object-fit: contain; padding: 4px; }
                .avatar-placeholder {
                    width: 100%; height: 100%; background: var(--primary-light);
                    color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700;
                    font-size: 1.25rem;
                }
                .player-info { display: flex; flex-direction: column; }
                .player-info .name { font-weight: 700; color: #1e293b; }
                .team-table .player-info .name { font-size: 1.25rem; }
                .team-mobile { display: none; font-size: 0.75rem; color: var(--text-light); }
                .stats-mobile { display: none; }

                .stat-win { font-weight: 700; color: var(--success); }
                .stat-loss { font-weight: 700; color: var(--danger); }

                .matches-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
                .match-card { padding: 1.25rem; }
                .match-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border);
                }
                .match-info { display: flex; flex-direction: column; gap: 0.125rem; }
                .match-date { font-weight: 700; font-size: 0.875rem; }
                .match-location { font-size: 0.8125rem; color: var(--text-light); }
                .match-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
                .edited-badge {
                    font-size: 0.625rem; font-weight: 800; text-transform: uppercase;
                    background: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 4px;
                    border: 1px solid #fcd34d;
                }
                .match-remarks {
                    background: #f8fafc; border-left: 4px solid var(--primary);
                    padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem;
                    font-size: 0.8125rem;
                }
                .remarks-label { font-weight: 800; color: var(--primary); display: block; margin-bottom: 0.25rem; font-size: 0.625rem; text-transform: uppercase; }
                .match-remarks p { margin: 0; color: var(--text-light); line-height: 1.4; }

                .match-results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .result-side { padding: 0.75rem; border-radius: 12px; }
                .result-side.winner { background: #f0fdf4; border: 1px solid #bcf0da; }
                .result-side.loser { background: #fef2f2; border: 1px solid #fecaca; }
                .side-header { margin-bottom: 0.5rem; }
                .status-badge { font-size: 0.625rem; font-weight: 800; letter-spacing: 0.05em; padding: 0.2rem 0.5rem; border-radius: 4px; }
                .winner .status-badge { background: var(--success); color: white; }
                .loser .status-badge { background: var(--danger); color: white; }
                
                .participant-item { display: flex; flex-direction: column; margin-bottom: 0.25rem; }
                .participant-item:last-child { margin-bottom: 0; }
                .p-name { font-weight: 700; font-size: 0.9375rem; color: #1e293b; }
                .p-team { font-size: 0.75rem; color: var(--text-light); }

                @media (max-width: 768px) {
                    .container { padding: 0; }
                    .public-header .container { padding: 0 1.5rem; }
                    .main-content { padding: 0; }
                    .card { border-radius: 0 !important; border-left: none !important; border-right: none !important; box-shadow: none !important; }
                    .tabs-container { border-radius: 0; border-left: none; border-right: none; margin-bottom: 1rem; }
                    .view-header { padding: 1.5rem; }
                    .standings-table td { padding: 1rem; }
                    .rank-cell { padding-left: 1.5rem !important; }
                    .player-main-cell { padding-right: 1.5rem !important; }
                    .empty-state { margin: 0 1.5rem; }
                    .matches-view { padding: 0; }
                    .match-card { margin-bottom: 0.75rem; }

                    .public-header { padding: 2rem 0; }
                    .logo-badge { width: 60px; height: 60px; font-size: 2rem; border-radius: 16px; }
                    .public-header h1 { font-size: 1.5rem; }
                    .public-header .desc { font-size: 0.875rem; }
                    
                    .hide-mobile { display: none; }
                    .team-mobile { display: block; font-weight: 600; color: var(--text-light); margin-bottom: 0.25rem; }
                    .stats-mobile { display: flex; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: var(--text-light); margin-top: 0.25rem; flex-wrap: wrap; }
                    .stats-mobile .stat { background: #f1f5f9; padding: 0.125rem 0.5rem; border-radius: 4px; white-space: nowrap; }
                    
                    .standings-table td { padding: 1rem 0.5rem; }
                    .rank-cell { width: 40px; vertical-align: top; padding-top: 1.25rem !important; }
                    .player-main-cell { vertical-align: top; }

                    .match-results-grid { grid-template-columns: 1fr; }
                    .view-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                        padding: 1.5rem;
                    }
                    .view-title-group {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .dropdown-wrapper {
                        width: 100%;
                    }
                    .standing-dropdown {
                        width: 100%;
                    }
                    .player-avatar.team-avatar {
                        width: 64px;
                        height: 64px;
                        border-radius: 12px;
                    }
                    .team-table .player-info .name { font-size: 1.125rem; }
                    .tabs-container {
                        width: 100%;
                        overflow-x: auto;
                        display: block;
                        -webkit-overflow-scrolling: touch;
                        padding: 0.5rem 0;
                    }
                    .tabs {
                        width: max-content;
                        padding: 0 1.5rem;
                    }
                    .tabs button {
                        padding: 0.625rem 1rem;
                        font-size: 0.875rem;
                        white-space: nowrap;
                    }
                }

                .btn-edit-match {
                    padding: 0.25rem 0.75rem;
                    background: white;
                    color: var(--primary);
                    border: 1px solid var(--primary);
                    border-radius: 6px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-edit-match:hover {
                    background: var(--primary);
                    color: white;
                }

                .scorer-pill {
                    display: flex;
                    align-items: center;
                    gap: 0.375rem;
                    background: #f1f5f9;
                    padding: 0.25rem 0.75rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #475569;
                    border: 1px solid #e2e8f0;
                }
                .scorer-pill .icon { font-size: 0.875rem; }
                .scorer-pill .label { color: #94a3b8; font-weight: 500; }
                .scorer-pill .name { color: #1e293b; font-weight: 700; }
            `}</style>
        </div >
    );
}
