import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';
import { useNotification } from '../../contexts/NotificationContext';
import { getImageUrl } from '../../utils/imageUtils';

export default function Players() {
    const { alert, confirm } = useNotification();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', photo: '' });
    const [editingId, setEditingId] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        try {
            const response = await api.get('/players');
            setPlayers(response.data);
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setFormData({ name: '', photo: '' });
        setPhotoFile(null);
        setPhotoPreview(null);
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (player) => {
        setFormData({ name: player.name, photo: player.photo || '' });
        setPhotoFile(null);
        setPhotoPreview(player.photo || null);
        setEditingId(player.id);
        setShowModal(true);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (photoFile) {
                data.append('photo', photoFile);
            } else if (formData.photo) {
                data.append('photo', formData.photo);
            }

            if (editingId) {
                await api.put(`/players/${editingId}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/players', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            setShowModal(false);
            fetchPlayers();
        } catch (error) {
            console.error('Error saving player:', error);
            alert(error.response?.data?.error || 'Failed to save player', 'Error', 'danger');
        }
    };

    const handleDelete = async (id) => {
        confirm('Are you sure you want to delete this player?', async () => {
            try {
                await api.delete(`/players/${id}`);
                fetchPlayers();
            } catch (error) {
                console.error('Error deleting player:', error);
                alert(error.response?.data?.error || 'Failed to delete player', 'Error', 'danger');
            }
        }, 'Delete Player', 'danger');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <h1>Players</h1>
                <button onClick={openAddModal} className="btn-primary">
                    Add Player
                </button>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'Edit Player' : 'Add New Player'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Enter player name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Photo</label>
                        <div className="image-upload-container">
                            {photoPreview ? (
                                <div className="image-preview">
                                    <img src={getImageUrl(photoPreview)} alt="Photo preview" />
                                    <button type="button" className="btn-remove-image" onClick={() => { setPhotoFile(null); setPhotoPreview(null); setFormData({ ...formData, photo: '' }); }}>✕</button>
                                </div>
                            ) : (
                                <label className="image-upload-placeholder">
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                                    <span className="icon">📁</span>
                                    <span>Upload Photo</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            {editingId ? 'Update Player' : 'Create Player'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="table-container slide-up">
                <table>
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {players.map((player) => (
                            <tr key={player.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {player.photo ? (
                                            <img src={getImageUrl(player.photo)} alt={player.name} className="player-photo" />
                                        ) : (
                                            <div className="player-photo" style={{ background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: '#64748b' }}>
                                                {player.name.charAt(0)}
                                            </div>
                                        )}
                                        <span style={{ fontWeight: 600 }}>{player.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <button onClick={() => handleEdit(player)} className="btn-small btn-secondary">Edit</button>
                                    <button onClick={() => handleDelete(player.id)} className="btn-small btn-danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {players.length === 0 && <p className="empty-state">No players yet. Create one to get started!</p>}
            </div>
            <style>{`
                .image-upload-container {
                    margin-top: 0.5rem;
                }
                .image-upload-placeholder {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 2rem;
                    background: #f8fafc;
                    border: 2px dashed var(--border);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .image-upload-placeholder:hover {
                    background: #f1f5f9;
                    border-color: var(--primary);
                }
                .image-upload-placeholder .icon { font-size: 1.5rem; }
                .image-upload-placeholder span { font-size: 0.875rem; color: var(--text-light); font-weight: 500; }
                
                .image-preview {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid var(--border);
                }
                .image-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .btn-remove-image {
                    position: absolute;
                    top: 0.25rem;
                    right: 0.25rem;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    cursor: pointer;
                    backdrop-filter: blur(4px);
                }
                .btn-remove-image:hover { background: rgba(0, 0, 0, 0.7); }
            `}</style>
        </div>
    );
}

