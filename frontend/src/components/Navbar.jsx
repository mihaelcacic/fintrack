import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-inner">
        <div className="brand">
          <img src="/logo.png" alt="FinTrack logo" className="brand-logo" />
          FinTrack
        </div>

        <div className="nav-links">
          {user && user.role === "ROLE_ADMIN" ? (
            // Admin users see only Admin page
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              Admin
            </NavLink>
          ) : (
            // Regular users see all other pages
            <>
              <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Nadzorna ploča
              </NavLink>

              <NavLink
                to="/transactions"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Transakcije
              </NavLink>

              <NavLink
                to="/savings"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Štednja
              </NavLink>

              <NavLink
                to="/analysis"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Analiza
              </NavLink>

              <NavLink
                to="/import"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Uvoz CSV
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-right">
          <span className="badge">{user.username}</span>
          <button
            className="btn-theme"
            onClick={toggleTheme}
            title="Promijeni temu"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button className="btn-danger" onClick={onLogout}>
            Odjava
          </button>
        </div>
      </div>
    </div>
  );
}
