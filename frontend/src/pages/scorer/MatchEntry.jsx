import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useNotification } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageUtils';

export default function MatchEntry() {
    const { scoreboardId } = useParams();
    const navigate = useNavigate();
    const { alert } = useNotification();
    const [scoreboard, setScoreboard] = useState(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        location: '',
        date: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16),
        participants: []
    });
    const [selectedTeams, setSelectedTeams] = useState([]);

    useEffect(() => {
        fetchScoreboard();
    }, [scoreboardId]);

    const fetchScoreboard = async () => {
        try {
            const response = await api.get(`/scoreboards/${scoreboardId}`);
            setScoreboard(response.data);
        } catch (error) {
            console.error('Error fetching scoreboard:', error);
        }
    };

    const handleTeamToggle = (teamId) => {
        if (selectedTeams.includes(teamId)) {
            setSelectedTeams(selectedTeams.filter(id => id !== teamId));
            setFormData({
                ...formData,
                participants: formData.participants.filter(p => p.teamId !== teamId)
            });
        } else {
            setSelectedTeams([...selectedTeams, teamId]);
        }
    };

    const handleAddParticipant = (teamId, playerId, result) => {
        // Rule: Only one player per team
        // Remove any existing participants for this team
        let newParticipants = formData.participants.filter(p => p.teamId !== teamId);

        // Rule: Only one winner across all teams
        // If this player is being marked as winner, mark all other participants as losers
        if (result === 'win') {
            newParticipants = newParticipants.map(p => ({ ...p, result: 'loss' }));
        }

        newParticipants.push({ teamId, playerId, result });
        setFormData({ ...formData, participants: newParticipants });
    };

    const handleAutoFillTeam = (teamId, result) => {
        // This is now "Mark Team Winner"
        // We need to know WHICH player from this team is selected
        const participant = formData.participants.find(p => p.teamId === teamId);
        if (!participant) {
            alert('Please select a player for this team first.', 'Selection Required', 'warning');
            return;
        }

        handleAddParticipant(teamId, participant.playerId, result);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (selectedTeams.length < 2) {
            alert('Please select at least 2 teams.', 'Incomplete Selection', 'warning');
            return;
        }

        if (formData.participants.length !== selectedTeams.length) {
            alert('Please select one player for each team.', 'Incomplete Roster', 'warning');
            return;
        }

        const winners = formData.participants.filter(p => p.result === 'win');
        if (winners.length !== 1) {
            alert('Please select exactly one winner.', 'Winner Required', 'warning');
            return;
        }

        try {
            await api.post('/matches', {
                scoreboardId,
                ...formData
            });
            alert('Match recorded successfully!', 'Success', 'success');
            navigate('/scorer');
        } catch (error) {
            console.error('Error creating match:', error);
            alert(error.response?.data?.error || 'Failed to create match', 'Error', 'danger');
        }
    };

    if (!scoreboard) return <div className="loading">Loading...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header match-entry-header">
                <div className="header-text">
                    <h1>Record Match</h1>
                    <p className="scoreboard-name">{scoreboard.name}</p>
                </div>
                <div className="step-indicator">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
                    <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
                </div>
            </div>

            <div className="match-entry-container slide-up">
                {step === 1 && (
                    <div className="card glass step-card">
                        <h2>Match Details</h2>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Main Court, Stadium A"
                            />
                        </div>
                        <div className="form-group">
                            <label>Date & Time</label>
                            <input
                                type="datetime-local"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="step-actions">
                            <button onClick={() => setStep(2)} className="btn-primary btn-full-mobile">Next: Select Teams</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="card glass step-card">
                        <h2>Select Teams</h2>
                        <p className="step-desc">Choose the two teams competing in this match.</p>

                        <div className="teams-selection-grid">
                            {scoreboard.teams?.map((team) => (
                                <div
                                    key={team.id}
                                    className={`team-select-card ${selectedTeams.includes(team.id) ? 'selected' : ''}`}
                                    onClick={() => handleTeamToggle(team.id)}
                                >
                                    <div className="team-logo-container">
                                        {team.logo ? (
                                            <img src={getImageUrl(team.logo)} alt={team.name} />
                                        ) : (
                                            <div className="team-logo-placeholder">{team.name.charAt(0)}</div>
                                        )}
                                    </div>
                                    <h3>{team.name}</h3>
                                    <div className="selection-indicator">
                                        {selectedTeams.includes(team.id) ? '✓ Selected' : 'Tap to Select'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="step-actions split">
                            <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                            <button
                                onClick={() => setStep(3)}
                                className="btn-primary"
                                disabled={selectedTeams.length === 0}
                            >
                                Next: Mark Results
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="results-step">
                        <div className="step-header-info">
                            <h2>Mark Results</h2>
                            <p className="step-desc">Select 1 player per team, then mark exactly 1 winner.</p>
                        </div>

                        <div className="results-grid">
                            {selectedTeams.map((teamId) => {
                                const team = scoreboard.teams.find(t => t.id === teamId);
                                const teamParticipant = formData.participants.find(p => p.teamId === teamId);
                                const isWinner = teamParticipant?.result === 'win';

                                return (
                                    <div key={teamId} className="card glass team-results-card">
                                        <div className="team-results-header">
                                            <div className="team-header-info">
                                                {team.logo && <img src={getImageUrl(team.logo)} alt="" className="team-logo-small" />}
                                                <h3>{team.name}</h3>
                                            </div>
                                            <button
                                                type="button"
                                                className={`btn-small ${isWinner ? 'btn-success' : 'btn-secondary'}`}
                                                onClick={() => handleAutoFillTeam(teamId, 'win')}
                                                disabled={!teamParticipant}
                                            >
                                                {isWinner ? '🏆 Winner' : 'Mark Winner'}
                                            </button>
                                        </div>

                                        <div className="players-list">
                                            {team.players?.map((player) => {
                                                const isSelected = teamParticipant?.playerId === player.id;
                                                const result = isSelected ? teamParticipant.result : null;

                                                return (
                                                    <div key={player.id} className={`player-row ${isSelected ? 'active' : ''}`}>
                                                        <div className="player-info-main" onClick={() => handleAddParticipant(teamId, player.id, 'loss')}>
                                                            <div className="selection-radio">
                                                                <div className={`radio-inner ${isSelected ? 'checked' : ''}`}></div>
                                                            </div>
                                                            <span className="player-name">{player.name}</span>
                                                        </div>

                                                        {isSelected && (
                                                            <div className="result-toggles">
                                                                <button
                                                                    type="button"
                                                                    className={`toggle-btn win ${result === 'win' ? 'active' : ''}`}
                                                                    onClick={() => handleAddParticipant(teamId, player.id, 'win')}
                                                                >
                                                                    W
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={`toggle-btn loss ${result === 'loss' ? 'active' : ''}`}
                                                                    onClick={() => handleAddParticipant(teamId, player.id, 'loss')}
                                                                >
                                                                    L
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="step-actions split final-actions">
                            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
                            <div className="submit-group">
                                <button onClick={() => navigate('/scorer')} className="btn-secondary">Cancel</button>
                                <button onClick={handleSubmit} className="btn-primary btn-large">Save Match</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .match-entry-header {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                @media (min-width: 768px) {
                    .match-entry-header {
                        flex-direction: row;
                        justify-content: space-between;
                        align-items: center;
                    }
                }
                .scoreboard-name {
                    color: var(--text-light);
                    font-weight: 500;
                }

                .step-indicator {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .step {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--border);
                    color: var(--text-light);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.875rem;
                    transition: all 0.3s ease;
                }
                .step.active {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 0 0 4px var(--primary-light);
                }
                .step-indicator .line {
                    width: 30px;
                    height: 2px;
                    background: var(--border);
                    transition: all 0.3s ease;
                }
                .step-indicator .line.active {
                    background: var(--primary);
                }

                .step-card {
                    padding: 1.5rem;
                }
                @media (min-width: 768px) {
                    .step-card { padding: 2.5rem; }
                }
                .step-desc {
                    color: var(--text-light);
                    margin-bottom: 2rem;
                }

                .teams-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .teams-selection-grid {
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 1.5rem;
                    }
                }

                .team-select-card {
                    padding: 1.25rem;
                    background: white;
                    border: 2px solid var(--border);
                    border-radius: 16px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .team-select-card.selected {
                    border-color: var(--primary);
                    background: var(--primary-light);
                }
                .team-logo-container {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                @media (min-width: 768px) {
                    .team-logo-container { width: 80px; height: 80px; }
                }
                .team-logo-container img { width: 100%; height: 100%; object-fit: cover; }
                .team-select-card h3 { font-size: 1rem; margin-bottom: 0.5rem; }
                .selection-indicator { font-size: 0.625rem; font-weight: 800; text-transform: uppercase; color: var(--text-light); }
                .selected .selection-indicator { color: var(--primary); }

                .results-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 1024px) {
                    .results-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
                }

                .team-results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid var(--border);
                }
                .team-header-info { display: flex; align-items: center; gap: 0.75rem; }
                .team-logo-small { width: 32px; height: 32px; border-radius: 6px; }
                .team-header-info h3 { margin: 0; font-size: 1.125rem; }

                .player-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 1rem;
                    border-radius: 12px;
                    margin-bottom: 0.5rem;
                    background: #f8fafc;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                }
                .player-row.active {
                    background: white;
                    border-color: var(--primary-light);
                    box-shadow: var(--shadow-sm);
                }
                .player-info-main {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    flex: 1;
                    cursor: pointer;
                }
                .selection-radio {
                    width: 20px;
                    height: 20px;
                    border: 2px solid var(--border);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .radio-inner {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: transparent;
                    transition: all 0.2s;
                }
                .radio-inner.checked {
                    background: var(--primary);
                }
                .player-name { font-weight: 700; font-size: 0.9375rem; }
                .result-toggles { display: flex; gap: 4px; background: #f1f5f9; padding: 3px; border-radius: 8px; }
                .toggle-btn {
                    width: 32px; height: 32px; border: none; background: transparent;
                    border-radius: 6px; font-weight: 800; font-size: 0.75rem; cursor: pointer;
                    color: var(--text-light); transition: all 0.2s;
                }
                .toggle-btn.win.active { background: var(--success); color: white; }
                .toggle-btn.loss.active { background: var(--danger); color: white; }

                .step-actions { margin-top: 2rem; display: flex; gap: 1rem; }
                .step-actions.split { justify-content: space-between; }
                .submit-group { display: flex; gap: 0.75rem; }
                
                @media (max-width: 640px) {
                    .btn-full-mobile { width: 100%; }
                    .final-actions { flex-direction: column-reverse; gap: 1rem; }
                    .submit-group { flex-direction: column-reverse; width: 100%; }
                    .submit-group button { width: 100%; }
                    .final-actions > button { width: 100%; }
                }
            `}</style>
        </div>
    );
}
