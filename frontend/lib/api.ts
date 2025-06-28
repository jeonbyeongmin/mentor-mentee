import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  email: string;
  role: "mentor" | "mentee";
  profile: {
    name?: string;
    bio?: string;
    imageUrl?: string;
    skills?: string[];
  };
}

export interface MatchRequest {
  id: number;
  mentorId: number;
  menteeId: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

// Auth APIs
export const authAPI = {
  signup: (data: {
    email: string;
    password: string;
    name?: string;
    role: "mentor" | "mentee";
  }) => api.post("/signup", data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string }>("/login", data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get<User>("/me"),

  updateProfile: (data: FormData) =>
    api.put<User>("/profile", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getProfileImage: (role: string, id: number) =>
    `${API_BASE_URL}/images/${role}/${id}`,
};

// Mentor APIs
export const mentorAPI = {
  getMentors: (params?: { skill?: string; order_by?: string }) =>
    api.get<User[]>("/mentors", { params }),
};

// Match Request APIs
export const matchRequestAPI = {
  sendRequest: (data: {
    mentorId: number;
    menteeId: number;
    message?: string;
  }) => api.post<MatchRequest>("/match-requests", data),

  getIncomingRequests: () =>
    api.get<MatchRequest[]>("/match-requests/incoming"),

  getOutgoingRequests: () =>
    api.get<MatchRequest[]>("/match-requests/outgoing"),

  acceptRequest: (id: number) =>
    api.put<MatchRequest>(`/match-requests/${id}/accept`),

  rejectRequest: (id: number) =>
    api.put<MatchRequest>(`/match-requests/${id}/reject`),

  cancelRequest: (id: number) =>
    api.delete<MatchRequest>(`/match-requests/${id}`),
};

export default api;
