import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (error) {
      setErr(error.message || "Login failed.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>Prijava</h2>
        <p className="muted">Unesi podatke za prijavu u sustav.</p>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <label>
            Email
            <input
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label>
            Lozinka
            <input
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          <button className="btn-primary" type="submit">
            Prijavi se
          </button>
        </form>

        <p style={{ marginTop: 12 }}>
          Novi korisnik? <Link to="/register">Registracija</Link>
        </p>

        <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>
          Demo admin: <b>admin@fintrack.hr</b> / <b>admin123</b>
        </p>
      </div>
    </div>
  );
}
