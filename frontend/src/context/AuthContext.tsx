import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "../types";
import api from "../services/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

import { useNavigate } from "react-router-dom";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = async () => {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.get("/auth/me");
      setUser(res.data?.data || null);
      setToken(currentToken);
    } catch (err) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, userData: User) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
    navigate("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    void refreshUser();
    // also listen for storage changes (other tabs)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token") void refreshUser();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, refreshUser, logout }}
    >
      {isLoading ? (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <span className="animate-spin h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full"></span>
            <p className="text-gray-600 font-medium animate-pulse">Loading...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
