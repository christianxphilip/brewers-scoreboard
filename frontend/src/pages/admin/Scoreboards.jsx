import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { useNotification } from '../../contexts/NotificationContext';

export default function Scoreboards() {
    const { alert, confirm } = useNotification();
    const [scoreboards, setScoreboards] = useState([]);
    const [teams, setTeams] = useState([]);
    const [scorers, setScorers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showScorerModal, setShowScorerModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', publicSlug: '', status: 'active' });
    const [selectedScoreboard, setSelectedScoreboard] = useState(null);
    const [selectedScorerId, setSelectedScorerId] = useState('');
    const [inviteData, setInviteData] = useState({ name: '', email: '', password: 'scorer123' });
    const [teamSearch, setTeamSearch] = useState('');
    const [showTeamDropdown, setShowTeamDropdown] = useState(null); // ID of the scoreboard showing dropdown

    useEffect(() => {
        fetchScoreboards();
        fetchTeams();
        fetchScorers();
    }, []);

    const fetchScoreboards = async () => {
        try {
            const response = await api.get('/scoreboards');
            setScoreboards(response.data);
            if (selectedScoreboard) {
                const updated = response.data.find(s => s.id === selectedScoreboard.id);
                if (updated) setSelectedScoreboard(updated);
            }
        } catch (error) {
            console.error('Error fetching scoreboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchScorers = async () => {
        try {
            const response = await api.get('/auth/users');
            setScorers(response.data);
        } catch (error) {
            console.error('Error fetching scorers:', error);
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', description: '', publicSlug: '', status: 'active' });
        setSelectedScoreboard(null);
        setShowModal(true);
    };

    const handleEdit = (scoreboard) => {
        setFormData({
            name: scoreboard.name,
            description: scoreboard.description || '',
            publicSlug: scoreboard.publicSlug,
            status: scoreboard.status
        });
        setSelectedScoreboard(scoreboard);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedScoreboard) {
                await api.put(`/scoreboards/${selectedScoreboard.id}`, formData);
            } else {
                await api.post('/scoreboards', formData);
            }
            setShowModal(false);
            fetchScoreboards();
        } catch (error) {
            console.error('Error saving scoreboard:', error);
            alert(error.response?.data?.error || 'Failed to save scoreboard', 'Error', 'danger');
        }
    };

    const handleDelete = async (id) => {
        confirm('Are you sure you want to delete this scoreboard? This will also delete all associated matches and data.', async () => {
            try {
                await api.delete(`/scoreboards/${id}`);
                fetchScoreboards();
            } catch (error) {
                console.error('Error deleting scoreboard:', error);
                alert(error.response?.data?.error || 'Failed to delete scoreboard', 'Error', 'danger');
            }
        }, 'Delete Scoreboard', 'danger');
    };

    const handleToggleStatus = async (scoreboard) => {
        const newStatus = scoreboard.status === 'active' ? 'inactive' : 'active';
        try {
            await api.put(`/scoreboards/${scoreboard.id}`, { ...scoreboard, status: newStatus });
            fetchScoreboards();
        } catch (error) {
            console.error('Error toggling status:', error);
            alert(error.response?.data?.error || 'Failed to toggle status', 'Error', 'danger');
        }
    };

    const handleAddTeam = async (scoreboardId, teamId) => {
        try {
            await api.post(`/scoreboards/${scoreboardId}/teams`, { teamId });
            fetchScoreboards();
        } catch (error) {
            console.error('Error adding team:', error);
            alert(error.response?.data?.error || 'Failed to add team', 'Error', 'danger');
        }
    };

    const handleRemoveTeam = async (scoreboardId, teamId) => {
        confirm('Remove this team from the scoreboard?', async () => {
            try {
                await api.delete(`/scoreboards/${scoreboardId}/teams/${teamId}`);
                fetchScoreboards();
            } catch (error) {
                console.error('Error removing team:', error);
                alert(error.response?.data?.error || 'Failed to remove team', 'Error', 'danger');
            }
        }, 'Remove Team', 'warning');
    };

    const handleManageScorers = (scoreboard) => {
        setSelectedScoreboard(scoreboard);
        setShowScorerModal(true);
    };

    const handleAssignScorer = async () => {
        if (!selectedScorerId) return;
        try {
            await api.post(`/scoreboards/${selectedScoreboard.id}/scorers`, { userId: selectedScorerId });
            setSelectedScorerId('');
            fetchScoreboards();
        } catch (error) {
            console.error('Error assigning scorer:', error);
            alert(error.response?.data?.error || 'Failed to assign scorer', 'Error', 'danger');
        }
    };

    const handleInviteScorer = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/register', { ...inviteData, role: 'scorer' });
            const newUser = response.data.user;
            await api.post(`/scoreboards/${selectedScoreboard.id}/scorers`, { userId: newUser.id });
            setInviteData({ name: '', email: '', password: 'scorer123' });
            fetchScorers();
            fetchScoreboards();
        } catch (error) {
            console.error('Error inviting scorer:', error);
            alert(error.response?.data?.error || 'Failed to invite scorer', 'Error', 'danger');
        }
    };

    const handleRemoveScorer = async (userId) => {
        confirm('Remove this scorer from the scoreboard?', async () => {
            try {
                await api.delete(`/scoreboards/${selectedScoreboard.id}/scorers/${userId}`);
                fetchScoreboards();
            } catch (error) {
                console.error('Error removing scorer:', error);
                alert(error.response?.data?.error || 'Failed to remove scorer', 'Error', 'danger');
            }
        }, 'Remove Scorer', 'warning');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>Scoreboards</h1>
                <button onClick={openAddModal} className="btn-primary">
                    Create Scoreboard
                </button>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedScoreboard ? 'Edit Scoreboard' : 'Create New Scoreboard'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g. Summer Championship 2026"
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the tournament or league..."
                        />
                    </div>
                    <div className="form-group">
                        <label>Public Slug * (URL-friendly)</label>
                        <input
                            type="text"
                            value={formData.publicSlug}
                            onChange={(e) => setFormData({ ...formData, publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                            required
                            placeholder="championship-2026"
                        />
                        <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--primary)', fontWeight: 500 }}>
                            Public URL: /public/{formData.publicSlug || '...'}
                        </small>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            {selectedScoreboard ? 'Update Scoreboard' : 'Create Scoreboard'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showScorerModal}
                onClose={() => setShowScorerModal(false)}
                title={`Manage Scorers - ${selectedScoreboard?.name}`}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '1rem' }}>
                            Assign Existing Scorer
                        </h4>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={selectedScorerId}
                                onChange={(e) => setSelectedScorerId(e.target.value)}
                                style={{ flex: 1 }}
                            >
                                <option value="">Select a scorer</option>
                                {scorers.filter(s => !selectedScoreboard?.scorers?.find(ss => ss.userId === s.id)).map(scorer => (
                                    <option key={scorer.id} value={scorer.id}>{scorer.name} ({scorer.email})</option>
                                ))}
                            </select>
                            <button onClick={handleAssignScorer} className="btn-primary" disabled={!selectedScorerId}>Assign</button>
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '1rem' }}>
                            Invite New Scorer
                        </h4>
                        <form onSubmit={handleInviteScorer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={inviteData.name}
                                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    value={inviteData.email}
                                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-secondary" style={{ width: '100%' }}>Create & Assign Scorer</button>
                        </form>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '1rem' }}>
                            Assigned Scorers ({selectedScoreboard?.scorers?.length || 0})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {selectedScoreboard?.scorers?.map((scorer) => (
                                <div key={scorer.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'white', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{scorer.user?.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{scorer.user?.email}</p>
                                    </div>
                                    <button onClick={() => handleRemoveScorer(scorer.userId)} className="btn-small btn-danger">Remove</button>
                                </div>
                            ))}
                            {(!selectedScoreboard?.scorers || selectedScoreboard.scorers.length === 0) && (
                                <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>No scorers assigned yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <button onClick={() => setShowScorerModal(false)} className="btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>Done</button>
            </Modal>

            <div className="teams-grid slide-up">
                {scoreboards.map((scoreboard) => (
                    <div key={scoreboard.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>{scoreboard.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleToggleStatus(scoreboard)}
                                    className={`badge ${scoreboard.status === 'active' ? 'badge-active' : 'badge-inactive'}`}
                                    style={{ border: 'none', cursor: 'pointer' }}
                                    title="Click to toggle status"
                                >
                                    {scoreboard.status.toUpperCase()}
                                </button>
                                <div className="dropdown">
                                    <button className="btn-icon">⋮</button>
                                    <div className="dropdown-content">
                                        <button onClick={() => handleEdit(scoreboard)}>Edit Details</button>
                                        <button onClick={() => handleDelete(scoreboard.id)} className="text-danger">Delete Scoreboard</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.5rem', minHeight: '3rem' }}>
                            {scoreboard.description || 'No description provided.'}
                        </p>

                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                                Public Access
                            </p>
                            <a
                                href={`/public/${scoreboard.publicSlug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                🔗 /public/{scoreboard.publicSlug}
                            </a>
                        </div>

                        <div className="scoreboard-teams">
                            <h4 style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Teams ({scoreboard.teams?.length || 0})</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {scoreboard.teams?.map((team) => (
                                    <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', background: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{team.name}</span>
                                        <button
                                            onClick={() => handleRemoveTeam(scoreboard.id, team.id)}
                                            style={{ border: 'none', background: 'none', padding: '0 0.25rem', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', lineHeight: 1 }}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="custom-dropdown-container" style={{ marginBottom: '1.5rem' }}>
                                <button
                                    className="btn-add-team-trigger"
                                    onClick={() => {
                                        setShowTeamDropdown(showTeamDropdown === scoreboard.id ? null : scoreboard.id);
                                        setTeamSearch('');
                                    }}
                                >
                                    <span className="icon">+</span> Add Team to Scoreboard
                                </button>

                                {showTeamDropdown === scoreboard.id && (
                                    <div className="custom-dropdown-menu">
                                        <div className="dropdown-search">
                                            <input
                                                type="text"
                                                placeholder="Search teams..."
                                                value={teamSearch}
                                                onChange={(e) => setTeamSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="dropdown-options">
                                            {teams
                                                .filter(t => !scoreboard.teams?.find(st => st.id === t.id))
                                                .filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
                                                .map(team => (
                                                    <div
                                                        key={team.id}
                                                        className="dropdown-option"
                                                        onClick={() => {
                                                            handleAddTeam(scoreboard.id, team.id);
                                                            setShowTeamDropdown(null);
                                                        }}
                                                    >
                                                        <span className="option-name">{team.name}</span>
                                                    </div>
                                                ))
                                            }
                                            {teams.filter(t => !scoreboard.teams?.find(st => st.id === t.id)).filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase())).length === 0 && (
                                                <div className="dropdown-no-results">No teams found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', margin: 0 }}>Scorers ({scoreboard.scorers?.length || 0})</h4>
                                    <button onClick={() => handleManageScorers(scoreboard)} className="btn-small btn-secondary">Manage</button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {scoreboard.scorers?.map((scorer) => (
                                        <span key={scorer.id} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '100px', fontWeight: 500 }}>
                                            {scorer.user?.name}
                                        </span>
                                    ))}
                                    {(!scoreboard.scorers || scoreboard.scorers.length === 0) && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontStyle: 'italic' }}>No scorers assigned</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {scoreboards.length === 0 && <p className="empty-state">No scoreboards yet. Create one to get started!</p>}
            <style>{`
                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .badge-active { background: #f0fdf4; color: #166534; }
                .badge-inactive { background: #f1f5f9; color: #64748b; }
                
                .btn-icon {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--text-light);
                    cursor: pointer;
                    padding: 0.25rem 0.5rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: var(--text);
                }

                .dropdown {
                    position: relative;
                    display: inline-block;
                }
                .dropdown-content {
                    display: none;
                    position: absolute;
                    right: 0;
                    background-color: white;
                    min-width: 160px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    z-index: 10;
                    border: 1px solid var(--border);
                    overflow: hidden;
                }
                .dropdown:hover .dropdown-content {
                    display: block;
                }
                .dropdown-content button {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    text-align: left;
                    background: none;
                    border: none;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text);
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .dropdown-content button:hover {
                    background: #f8fafc;
                }
                .dropdown-content button.text-danger {
                    color: #ef4444;
                }
                .dropdown-content button.text-danger:hover {
                    background: #fef2f2;
                }

                .custom-dropdown-container {
                    position: relative;
                }
                .btn-add-team-trigger {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #f8fafc;
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                    color: var(--text-light);
                    font-size: 0.875rem;
                    font-weight: 600;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .btn-add-team-trigger:hover {
                    background: #f1f5f9;
                    border-color: var(--primary);
                    color: var(--primary);
                }
                .btn-add-team-trigger .icon {
                    font-size: 1.125rem;
                    font-weight: 400;
                }

                .custom-dropdown-menu {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    box-shadow: var(--shadow-lg);
                    z-index: 100;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .dropdown-search {
                    padding: 0.75rem;
                    border-bottom: 1px solid var(--border);
                    background: #f8fafc;
                }
                .dropdown-search input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    font-size: 0.875rem;
                    outline: none;
                }
                .dropdown-search input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px var(--primary-light);
                }

                .dropdown-options {
                    max-height: 200px;
                    overflow-y: auto;
                }
                .dropdown-option {
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                .dropdown-option:hover {
                    background: #f1f5f9;
                }
                .dropdown-option .option-name {
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: var(--text);
                }
                .dropdown-no-results {
                    padding: 1.5rem;
                    text-align: center;
                    color: var(--text-light);
                    font-size: 0.875rem;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
