import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { admin } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import * as api from "../services/api";

const AdminPage = () => {
  const { user, setUser } = useAuth();
  const { theme } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [newAdminForm, setNewAdminForm] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    email: "",
    username: "",
    password: "",
    isAdmin: false,
  });

  // Check if user is admin
  if (!user || user.role !== "ROLE_ADMIN") {
    return (
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          className="card"
          style={{
            textAlign: "center",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <h2 style={{ marginBottom: "16px" }}>Pristup odbačen</h2>
          <p className="muted">
            Admin privilegije su potrebne za pristup ovoj stranici.
          </p>
        </div>
      </div>
    );
  }

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await admin.getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm("Jeste li sigurni da želite obrisati ovog korisnika?")
    ) {
      return;
    }

    try {
      setProcessingUser(userId);
      await admin.deleteUser(userId);
      setSuccess("Korisnik je uspješno obrisan.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setProcessingUser("create-user");
      await admin.createUser(
        newUserForm.email,
        newUserForm.username,
        newUserForm.password,
      );
      setNewUserForm({ email: "", username: "", password: "" });
      setShowCreateUser(false);
      setSuccess("Korisnik je uspješno kreiran.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setProcessingUser("create-admin");
      await admin.createAdmin(
        newAdminForm.email,
        newAdminForm.username,
        newAdminForm.password,
      );
      setNewAdminForm({ email: "", username: "", password: "" });
      setShowCreateAdmin(false);
      setSuccess("Admin je uspješno kreiran.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      setProcessingUser(editingUser.id);
      await admin.updateUser(
        editingUser.id,
        editForm.email,
        editForm.username,
        editForm.password || null,
        editForm.isAdmin,
      );

      // Ako admin mijenja svoj vlastiti account, ažuriraj user podatke u AuthContext
      if (editingUser.id === user.id) {
        try {
          const updatedUserData = await api.auth.me();
          setUser(updatedUserData?.user);
        } catch (err) {
          console.error("Greška pri ažuriranju korisničkih podataka:", err);
        }
      }

      setEditingUser(null);
      setEditForm({ email: "", username: "", password: "", isAdmin: false });
      setSuccess("Korisnik je uspješno ažuriran.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingUser(null);
    }
  };

  const startEdit = (userData) => {
    setEditingUser(userData);
    setEditForm({
      email: userData.email,
      username: userData.username,
      password: "",
      isAdmin: userData.role === "ROLE_ADMIN",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("hr-HR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          className="card"
          style={{
            textAlign: "center",
            maxWidth: "300px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "4px solid var(--border)",
              borderTop: "4px solid var(--accent)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p className="muted">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <img
        src="/amongus.png"
        alt="Among Us"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          width: 48,
          height: 48,
          opacity: 0.2,
          pointerEvents: "none",
          userSelect: "none",
          borderRadius: 8,
        }}
      />
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: 8,
            fontSize: "22px",
            letterSpacing: "-0.02em",
          }}
        >
          Admin Panel
        </h2>
        <p className="muted" style={{ fontSize: "1rem" }}>
          Upravljanje korisnicima sistema
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div
          className="card"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            borderColor: "var(--danger)",
            color: "var(--danger)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontWeight: 600 }}>Greška</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div
          className="card"
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            borderColor: "var(--accent-2)",
            color: "var(--accent-2)",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontWeight: 600 }}>Uspjeh</h4>
            <p style={{ margin: 0 }}>{success}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="row" style={{ marginBottom: "32px" }}>
        <button
          onClick={() => {
            setShowCreateUser(!showCreateUser);
            setShowCreateAdmin(false);
            setEditingUser(null);
          }}
          style={{
            background: showCreateUser ? "var(--danger)" : "var(--accent)",
            color: "white",
            border: "1px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {showCreateUser ? "Odustani" : "Dodaj korisnika"}
        </button>
        <button
          onClick={() => {
            setShowCreateAdmin(!showCreateAdmin);
            setShowCreateUser(false);
            setEditingUser(null);
          }}
          style={{
            background: showCreateAdmin ? "var(--danger)" : "var(--accent)",
            color: "white",
            border: "1px solid transparent",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {showCreateAdmin ? "Odustani" : "Dodaj admina"}
        </button>
        <button
          onClick={loadUsers}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Osvježi
        </button>
      </div>

      {/* Grid Layout for Forms and Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
      >
        {/* Create User Form */}
        {showCreateUser && (
          <div className="card">
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                fontSize: "18px",
              }}
            >
              <span>👤</span>
              Dodaj novog korisnika
            </h3>
            <form
              onSubmit={handleCreateUser}
              className="row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  placeholder="korisnik@email.com"
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Korisničko ime
                <input
                  type="text"
                  placeholder="korisnik123"
                  value={newUserForm.username}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, username: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Lozinka
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, password: e.target.value })
                  }
                  required
                />
              </label>
              <div style={{ gridColumn: "1", display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={processingUser === "create-user"}
                  style={{
                    background:
                      processingUser === "create-user"
                        ? "var(--border)"
                        : "var(--accent)",
                    color: "white",
                    border: "1px solid transparent",
                    opacity: processingUser === "create-user" ? 0.5 : 1,
                    cursor:
                      processingUser === "create-user"
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {processingUser === "create-user" ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                      Stvaranje...
                    </>
                  ) : (
                    <>
                      Stvori korisnika
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Admin Form */}
        {showCreateAdmin && (
          <div className="card">
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                fontSize: "18px",
              }}
            >
              Dodaj novog admina
            </h3>
            <form
              onSubmit={handleCreateAdmin}
              className="row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  placeholder="admin@email.com"
                  value={newAdminForm.email}
                  onChange={(e) =>
                    setNewAdminForm({ ...newAdminForm, email: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Korisničko ime
                <input
                  type="text"
                  placeholder="admin123"
                  value={newAdminForm.username}
                  onChange={(e) =>
                    setNewAdminForm({
                      ...newAdminForm,
                      username: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <label>
                Lozinka
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newAdminForm.password}
                  onChange={(e) =>
                    setNewAdminForm({
                      ...newAdminForm,
                      password: e.target.value,
                    })
                  }
                  required
                />
              </label>
              <div style={{ gridColumn: "1", display: "flex", gap: "12px" }}>
                <button
                  type="submit"
                  disabled={processingUser === "create-admin"}
                  style={{
                    background:
                      processingUser === "create-admin"
                        ? "var(--border)"
                        : "var(--accent)",
                    color: "white",
                    border: "1px solid transparent",
                    opacity: processingUser === "create-admin" ? 0.5 : 1,
                    cursor:
                      processingUser === "create-admin"
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {processingUser === "create-admin" ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                      Stvaranje...
                    </>
                  ) : (
                    <>
                      Stvori admina
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit User Form */}
        {editingUser && (
          <div
            className="card"
            style={{ borderLeft: "4px solid var(--accent)" }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                fontSize: "18px",
              }}
            >
              Uredi korisnika: {editingUser.username}
            </h3>
            <form onSubmit={handleUpdateUser}>
              <div
                className="row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  alignItems: "start",
                  marginBottom: "20px",
                }}
              >
                <label>
                  Email
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Korisničko ime
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    required
                  />
                </label>
                <label>
                  Nova lozinka{" "}
                  <small className="muted">
                    (ostavite prazno za zadržavanje)
                  </small>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={editForm.password}
                    onChange={(e) =>
                      setEditForm({ ...editForm, password: e.target.value })
                    }
                  />
                </label>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ marginBottom: "12px" }}>
                  Status administratora
                </label>
                <div className="row">
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="isAdmin"
                      checked={!editForm.isAdmin}
                      onChange={() =>
                        setEditForm({ ...editForm, isAdmin: false })
                      }
                      style={{ display: "none" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: `2px solid ${!editForm.isAdmin ? "var(--accent-2)" : "var(--border)"}`,
                        background: !editForm.isAdmin
                          ? "rgba(34, 197, 94, 0.1)"
                          : "transparent",
                        color: !editForm.isAdmin
                          ? "var(--accent-2)"
                          : "var(--text)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>👤</span>
                      <span>Korisnik</span>
                    </div>
                  </label>
                  <label style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="isAdmin"
                      checked={editForm.isAdmin}
                      onChange={() =>
                        setEditForm({ ...editForm, isAdmin: true })
                      }
                      style={{ display: "none" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "10px",
                        border: `2px solid ${editForm.isAdmin ? "var(--accent)" : "var(--border)"}`,
                        background: editForm.isAdmin
                          ? "rgba(124, 58, 237, 0.1)"
                          : "transparent",
                        color: editForm.isAdmin
                          ? "var(--accent)"
                          : "var(--text)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>Admin</span>
                    </div>
                  </label>
                </div>
              </div>
              <div className="row">
                <button
                  type="submit"
                  disabled={processingUser === editingUser.id}
                  style={{
                    background:
                      processingUser === editingUser.id
                        ? "var(--border)"
                        : "var(--accent)",
                    color: "white",
                    border: "1px solid transparent",
                    opacity: processingUser === editingUser.id ? 0.5 : 1,
                    cursor:
                      processingUser === editingUser.id
                        ? "not-allowed"
                        : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {processingUser === editingUser.id ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid transparent",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                      Spremanje...
                    </>
                  ) : (
                    <>
                      Spremi promjene
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{
                    background: "var(--danger)",
                    color: "white",
                    border: "1px solid transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Odustani
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="card" style={{ padding: "0" }}>
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                margin: 0,
                fontSize: "18px",
              }}
            >
              <span>👥</span>
              Korisnici ({users.length})
            </h3>
          </div>

          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--panel-2)" }}>
                <tr>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    ID
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Korisničko ime
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Prihodi
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Rashodi
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Saldo
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => (
                  <tr
                    key={userData.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        fontWeight: 500,
                        color: "var(--muted)",
                      }}
                    >
                      #{userData.id}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row" style={{ gap: "8px" }}>
                        <span>{userData.role === "ROLE_ADMIN" ? "Admin" : "Korisnik"}</span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--text)",
                          }}
                        >
                          {userData.username}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "var(--text)",
                      }}
                    >
                      {userData.email}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "6px",
                          background:
                            userData.role === "ROLE_ADMIN"
                              ? "rgba(124, 58, 237, 0.2)"
                              : "rgba(34, 197, 94, 0.2)",
                          color:
                            userData.role === "ROLE_ADMIN"
                              ? "var(--accent)"
                              : "var(--accent-2)",
                          border: `1px solid ${
                            userData.role === "ROLE_ADMIN"
                              ? "var(--accent)"
                              : "var(--accent-2)"
                          }`,
                        }}
                      >
                        {userData.role === "ROLE_ADMIN" ? "Admin" : "Korisnik"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--accent-2)",
                      }}
                    >
                      {formatCurrency(userData.totalIncome)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "var(--danger)",
                      }}
                    >
                      {formatCurrency(userData.totalExpense)}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color:
                          userData.balance >= 0
                            ? "var(--accent-2)"
                            : "var(--danger)",
                      }}
                    >
                      {formatCurrency(userData.balance)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row" style={{ gap: "12px" }}>
                        <button
                          onClick={() => startEdit(userData)}
                          disabled={processingUser === userData.id}
                          style={{
                            background: "var(--accent)",
                            color: "white",
                            border: "1px solid transparent",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 12px",
                            borderRadius: "10px",
                            cursor:
                              processingUser === userData.id
                                ? "not-allowed"
                                : "pointer",
                            opacity: processingUser === userData.id ? 0.6 : 1,
                            fontSize: "12px",
                            fontWeight: 500,
                          }}
                        >
                          Uredi
                        </button>
                        {userData.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(userData.id)}
                            disabled={processingUser === userData.id}
                            style={{
                              background: "var(--danger)",
                              color: "white",
                              border: "1px solid transparent",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              borderRadius: "10px",
                              cursor:
                                processingUser === userData.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: processingUser === userData.id ? 0.6 : 1,
                              fontSize: "12px",
                              fontWeight: 500,
                            }}
                          >
                            {processingUser === userData.id ? (
                              <div
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  border: "2px solid transparent",
                                  borderTop: "2px solid white",
                                  borderRadius: "50%",
                                  animation: "spin 1s linear infinite",
                                  display: "inline-block",
                                }}
                              ></div>
                            ) : (
                              <>Obriši</>
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "16px" }}>👥</div>
              <p className="muted" style={{ fontSize: "1.1rem", margin: 0 }}>
                Nema korisnika za prikaz
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        tr:hover {
          background-color: var(--panel-2) !important;
        }
      `}</style>
    </div>
  );
};

export default AdminPage;
