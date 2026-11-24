import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ShieldCheck, LogOut, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { activateAdminMfa, getAdminAssurance } from '@/lib/admin-session';
import { isTotpCode } from '@/lib/admin-access';

type Enrollment = { id: string; qrCode: string };

export function AdminMfa() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const status = useQuery({ queryKey: ['admin', 'mfa-status'], retry: false, queryFn: async () => {
    const { data, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError) throw factorError;
    const { data: identity, error: userError } = await supabase.auth.getUser();
    if (userError || !identity.user) throw userError ?? new Error('Session requise.');
    const { data: activation, error: activationError } = await supabase.from('admin_mfa_enforcement').select('factor_id').eq('user_id', identity.user.id).maybeSingle();
    if (activationError) throw activationError;
    return { factors: data.totp.filter((factor) => !activation || factor.id === activation.factor_id), assuranceLevel: await getAdminAssurance(), recoveryRequired: !!activation && !data.totp.some((factor) => factor.id === activation.factor_id) };
  } });
  const factor = status.data?.factors[0];

  const enroll = async () => {
    setBusy(true); setError('');
    try {
      // Discard only unfinished setups, never a verified phone.
      const { data: existing, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      if (existing.totp.length) { await status.refetch(); return; }
      for (const pending of existing.all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified')) {
        const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId: pending.id });
        if (removeError) throw removeError;
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'CYCY administration', issuer: 'CYCY shop' });
      if (enrollError) throw enrollError;
      setEnrollment({ id: data.id, qrCode: data.totp.qr_code });
    } catch { setError('Impossible d’associer votre téléphone. Réessayez après vous être reconnectée.'); }
    finally { setBusy(false); }
  };

  const openDashboard = async () => {
    await activateAdminMfa();
    await queryClient.cancelQueries();
    queryClient.clear();
    await navigate({ to: '/admin/dashboard', replace: true });
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    const factorId = enrollment?.id ?? factor?.id;
    if (!factorId || !isTotpCode(code)) return;
    setBusy(true); setError('');
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (verifyError) { setError('Code incorrect ou expiré. Saisissez le nouveau code de votre application.'); return; }
      setEnrollment(null); setCode('');
      await openDashboard();
    } catch { setError('La vérification n’a pas pu être finalisée. Réessayez ou reconnectez-vous.'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><ShieldCheck className="text-primary" aria-hidden /><h1 className="text-2xl font-semibold">Double vérification</h1></div>
    {status.isPending ? <p role="status">Vérification de votre compte…</p> : status.isError ? <div className="space-y-3"><p role="alert">Impossible de vérifier votre téléphone.</p><Button variant="outline" onClick={() => status.refetch()}>Réessayer</Button></div> : status.data.recoveryRequired ? <p role="alert" className="text-sm text-muted-foreground">Le téléphone associé n’est plus disponible. Le propriétaire du projet doit organiser la récupération de votre accès.</p> : status.data.assuranceLevel === 'aal2' ? <Button disabled={busy} onClick={async () => { setBusy(true); try { await openDashboard(); } catch { setError('Impossible d’ouvrir l’administration. Reconnectez-vous.'); } finally { setBusy(false); } }}>Ouvrir l’administration</Button> : <>
      {!factor && !enrollment && <div className="space-y-4"><p className="text-sm text-muted-foreground">Associez votre téléphone pour sécuriser l’accès à la boutique.</p><Button onClick={enroll} disabled={busy}><Smartphone />Associer mon téléphone</Button></div>}
      {enrollment && <div className="space-y-4"><p className="text-sm text-muted-foreground">Scannez ce QR code avec Google Authenticator ou Microsoft Authenticator.</p><img src={enrollment.qrCode} width={220} height={220} className="mx-auto max-w-full" alt="QR code d’association à votre application d’authentification" /><p className="text-xs text-muted-foreground">Gardez cette association privée. La protection devient obligatoire après confirmation du premier code.</p></div>}
      {(factor || enrollment) && <form className="space-y-4" onSubmit={verify}><label className="block text-sm space-y-2"><span>Code de votre application</span><Input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} /></label><Button className="w-full" type="submit" disabled={busy || !isTotpCode(code)}>{busy ? 'Vérification…' : 'Vérifier et se connecter'}</Button></form>}
      <p className="text-xs text-muted-foreground">Téléphone perdu ? Le propriétaire du projet doit organiser la récupération de votre accès.</p>
    </>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button variant="ghost" disabled={busy} onClick={async () => { setEnrollment(null); await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: '/compte', replace: true }); }}><LogOut />Se déconnecter</Button>
  </div>;
}