import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";


export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 720, margin: "24px auto" }}>
        <h2>Dashboard</h2>
        <p>
            Ulogiran kao: <b>{user.name}</b> ({user.email}) — uloga: <b>{user.role}</b>
        </p>
        <p style={{ marginTop: 12 }}>
            <Link to="/transactions">Idi na transakcije</Link>
        </p>


      <button onClick={logout}>Logout</button>
    </div>
  );
}
