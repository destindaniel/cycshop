import { supabase } from '@/integrations/supabase/client';

// Role identity is readable by its owner even before MFA; privileged policies
// still use has_role(), which enforces the sticky database MFA activation.
export async function getManagerIdentity(userId: string) {
  const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'gestionnaire');
  if (error) throw error;
  return data.length > 0;
}

export async function getAdminAssurance() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return data.currentLevel;
}

export async function activateAdminMfa() {
  const { data, error } = await supabase.rpc('activate_admin_mfa');
  if (error || data !== true) throw error ?? new Error('Activation de la double vérification impossible.');
}