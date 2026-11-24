import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getAdminAssurance, getManagerIdentity } from '@/lib/admin-session';

type AuthState = { user: User | null; isManager: boolean; assuranceLevel: string | null; loading: boolean };
const emptyState: AuthState = { user: null, isManager: false, assuranceLevel: null, loading: true };
const AuthContext = createContext<AuthState>(emptyState);

export async function checkManager(userId: string) {
  return getManagerIdentity(userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(emptyState);
  useEffect(() => {
    let active = true;
    let generation = 0;
    const apply = async () => {
      const current = ++generation;
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = data.user;
        const isManager = user ? await checkManager(user.id) : false;
        const assuranceLevel = user ? await getAdminAssurance() : null;
        if (active && generation === current) setState({ user, isManager, assuranceLevel, loading: false });
      } catch {
        if (active && generation === current) setState({ ...emptyState, loading: false });
      }
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        generation++;
        setState({ ...emptyState, loading: false });
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'TOKEN_REFRESHED') {
        // Never await Auth calls inside its locked event callback.
        queueMicrotask(() => { if (active) void apply(); });
      }
    });
    void apply();
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
