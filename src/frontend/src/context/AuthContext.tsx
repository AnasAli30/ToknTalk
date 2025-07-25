import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthState } from '../services/authService';

interface AuthContextType {
  authState: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  identity: null,
  principal: null,
};

const AuthContext = createContext<AuthContextType>({
  authState: defaultAuthState,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const state = await authService.initialize();
        setAuthState(state);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async () => {
    setIsLoading(true);
    try {
      const state = await authService.login();
      setAuthState(state);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setAuthState(defaultAuthState);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}; 