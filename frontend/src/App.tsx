import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { logout } from './store/authSlice';
import { Video, LayoutDashboard, ShieldAlert, LogOut, PlaySquare } from 'lucide-react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import GeneratePage from './pages/GeneratePage';
import AdminPage from './pages/AdminPage';

function App() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Router>
      <div className="min-h-screen bg-govNavy text-white flex flex-col font-sans">
        {/* Saffron White Green Tricolor accent header bar */}
        <div className="h-1.5 w-full flex">
          <div className="h-full flex-1 bg-saffron"></div>
          <div className="h-full flex-1 bg-white"></div>
          <div className="h-full flex-1 bg-tricolorGreen"></div>
        </div>

        {isAuthenticated && (
          <header className="glass-nav sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
            <div className="flex className items-center gap-3">
              <PlaySquare className="text-saffron w-8 h-8" />
              <div>
                <h1 className="text-lg font-bold tracking-wide">PIB Text-To-Video</h1>
                <p className="text-xs text-purple-400 font-semibold tracking-widest uppercase">Government of India Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.username}</p>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-200">
                  {user?.role}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden">
          {isAuthenticated && (
            <aside className="w-64 glass border-r border-white/5 flex flex-col gap-1 p-4 shrink-0">
              <Link 
                to="/dashboard" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-5 h-5 text-purple-400" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/generate" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
              >
                <Video className="w-5 h-5 text-purple-400" />
                <span>Video Studio</span>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                >
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </aside>
          )}

          <main className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
              <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
              <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
              <Route path="/dashboard" element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} />
              <Route path="/generate" element={isAuthenticated ? <GeneratePage /> : <Navigate to="/login" />} />
              <Route path="/admin" element={isAuthenticated && user?.role === 'ADMIN' ? <AdminPage /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
