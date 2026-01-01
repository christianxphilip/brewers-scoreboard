import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageUtils';

export default function Teams() {
    const { user } = useAuth();
    const { alert, confirm } = useNotification();
    const isAdmin = user?.role === 'admin';
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', logo: '' });
    const [editingId, setEditingId] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [playerSearch, setPlayerSearch] = useState('');
    const [showPlayerDropdown, setShowPlayerDropdown] = useState(false);
    const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [showQuickAdd, setShowQuickAdd] = useState(false);

    useEffect(() => {
        fetchTeams();
        fetchPlayers();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
            if (selectedTeam) {
                const updated = response.data.find(t => t.id === selectedTeam.id);
                if (updated) setSelectedTeam(updated);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlayers = async () => {
        try {
            const response = await api.get('/players');
            setPlayers(response.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', logo: '' });
        setLogoFile(null);
        setLogoPreview(null);
        setEditingId(null);
        setShowTeamModal(true);
    };

    const handleEdit = (team) => {
        setFormData({ name: team.name, logo: team.logo || '' });
        setLogoFile(null);
        setLogoPreview(team.logo || null);
        setEditingId(team.id);
        setShowTeamModal(true);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (logoFile) {
                data.append('logo', logoFile);
            } else if (formData.logo) {
                data.append('logo', formData.logo);
            }

            if (editingId) {
                await api.put(`/teams/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/teams', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowTeamModal(false);
            fetchTeams();
        } catch (error) {
            console.error('Error saving team:', error);
            alert(error.response?.data?.error || 'Failed to save team', 'Error', 'danger');
        }
    };

    const handleManagePlayers = (team) => {
        setSelectedTeam(team);
        setPlayerSearch('');
        setSelectedPlayerId('');
        setShowPlayerDropdown(false);
        setShowQuickAdd(false);
        setNewPlayerName('');
        setShowManageModal(true);
    };

    const handleQuickAddPlayer = async () => {
        if (!newPlayerName.trim()) {
            alert('Please enter a player name.', 'Name Required', 'warning');
            return;
        }

        setIsCreatingPlayer(true);
        try {
            const response = await api.post('/players', {
                name: newPlayerName,
                teamId: selectedTeam.id
            });

            const newPlayer = response.data;

            // Update local players list
            setPlayers([...players, newPlayer]);

            // Refresh teams to show new player in roster
            fetchTeams();

            // Reset state
            setNewPlayerName('');
            setShowQuickAdd(false);
            alert('Player created and added to team!', 'Success', 'success');
        } catch (error) {
            console.error('Error creating player:', error);
            alert(error.response?.data?.error || 'Failed to create player', 'Error', 'danger');
        } finally {
            setIsCreatingPlayer(false);
        }
    };

    const handleAddPlayer = async (playerId) => {
        try {
            await api.post(`/teams/${selectedTeam.id}/players`, { playerId });
            setPlayerSearch('');
            setSelectedPlayerId('');
            setShowPlayerDropdown(false);
            fetchTeams();
        } catch (error) {
            console.error('Error adding player:', error);
            alert(error.response?.data?.error || 'Failed to add player', 'Error', 'danger');
        }
    };

    const filteredPlayers = players
        .filter(p => !selectedTeam?.players?.find(tp => tp.id === p.id))
        .filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase()));

    const handleRemovePlayer = async (teamId, playerId) => {
        const message = isAdmin ? 'Remove this player from the team?' : 'Request removal of this player from the team?';

        confirm(message, async () => {
            try {
                await api.delete(`/teams/${teamId}/players/${playerId}`);
                fetchTeams();
            } catch (error) {
                console.error('Error removing player:', error);
                alert(error.response?.data?.error || 'Failed to remove player', 'Error', 'danger');
            }
        }, isAdmin ? 'Remove Player' : 'Request Removal', isAdmin ? 'danger' : 'warning');
    };

    const handleApproval = async (teamId, playerId, action) => {
        try {
            await api.post(`/teams/${teamId}/players/${playerId}/approval`, { action });
            fetchTeams();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert(error.response?.data?.error || 'Failed to process approval', 'Error', 'danger');
        }
    };

    const handleDelete = async (id) => {
        confirm('Are you sure you want to delete this team?', async () => {
            try {
                await api.delete(`/teams/${id}`);
                fetchTeams();
            } catch (error) {
                console.error('Error deleting team:', error);
                alert(error.response?.data?.error || 'Failed to delete team', 'Error', 'danger');
            }
        }, 'Delete Team', 'danger');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>Teams</h1>
                    <p>Manage team rosters and details.</p>
                </div>
                {isAdmin && (
                    <button onClick={openAddModal} className="btn-primary">
                        Add Team
                    </button>
                )}
            </div>

            <Modal
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
                title={editingId ? 'Edit Team' : 'Add New Team'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Enter team name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Logo</label>
                        <div className="image-upload-container">
                            {logoPreview ? (
                                <div className="image-preview">
                                    <img src={getImageUrl(logoPreview)} alt="Logo preview" />
                                    <button type="button" className="btn-remove-image" onClick={() => { setLogoFile(null); setLogoPreview(null); setFormData({ ...formData, logo: '' }); }}>✕</button>
                                </div>
                            ) : (
                                <label className="image-upload-placeholder">
                                    <input type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                                    <span className="icon">📁</span>
                                    <span>Upload Logo</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            {editingId ? 'Update Team' : 'Create Team'}
                        </button>
                        <button type="button" onClick={() => setShowTeamModal(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showManageModal}
                onClose={() => setShowManageModal(false)}
                title={`Manage Players - ${selectedTeam?.name}`}
            >
                <div className="form-group">
                    <label>Add Player to Team</label>
                    <div className="searchable-select">
                        <div className="select-trigger" onClick={() => setShowPlayerDropdown(!showPlayerDropdown)}>
                            <input
                                type="text"
                                placeholder="Search and select player..."
                                value={playerSearch}
                                onChange={(e) => {
                                    setPlayerSearch(e.target.value);
                                    setShowPlayerDropdown(true);
                                }}
                                onFocus={() => setShowPlayerDropdown(true)}
                            />
                            <span className="arrow">{showPlayerDropdown ? '▴' : '▾'}</span>
                        </div>

                        {showPlayerDropdown && (
                            <div className="select-dropdown glass">
                                {filteredPlayers.length > 0 ? (
                                    filteredPlayers.map(player => (
                                        <div
                                            key={player.id}
                                            className="select-item"
                                            onClick={() => handleAddPlayer(player.id)}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {player.photo ? (
                                                    <img src={getImageUrl(player.photo)} alt="" className="avatar-xs" />
                                                ) : (
                                                    <div className="avatar-xs-placeholder">{player.name.charAt(0)}</div>
                                                )}
                                                <span>{player.name}</span>
                                            </div>
                                            <span className="add-icon">+</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="select-empty">No players found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        {showQuickAdd ? (
                            <div className="quick-add-box glass">
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', display: 'block' }}>QUICK CREATE NEW PLAYER</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Player name..."
                                        value={newPlayerName}
                                        onChange={(e) => setNewPlayerName(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleQuickAddPlayer()}
                                        style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <button
                                        onClick={handleQuickAddPlayer}
                                        className="btn-primary"
                                        disabled={isCreatingPlayer}
                                        style={{ padding: '0.5rem 1rem' }}
                                    >
                                        {isCreatingPlayer ? '...' : 'Add'}
                                    </button>
                                    <button
                                        onClick={() => setShowQuickAdd(false)}
                                        className="btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                className="btn-quick-add-trigger"
                                onClick={() => setShowQuickAdd(true)}
                            >
                                + Create New Player
                            </button>
                        )}
                    </div>
                </div>

                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-light)', marginBottom: '1rem', marginTop: '2rem' }}>
                    Current Roster ({selectedTeam?.players?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedTeam?.players?.map((player) => (
                        <div key={player.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: player.TeamPlayer?.removalRequested ? '1px solid #fecaca' : '1px solid transparent' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{player.name}</span>
                                {player.TeamPlayer?.removalRequested && (
                                    <span className="badge-pending">Pending Removal</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isAdmin && player.TeamPlayer?.removalRequested ? (
                                    <>
                                        <button onClick={() => handleApproval(selectedTeam.id, player.id, 'approve')} className="btn-small btn-danger">Approve</button>
                                        <button onClick={() => handleApproval(selectedTeam.id, player.id, 'reject')} className="btn-small btn-secondary">Reject</button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleRemovePlayer(selectedTeam.id, player.id)}
                                        className={`btn-small ${player.TeamPlayer?.removalRequested ? 'btn-secondary' : 'btn-danger'}`}
                                        disabled={player.TeamPlayer?.removalRequested && !isAdmin}
                                    >
                                        {isAdmin ? 'Remove' : (player.TeamPlayer?.removalRequested ? 'Requested' : 'Request Removal')}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!selectedTeam?.players || selectedTeam.players.length === 0) && (
                        <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontSize: '0.875rem' }}>No players assigned yet.</p>
                    )}
                </div>

                <button onClick={() => setShowManageModal(false)} className="btn-secondary" style={{ width: '100%', marginTop: '2rem' }}>Done</button>
            </Modal>

            <div className="teams-grid slide-up">
                {teams.map((team) => (
                    <div key={team.id} className="team-card">
                        <div className="team-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {team.logo ? (
                                    <img src={getImageUrl(team.logo)} alt={team.name} className="team-logo" />
                                ) : (
                                    <div className="team-logo" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: '#64748b' }}>
                                        {team.name.charAt(0)}
                                    </div>
                                )}
                                <h3>{team.name}</h3>
                            </div>
                            {isAdmin && (
                                <div className="dropdown">
                                    <button className="btn-icon">⋮</button>
                                    <div className="dropdown-content">
                                        <button onClick={() => handleEdit(team)}>Edit Details</button>
                                        <button onClick={() => handleDelete(team.id)} className="text-danger">Delete Team</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="team-players">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>Roster ({team.players?.length || 0})</h4>
                                {team.players?.some(p => p.TeamPlayer?.removalRequested) && (
                                    <span className="dot-alert" title="Pending removal requests"></span>
                                )}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '40px' }}>
                                {team.players?.slice(0, 5).map((player) => (
                                    <span key={player.id} className={`player-tag ${player.TeamPlayer?.removalRequested ? 'pending' : ''}`}>
                                        {player.name}
                                    </span>
                                ))}
                                {team.players?.length > 5 && (
                                    <span style={{ fontSize: '0.8125rem', padding: '0.25rem 0.75rem', color: 'var(--text-light)' }}>
                                        +{team.players.length - 5} more
                                    </span>
                                )}
                                {(!team.players || team.players.length === 0) && (
                                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-light)', fontStyle: 'italic' }}>Empty roster</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button onClick={() => handleManagePlayers(team)} className="btn-primary" style={{ width: '100%' }}>
                                {isAdmin ? 'Manage Roster' : 'Update Players'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {teams.length === 0 && <p className="empty-state">No teams yet. Create one to get started!</p>}

            <style>{`
                .badge-pending {
                    font-size: 0.625rem;
                    padding: 0.125rem 0.5rem;
                    background: #fef2f2;
                    color: #ef4444;
                    border-radius: 100px;
                    font-weight: 700;
                    margin-left: 0.5rem;
                    text-transform: uppercase;
                }
                .player-tag {
                    font-size: 0.8125rem;
                    padding: 0.25rem 0.75rem;
                    background: #f1f5f9;
                    border-radius: 100px;
                    font-weight: 500;
                }
                .player-tag.pending {
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px dashed #fecaca;
                }
                .dot-alert {
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    display: inline-block;
                }
                .btn-icon {
                    background: none;
                    border: none;
                    font-size: 1.25rem;
                    color: var(--text-light);
                    cursor: pointer;
                    padding: 0.25rem 0.5rem;
                    border-radius: 8px;
                }
                .dropdown { position: relative; display: inline-block; }
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
                .dropdown:hover .dropdown-content { display: block; }
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
                }
                .dropdown-content button:hover { background: #f8fafc; }
                .dropdown-content button.text-danger { color: #ef4444; }

                .searchable-select { position: relative; }
                .select-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 0.25rem 1rem;
                    cursor: pointer;
                }
                .select-trigger input {
                    border: none;
                    outline: none;
                    width: 100%;
                    padding: 0.5rem 0;
                    font-size: 0.875rem;
                }
                .select-trigger .arrow { color: var(--text-light); font-size: 0.75rem; }
                
                .select-dropdown {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    right: 0;
                    background: white;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    max-height: 250px;
                    overflow-y: auto;
                    z-index: 100;
                    box-shadow: var(--shadow-xl);
                }
                .select-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-bottom: 1px solid #f8fafc;
                }
                .select-item:hover { background: #f1f5f9; }
                .select-item:last-child { border-bottom: none; }
                .select-item span { font-size: 0.875rem; font-weight: 500; }
                .add-icon { color: var(--primary); font-weight: 700; font-size: 1.125rem; }
                
                .avatar-xs { width: 24px; height: 24px; border-radius: 6px; object-fit: cover; }
                .avatar-xs-placeholder {
                    width: 24px; height: 24px; border-radius: 6px;
                    background: var(--primary-light); color: var(--primary);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.625rem; font-weight: 700;
                }
                .select-empty { padding: 1.5rem; text-align: center; color: var(--text-light); font-size: 0.875rem; font-style: italic; }

                .btn-quick-add-trigger {
                    width: 100%;
                    padding: 0.75rem;
                    background: transparent;
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    color: var(--text-light);
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-quick-add-trigger:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: var(--primary-light);
                }

                .quick-add-box {
                    padding: 1rem;
                    border-radius: 12px;
                    background: #f8fafc;
                    border: 1px solid var(--primary-light);
                }
            `}</style>
        </div >
    );
}

