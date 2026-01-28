const API_BASE = "/api";

// Helper funkcija za sigurno parsiranje JSON-a
const parseJSON = async (res) => {
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server nije dostupan ili je grešna konfiguracija");
  }
  return res.json();
};

// =====================
// AUTH ENDPOINTS
// =====================
export const auth = {
  me: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return parseJSON(res);
  },

  register: async (username, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Registration failed");
    }
    return parseJSON(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Login failed");
    }
    return parseJSON(res);
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};

// =====================
// CATEGORY ENDPOINTS
// =====================
export const categories = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return parseJSON(res);
  },

  create: async (name, type) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Failed to create category");
    }
    return parseJSON(res);
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete category");
    return res.ok;
  },

  getMyCategories: async () => {
    const res = await fetch(`${API_BASE}/categories/my`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch user categories");
    return parseJSON(res);
  },
};

// =====================
// TRANSACTION ENDPOINTS
// =====================
export const transactions = {
  getAll: async (page = 0, size = 10) => {
    const res = await fetch(`${API_BASE}/transactions?page=${page}&size=${size}`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch transactions");
    return parseJSON(res);
  },

  create: async (categoryId, amount, transactionDate, description) => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        amount,
        transactionDate,
        description,
      }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Failed to create transaction");
    }
    return parseJSON(res);
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete transaction");
    return res.ok;
  },

  search: async (filter, page = 0, size = 10) => {
    const res = await fetch(`${API_BASE}/transactions/search?page=${page}&size=${size}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filter),
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to search transactions");
    return parseJSON(res);
  },

  downloadTemplate: async () => {
    const res = await fetch(`${API_BASE}/transactions/template`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to download template");
    return res.blob();
  },

  import: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/transactions/import`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to import transactions");
    return parseJSON(res);
  },

  getMonthlyBalance: async () => {
    const res = await fetch(`${API_BASE}/transactions/monthly-balance`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch monthly balance");
    return parseJSON(res);
  },
};

// =====================
// DASHBOARD ENDPOINTS
// =====================
export const dashboard = {
  getSpendingByCategory: async () => {
    const res = await fetch(`${API_BASE}/dashboard/spending-by-category`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch spending data");
    return parseJSON(res);
  },

  getWeeklyGoal: async () => {
    const res = await fetch(`${API_BASE}/dashboard/weekly-goal`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch weekly goal");
    return parseJSON(res);
  },
};

// =====================
// SAVINGS ENDPOINTS
// =====================
export const savings = {
  getAll: async () => {
    const res = await fetch(`${API_BASE}/savings-goals`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch savings goals");
    return parseJSON(res);
  },

  create: async (name, targetAmount, deadline) => {
    const res = await fetch(`${API_BASE}/savings-goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetAmount, deadline }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Failed to create savings goal");
    }
    return parseJSON(res);
  },

  addSavings: async (goalId, amount) => {
    const res = await fetch(`${API_BASE}/savings-goals/${goalId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await parseJSON(res);
      throw new Error(data.message || "Failed to add savings");
    }
    return parseJSON(res);
  },

  delete: async (goalId) => {
    const res = await fetch(`${API_BASE}/savings-goals/${goalId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to delete savings goal");
    return res.ok;
  },
};
