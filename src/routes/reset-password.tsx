import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/storefront';

export const Route = createFileRoute('/reset-password')({ head: () => pageHead('Nouveau mot de passe', 'Choisissez un nouveau mot de passe pour votre compte CYCY shop.'), component: ResetPassword });

function ResetPassword() {
  const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const navigate = useNavigate();
  return <main className="wrap"><div className="form-panel"><h1>Nouveau mot de passe</h1><p className="text-sm text-muted-foreground">Choisissez un mot de passe d’au moins 8 caractères.</p><form className="form-stack" onSubmit={async (e) => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) { toast.error('Le lien a expiré ou est invalide. Demandez-en un nouveau.'); return; } toast.success('Mot de passe mis à jour.'); navigate({ to: '/compte' }); }}><label>Mot de passe<Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></label><Button type="submit" disabled={busy}>Enregistrer</Button></form></div></main>;
}
