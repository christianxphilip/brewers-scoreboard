import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Players from './Players';
import Teams from './Teams';
import Scoreboards from './Scoreboards';
import Scorers from './Scorers';
import EditMatch from './EditMatch';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                    <p>{user?.name || user?.email}</p>
                </div>

                <ul className="nav-menu">
                    <li><Link to="/admin/players">Players</Link></li>
                    <li><Link to="/admin/teams">Teams</Link></li>
                    <li><Link to="/admin/scoreboards">Scoreboards</Link></li>
                    <li><Link to="/admin/scorers">Scorers</Link></li>
                </ul>

                <button onClick={handleLogout} className="btn-secondary">Logout</button>
            </nav>

            <main className="main-content">
                <Routes>
                    <Route index element={<AdminHome />} />
                    <Route path="players" element={<Players />} />
                    <Route path="teams" element={<Teams />} />
                    <Route path="scoreboards" element={<Scoreboards />} />
                    <Route path="scorers" element={<Scorers />} />
                    <Route path="matches/:id/edit" element={<EditMatch />} />
                </Routes>
            </main>
        </div>
    );
}

function AdminHome() {
    return (
        <div className="home">
            <h1>Welcome to Admin Dashboard</h1>
            <p>Select an option from the sidebar to get started.</p>

            <div className="quick-links">
                <Link to="/admin/players" className="card">
                    <h3>Manage Players</h3>
                    <p>Create and manage player profiles</p>
                </Link>

                <Link to="/admin/teams" className="card">
                    <h3>Manage Teams</h3>
                    <p>Create teams and assign players</p>
                </Link>

                <Link to="/admin/scoreboards" className="card">
                    <h3>Manage Scoreboards</h3>
                    <p>Create scoreboards and assign teams</p>
                </Link>

                <Link to="/admin/scorers" className="card">
                    <h3>Manage Scorers</h3>
                    <p>Update scorer details and passwords</p>
                </Link>
            </div>
        </div>
    );
}
