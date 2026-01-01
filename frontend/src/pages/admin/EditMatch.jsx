import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function EditMatch() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        location: '',
        date: '',
        participants: [],
        remarks: ''
    });

    useEffect(() => {
        fetchMatch();
    }, [id]);

    const fetchMatch = async () => {
        try {
            const response = await api.get(`/matches/${id}`);
            const m = response.data;
            setMatch(m);
            setFormData({
                location: m.location || '',
                date: new Date(m.date).toISOString().slice(0, 16),
                participants: m.participants.map(p => ({
                    teamId: p.teamId,
                    playerId: p.playerId,
                    result: p.result,
                    playerName: p.player.name,
                    teamName: p.team.name
                })),
                remarks: m.remarks || ''
            });
        } catch (error) {
            console.error('Error fetching match:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultToggle = (playerId, result) => {
        const newParticipants = formData.participants.map(p => {
            if (p.playerId === playerId) {
                return { ...p, result };
            }
            // If marking a new winner, others must be losers
            if (result === 'win' && p.playerId !== playerId) {
                return { ...p, result: 'loss' };
            }
            return p;
        });
        setFormData({ ...formData, participants: newParticipants });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.remarks) {
            alert('Remarks are required for admin edits.');
            return;
        }

        const winners = formData.participants.filter(p => p.result === 'win');
        if (winners.length !== 1) {
            alert('A match must have exactly one winner.');
            return;
        }

        try {
            await api.put(`/matches/${id}`, formData);
            alert('Match updated successfully!');
            navigate(-1);
        } catch (error) {
            console.error('Error updating match:', error);
            alert(error.response?.data?.error || 'Failed to update match');
        }
    };

    if (loading) return <div className="loading">Loading Match Data...</div>;
    if (!match) return <div className="error">Match not found.</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>Edit Match Result</h1>
                <p>Correct match results or details. Remarks are mandatory.</p>
            </div>

            <form onSubmit={handleSubmit} className="edit-match-form">
                <div className="grid-2">
                    <div className="card glass">
                        <h2>Match Details</h2>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                        <div className="form-group">
                            <label>Admin Remarks (Required)</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                placeholder="Explain why this match was edited..."
                                rows="4"
                                required
                            ></textarea>
                        </div>
                    </div>

                    <div className="card glass">
                        <h2>Participants & Results</h2>
                        <div className="players-list">
                            {formData.participants.map((p) => (
                                <div key={p.playerId} className="player-edit-row">
                                    <div className="player-info">
                                        <span className="p-name">{p.playerName}</span>
                                        <span className="p-team">{p.teamName}</span>
                                    </div>
                                    <div className="result-toggles">
                                        <button
                                            type="button"
                                            className={`toggle-btn win ${p.result === 'win' ? 'active' : ''}`}
                                            onClick={() => handleResultToggle(p.playerId, 'win')}
                                        >
                                            WIN
                                        </button>
                                        <button
                                            type="button"
                                            className={`toggle-btn loss ${p.result === 'loss' ? 'active' : ''}`}
                                            onClick={() => handleResultToggle(p.playerId, 'loss')}
                                        >
                                            LOSS
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                    <button type="submit" className="btn-primary btn-large">Save Match Changes</button>
                </div>
            </form>

            <style>{`
                .edit-match-form { margin-top: 2rem; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                @media (max-width: 1024px) { .grid-2 { grid-template-columns: 1fr; } }
                
                .player-edit-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 12px;
                    margin-bottom: 0.75rem;
                }
                .player-info { display: flex; flex-direction: column; }
                .p-name { font-weight: 700; color: #1e293b; }
                .p-team { font-size: 0.75rem; color: var(--text-light); }
                
                .result-toggles { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; }
                .toggle-btn {
                    padding: 0.5rem 1rem; border: none; background: transparent;
                    border-radius: 8px; font-weight: 800; font-size: 0.75rem; cursor: pointer;
                    color: var(--text-light); transition: all 0.2s;
                }
                .toggle-btn.win.active { background: var(--success); color: white; }
                .toggle-btn.loss.active { background: var(--danger); color: white; }
                
                .form-actions { margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem; }
                textarea { width: 100%; border-radius: 12px; border: 1px solid var(--border); padding: 1rem; font-family: inherit; }
            `}</style>
        </div>
    );
}
