import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import MatchEntry from './MatchEntry';
import MyMatches from './MyMatches';
import Teams from '../admin/Teams';

export default function ScorerDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scoreboards, setScoreboards] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        fetchScoreboards();
    }, []);

    const fetchScoreboards = async () => {
        try {
            const response = await api.get('/scoreboards');
            setScoreboards(response.data);
        } catch (error) {
            console.error('Error fetching scoreboards:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);

    const isMatchEntry = location.pathname.includes('/match/');
    const isMyMatches = location.pathname.includes('/my-matches');

    return (
        <div className="dashboard">
            {/* Mobile Header */}
            <header className="mobile-header glass">
                <button className="menu-toggle" onClick={toggleSidebar}>
                    {isSidebarOpen ? '✕' : '☰'}
                </button>
                <div className="mobile-logo">Scorer Panel</div>
                <div style={{ width: '40px' }}></div> {/* Spacer */}
            </header>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

            <nav className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-icon">📋</div>
                    <div>
                        <h2>Scorer Panel</h2>
                        <p className="user-email">{user?.name || user?.email}</p>
                    </div>
                </div>

                <ul className="nav-menu">
                    <li className={location.pathname === '/scorer' ? 'active' : ''}>
                        <Link to="/scorer" onClick={closeSidebar}>
                            <span className="icon">🏆</span>
                            My Scoreboards
                        </Link>
                    </li>
                    <li className={isMyMatches ? 'active' : ''}>
                        <Link to="/scorer/my-matches" onClick={closeSidebar}>
                            <span className="icon">🕒</span>
                            My Matches
                        </Link>
                    </li>
                    <li className={location.pathname === '/scorer/teams' ? 'active' : ''}>
                        <Link to="/scorer/teams" onClick={closeSidebar}>
                            <span className="icon">👥</span>
                            Manage Teams
                        </Link>
                    </li>
                </ul>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="btn-secondary logout-btn">
                        <span className="icon">🚪</span> Logout
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <Routes>
                    <Route index element={<ScorerHome scoreboards={scoreboards} />} />
                    <Route path="match/:scoreboardId" element={<MatchEntry />} />
                    <Route path="my-matches" element={<MyMatches />} />
                    <Route path="teams" element={<Teams />} />
                </Routes>
            </main>

            <style>{`
                .dashboard {
                    display: flex;
                    min-height: 100vh;
                    background: #f0f2f5;
                }
                
                /* Mobile Header */
                .mobile-header {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 64px;
                    padding: 0 1.5rem;
                    align-items: center;
                    justify-content: space-between;
                    z-index: 100;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid var(--border);
                }
                .menu-toggle {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    color: var(--primary);
                    cursor: pointer;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    transition: background 0.2s;
                }
                .menu-toggle:hover {
                    background: var(--primary-light);
                }
                .mobile-logo {
                    font-weight: 800;
                    font-size: 1.125rem;
                    background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .sidebar {
                    width: 280px;
                    background: white;
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    padding: 2rem 1.5rem;
                    position: fixed;
                    height: 100vh;
                    z-index: 90;
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .sidebar.glass {
                    background: rgba(255, 255, 255, 0.8);
                    backdrop-filter: blur(12px);
                }
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 3rem;
                }
                .logo-icon {
                    font-size: 1.5rem;
                    background: var(--primary-light);
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                }
                .sidebar-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 800;
                    background: linear-gradient(135deg, var(--primary) 0%, #4338ca 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .user-email {
                    font-size: 0.75rem;
                    color: var(--text-light);
                    margin: 0;
                }
                .nav-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    flex: 1;
                }
                .nav-menu li {
                    margin-bottom: 0.5rem;
                }
                .nav-menu a {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    text-decoration: none;
                    color: var(--text-light);
                    font-weight: 600;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }
                .nav-menu li.active a, .nav-menu a:hover {
                    background: var(--primary-light);
                    color: var(--primary);
                }
                .sidebar-footer {
                    margin-top: auto;
                    padding-top: 2rem;
                    border-top: 1px solid var(--border);
                }
                .logout-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .main-content {
                    flex: 1;
                    margin-left: 280px;
                    padding: 2rem 3rem;
                    transition: all 0.3s ease;
                }

                @media (max-width: 1024px) {
                    .mobile-header {
                        display: flex;
                    }
                    .sidebar {
                        transform: translateX(-100%);
                        padding-top: 5rem;
                    }
                    .sidebar.open {
                        transform: translateX(0);
                        box-shadow: var(--shadow-2xl);
                    }
                    .sidebar-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.3);
                        backdrop-filter: blur(4px);
                        z-index: 85;
                    }
                    .main-content {
                        margin-left: 0;
                        padding: 6rem 1.5rem 2rem;
                    }
                }
            `}</style>
        </div>
    );
}

function ScorerHome({ scoreboards }) {
    return (
        <div className="home fade-in">
            <div className="page-header">
                <div>
                    <h1>My Scoreboards</h1>
                    <p style={{ color: 'var(--text-light)' }}>Select a tournament or league to record match results</p>
                </div>
            </div>

            <div className="scoreboards-grid slide-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {scoreboards.map((scoreboard) => (
                    <Link key={scoreboard.id} to={`/scorer/match/${scoreboard.id}`} className="card glass-hover" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{scoreboard.name}</h3>
                            <span className="badge">Active</span>
                        </div>
                        <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1, minHeight: '2.5rem' }}>
                            {scoreboard.description || 'No description provided.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.125rem' }}>👥</span>
                                <span style={{ fontWeight: 700, fontSize: '0.8125rem' }}>{scoreboard.teams?.length || 0} Teams</span>
                            </div>
                            <div className="btn-small btn-primary" style={{ fontSize: '0.75rem' }}>Record Match →</div>
                        </div>
                    </Link>
                ))}
            </div>

            {scoreboards.length === 0 && (
                <div className="empty-state card glass" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📭</div>
                    <h2>No Scoreboards Assigned</h2>
                    <p style={{ color: 'var(--text-light)', maxWidth: '400px', margin: '0 auto' }}>
                        You haven't been assigned to any scoreboards yet. Please contact an administrator to get access.
                    </p>
                </div>
            )}


            <style>{`
                .glass-hover {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .glass-hover:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.9);
                    box-shadow: var(--shadow-xl);
                    border-color: var(--primary-light);
                }
                .badge {
                    font-size: 0.625rem;
                    padding: 0.25rem 0.625rem;
                    background: var(--primary-light);
                    color: var(--primary);
                    border-radius: 100px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }
            `}</style>
        </div>
    );
}
