import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { userAPI, User } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get("token");
      if (token) {
        try {
          const response = await userAPI.getProfile();
          setUser(response.data);
        } catch (error) {
          console.error("Failed to get user profile:", error);
          Cookies.remove("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string) => {
    Cookies.set("token", token, { expires: 1 }); // 1 day
    // Reload to fetch user data
    window.location.reload();
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    window.location.href = "/login";
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
