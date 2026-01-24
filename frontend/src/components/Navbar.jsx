import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
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
          <span className="brand-dot" />
          FinTrack
        </div>

        <div className="nav-links">
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
            to="/import"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Uvoz CSV
          </NavLink>
        </div>

        <div className="nav-right">
          <span className="badge">{user.username}</span>
          <button className="btn-danger" onClick={onLogout}>
            Odjava
          </button>
        </div>
      </div>
    </div>
  );
}
