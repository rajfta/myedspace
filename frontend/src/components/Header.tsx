import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { buttonClasses } from './Button';

export function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="border-b-2 border-brand-950/10 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-black tracking-tight">
          <span className="text-brand-950">My</span>
          <span className="text-brand-600">EdSpace</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-bold">
          {isAuthenticated ? (
            <>
              <Link to="/lms" className="text-brand-700 transition-colors hover:text-brand-950">
                My Courses
              </Link>
              <button type="button" onClick={handleLogout} className={buttonClasses('outline')}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className={buttonClasses('outline')}>
              Student log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
