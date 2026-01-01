import { useState, useEffect } from 'react';
import api from '../../utils/api';
import Modal from '../../components/Modal';

export default function Scorers() {
    const [scorers, setScorers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingScorer, setEditingScorer] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchScorers();
    }, []);

    const fetchScorers = async () => {
        try {
            const response = await api.get('/auth/users');
            setScorers(response.data);
        } catch (error) {
            console.error('Error fetching scorers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (scorer) => {
        setEditingScorer(scorer);
        setFormData({ name: scorer.name || '', email: scorer.email, password: '' });
        setShowModal(true);
    };

    const handleCreate = () => {
        setEditingScorer(null);
        setFormData({ name: '', email: '', password: '' });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingScorer) {
                await api.put(`/auth/users/${editingScorer.id}`, formData);
                setMessage({ type: 'success', text: 'Scorer updated successfully!' });
            } else {
                // Assuming there's a POST /auth/register or similar for creating scorers
                // If not, we might need to add one or use the existing registration logic
                await api.post('/auth/register', { ...formData, role: 'scorer' });
                setMessage({ type: 'success', text: 'Scorer created successfully!' });
            }
            setShowModal(false);
            fetchScorers();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save scorer' });
        }
    };

    if (loading) return <div className="loading">Loading Scorers...</div>;

    return (
        <div className="page fade-in">
            <div className="page-header">
                <div>
                    <h1>Scorer Management</h1>
                    <p>Manage scorer accounts and update credentials.</p>
                </div>
                <button onClick={handleCreate} className="btn-primary">
                    Create Scorer
                </button>
            </div>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} slide-up`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="close-btn">&times;</button>
                </div>
            )}

            <div className="table-container slide-up">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scorers.map(scorer => (
                            <tr key={scorer.id}>
                                <td style={{ fontWeight: 600 }}>{scorer.name || 'N/A'}</td>
                                <td style={{ color: 'var(--text-light)' }}>{scorer.email}</td>
                                <td>
                                    <span className={`badge badge-${scorer.role}`}>
                                        {scorer.role.charAt(0).toUpperCase() + scorer.role.slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleEdit(scorer)} className="btn-small btn-secondary">
                                        Edit Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {scorers.length === 0 && <p className="empty-state">No scorers found.</p>}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingScorer ? `Edit Scorer: ${editingScorer.name || editingScorer.email}` : 'Create New Scorer'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>{editingScorer ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!editingScorer}
                            placeholder="••••••••"
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                            {editingScorer ? 'Save Changes' : 'Create Scorer'}
                        </button>
                        <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </form>
            </Modal>

            <style>{`
                .badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
                .badge-scorer { background: #e0e7ff; color: #4338ca; }
                .badge-admin { background: #fef3c7; color: #92400e; }
                
                .alert {
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: 600;
                    font-size: 0.9375rem;
                }
                .alert-success { background: #f0fdf4; color: #166534; border: 1px solid #bcf0da; }
                .alert-danger { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
                .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; opacity: 0.5; line-height: 1; }
                .close-btn:hover { opacity: 1; }
            `}</style>
        </div>
    );
}
