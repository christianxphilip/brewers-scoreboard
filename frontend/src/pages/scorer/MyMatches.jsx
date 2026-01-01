import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getImageUrl } from '../../utils/imageUtils';

export default function MyMatches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyMatches();
    }, []);

    const fetchMyMatches = async () => {
        try {
            const response = await api.get('/matches/my-matches');
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching my matches:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading your history...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>My Recorded Matches</h1>
                    <p style={{ color: 'var(--text-light)' }}>Review the results you've recorded across all scoreboards.</p>
                </div>
            </div>

            <div className="matches-list slide-up" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {matches.map((match) => (
                    <div key={match.id} className="card glass match-history-card">
                        <div className="match-history-header">
                            <div className="match-meta">
                                <span className="scoreboard-badge">{match.scoreboard?.name}</span>
                                <span className="match-date">📅 {new Date(match.date).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</span>
                                {match.location && <span className="match-location">📍 {match.location}</span>}
                                {match.isEdited && <span className="edited-badge">Edited by Admin</span>}
                            </div>
                        </div>

                        {match.isEdited && match.remarks && (
                            <div className="match-remarks">
                                <span className="remarks-label">Admin Remarks:</span>
                                <p>{match.remarks}</p>
                            </div>
                        )}

                        <div className="match-history-results">
                            {/* Group by team */}
                            {Array.from(new Set(match.participants.map(p => p.teamId))).map(teamId => {
                                const team = match.participants.find(p => p.teamId === teamId).team;
                                const teamParticipants = match.participants.filter(p => p.teamId === teamId);
                                const isWinner = teamParticipants[0].result === 'win';

                                return (
                                    <div key={teamId} className={`team-result-group ${isWinner ? 'winner' : 'loser'}`}>
                                        <div className="team-info">
                                            {team.logo && <img src={getImageUrl(team.logo)} alt="" className="team-logo-tiny" />}
                                            <span className="team-name">{team.name}</span>
                                            {isWinner && <span className="win-label">🏆 WINNER</span>}
                                        </div>
                                        <div className="players-list-tiny">
                                            {teamParticipants.map(p => (
                                                <span key={p.id} className="player-tag">{p.player.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {matches.length === 0 && (
                    <div className="empty-state card glass" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏱️</div>
                        <h2>No Matches Recorded</h2>
                        <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto' }}>
                            You haven't recorded any matches yet. Go to "My Scoreboards" to start recording results!
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .match-history-card {
                    padding: 1.5rem;
                    border-radius: 20px;
                }
                .match-history-header {
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .match-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    align-items: center;
                }
                .scoreboard-badge {
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .match-date, .match-location {
                    font-size: 0.8125rem;
                    color: var(--text-light);
                    font-weight: 500;
                }
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
                .match-history-results {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .team-result-group {
                    padding: 1rem;
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1px solid var(--border);
                }
                .team-result-group.winner {
                    border-color: var(--success);
                    background: #f0fdf4;
                }
                .team-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                }
                .team-logo-tiny {
                    width: 24px;
                    height: 24px;
                    border-radius: 4px;
                }
                .team-name {
                    font-weight: 700;
                    font-size: 0.9375rem;
                }
                .win-label {
                    font-size: 0.625rem;
                    font-weight: 800;
                    color: var(--success);
                    background: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 4px;
                    border: 1px solid var(--success);
                }
                .players-list-tiny {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.375rem;
                }
                .player-tag {
                    font-size: 0.75rem;
                    background: white;
                    padding: 0.125rem 0.5rem;
                    border-radius: 6px;
                    border: 1px solid var(--border);
                    color: var(--text-light);
                }

                @media (max-width: 640px) {
                    .match-history-results {
                        grid-template-columns: 1fr;
                    }
                    .match-meta {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
}
