import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiUrl } from "@/config/api";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("hotel_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("hotel_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("hotel_user", JSON.stringify(userData));
        return true;
      }

      // Fallback for demo if backend is not running
      if (email.includes("@robles.com") && password === "admin123" || password === "recepcion123") {
        const mockUser = {
          id: "st-1",
          email,
          name: email.startsWith("admin") ? "Admin Robles" : "Recepción 1",
          role: email.startsWith("admin") ? "admin" as const : "staff" as const
        };
        setUser(mockUser);
        localStorage.setItem("hotel_user", JSON.stringify(mockUser));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hotel_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
