import { demoComplaints, demoInstitutions, demoUser } from "../data/demoData";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== "false";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
let demoCases = [...demoComplaints];
let demoOrgs = [...demoInstitutions];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  async getNotifications() {
    if (DEMO_MODE) return demoCases.filter(c => ["High", "Critical"].includes(c.priority)).map(c => ({...c}));
    return request("/notifications");
  },
  async globalSearch(query) {
    const q = encodeURIComponent(String(query || "").trim());
    if (!q) return { complaints: [], institutions: [] };
    if (DEMO_MODE) {
      const matches = (items, fields) => items.filter(item => fields.some(key => String(item[key] ?? "").toLowerCase().includes(decodeURIComponent(q).toLowerCase()))).slice(0, 8);
      return { complaints: matches(demoCases, ["id", "title", "description", "institution", "category", "bureau"]), institutions: matches(demoOrgs, ["id", "name", "city", "state", "type"]) };
    }
    return request(`/search?q=${q}`);
  },
  async aiChat(message, history = []) {
    if (DEMO_MODE) throw new Error("AI chatbot requires real-backend mode. Set VITE_DEMO_MODE=false in .env and restart Vite.");
    return request("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) });
  },
  async aiTriage(payload) {
    if (DEMO_MODE) throw new Error("AI triage requires real-backend mode. Set VITE_DEMO_MODE=false in .env and restart Vite.");
    return request("/ai/triage", { method: "POST", body: JSON.stringify(payload) });
  },
  async analyzeGraph(graphData) {
    if (DEMO_MODE) throw new Error("Graph AI analysis requires real-backend mode. Set VITE_DEMO_MODE=false in .env and restart Vite.");
    return request("/ai/graph-analysis", { method: "POST", body: JSON.stringify(graphData) });
  },
  async getCurrentUser() {
    if (DEMO_MODE) return demoUser;
    return request("/auth/me");
  },
  async getProfile() {
    if (DEMO_MODE) return { name: demoUser.name || "", email: demoUser.email || "", region: "", institutionId: "" };
    return request("/profile");
  },
  async updateProfile(payload) {
    if (DEMO_MODE) return { ...demoUser, ...payload };
    return request("/profile", { method: "PATCH", body: JSON.stringify(payload) });
  },
  async googleLogin(credential, role = "User") {
    if (DEMO_MODE) throw new Error("Google authentication requires real-backend mode. Set VITE_DEMO_MODE=false and restart Vite.");
    return request("/auth/google", { method: "POST", body: JSON.stringify({ credential, requestedRole: role }) });
  },
  async login(email, password, displayName = "", role = "User") {
    if (DEMO_MODE) {
      const fallbackName = (email.split("@")[0] || "Demo User").replace(/[._-]+/g, " ").replace(/\b\w/g, char => char.toUpperCase());
      const name = displayName || fallbackName;
      const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("") || "DU";
      return { ...demoUser, name, initials, email, role, demo: true };
    }
    return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, displayName, requestedRole: role }) });
  },
  async logout() {
    if (!DEMO_MODE) await request("/auth/logout", { method: "POST" });
  },
  async getComplaints() {
    if (DEMO_MODE) return [...demoCases];
    return request("/complaints");
  },
  async getComplaint(id) {
    if (DEMO_MODE) return demoCases.find((item) => item.id === id) || null;
    return request(`/complaints/${id}`);
  },
  async createComplaint(payload) {
    if (DEMO_MODE) {
      const record = { ...payload, id: `CT-${Date.now().toString().slice(-5)}`, score: 35, related: false, updated: payload.received };
      demoCases = [record, ...demoCases];
      return record;
    }
    return request("/complaints", { method: "POST", body: JSON.stringify(payload) });
  },
  async deleteComplaint(id) {
    if (DEMO_MODE) { demoCases = demoCases.filter(item => item.id !== id); return { message: "Deleted" }; }
    return request(`/complaints/${id}`, { method: "DELETE" });
  },
  async updateComplaint(id, payload) {
    if (DEMO_MODE) {
      demoCases = demoCases.map((item) => item.id === id ? { ...item, ...payload, updated: new Date().toISOString().slice(0, 10) } : item);
      return demoCases.find((item) => item.id === id);
    }
    return request(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
  },
  async getInstitutions() {
    if (DEMO_MODE) return [...demoOrgs];
    return request("/institutions");
  },
  async verifyInstitution(payload) {
    if (DEMO_MODE) throw new Error("Institution verification requires real-backend mode. Set VITE_DEMO_MODE=false in .env and restart Vite.");
    return request("/ai/verify-institution", { method: "POST", body: JSON.stringify(payload) });
  },
  async analyzeInstitution(institutionId) {
    if (DEMO_MODE) throw new Error("Institution AI analysis requires real-backend mode. Set VITE_DEMO_MODE=false in .env and restart Vite.");
    return request("/ai/institution-analysis", { method: "POST", body: JSON.stringify({ institutionId }) });
  },
  async createInstitution(payload) {
    if (DEMO_MODE) {
      const record = { ...payload, complaints: 0 };
      demoOrgs = [record, ...demoOrgs];
      return record;
    }
    return request("/institutions", { method: "POST", body: JSON.stringify(payload) });
  }
};

export { DEMO_MODE };
