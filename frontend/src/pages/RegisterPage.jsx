import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard");
    } catch (error) {
      setErr(error.message || "Registration failed.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <div className="card">
        <h2>Registracija</h2>
        <p className="muted">Kreiraj korisnički račun za praćenje troškova.</p>

        {err && <p style={{ color: "crimson" }}>{err}</p>}

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <label>
            Korisničko ime
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label>
            Lozinka
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={4}
              required
            />
          </label>

          <button className="btn-primary" type="submit">
            Stvori račun
          </button>
        </form>

        <p style={{ marginTop: 12 }}>
          Već imaš račun? <Link to="/login">Prijava</Link>
        </p>
      </div>
    </div>
  );
}
