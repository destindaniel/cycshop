import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthState = { user: User | null; isManager: boolean; loading: boolean };
const AuthContext = createContext<AuthState>({ user: null, isManager: false, loading: true });

export async function checkManager(userId: string) {
  const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'gestionnaire' });
  return data === true;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isManager: false, loading: true });
  useEffect(() => {
    const apply = async (user: User | null) => {
      const isManager = user ? await checkManager(user.id) : false;
      setState({ user, isManager, loading: false });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { void apply(session?.user ?? null); });
    void supabase.auth.getUser().then(({ data }) => apply(data.user));
    return () => sub.subscription.unsubscribe();
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
