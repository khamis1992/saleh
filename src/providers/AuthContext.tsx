import React, { createContext, useContext, useEffect, useState } from 'react';

interface MockUser {
  id: string;
  email: string;
  role: string;
}

interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  full_name: string;
  phone: string;
  role_id: string;
  department_id: string;
  status: 'active' | 'inactive';
}

const MOCK_PROFILE: Profile = {
  id: 'profile-1',
  user_id: 'user-1',
  company_id: 'company-1',
  full_name: 'د. محمد العتيبي',
  phone: '0500000000',
  role_id: 'role-admin',
  department_id: 'dept-it',
  status: 'active',
};

interface AuthContextType {
  user: MockUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const stored = localStorage.getItem('erp_auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setProfile(MOCK_PROFILE);
      } catch {}
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Mock auth: accept any email/password combo
    if (!email || !password) {
      return { error: { message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' } };
    }
    if (password.length < 3) {
      return { error: { message: 'كلمة المرور قصيرة جداً' } };
    }
    const mockUser: MockUser = { id: 'user-1', email, role: 'super_admin' };
    localStorage.setItem('erp_auth_user', JSON.stringify(mockUser));
    setUser(mockUser);
    setProfile(MOCK_PROFILE);
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('erp_auth_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
