import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: {
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    expiresAt?: string;
  };
  settings: {
    notifications: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  updateUserSettings: (settings: Partial<User['settings']>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    const checkAuthStatus = () => {
      const savedUser = localStorage.getItem('ats_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('ats_user');
        }
      }
      setIsLoading(false);
    };

    setTimeout(checkAuthStatus, 500); // Simulate API call delay
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock authentication - in real app, this would be an API call
    if (email && password.length >= 6) {
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=6366f1&color=ffffff`,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        },
        settings: {
          notifications: true,
          darkMode: false,
          language: 'en',
          timezone: 'America/New_York'
        }
      };

      setUser(mockUser);
      localStorage.setItem('ats_user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid email or password');
    }

    setIsLoading(false);
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Mock registration - in real app, this would be an API call
    if (email && password.length >= 6 && name.trim()) {
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name: name.trim(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=6366f1&color=ffffff`,
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days free trial
        },
        settings: {
          notifications: true,
          darkMode: false,
          language: 'en',
          timezone: 'America/New_York'
        }
      };

      setUser(mockUser);
      localStorage.setItem('ats_user', JSON.stringify(mockUser));
    } else {
      throw new Error('Please provide valid email, password (min 6 characters), and name');
    }

    setIsLoading(false);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('ats_user');
  };

  const updateUserSettings = (newSettings: Partial<User['settings']>) => {
    if (user) {
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          ...newSettings
        }
      };
      setUser(updatedUser);
      localStorage.setItem('ats_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUserSettings
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
