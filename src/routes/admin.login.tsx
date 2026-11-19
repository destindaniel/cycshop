import { createFileRoute, redirect } from '@tanstack/react-router';

// L'unique porte d'entrée administrateur est la page « Mon compte » (/compte).
export const Route = createFileRoute('/admin/login')({
  beforeLoad: () => { throw redirect({ to: '/compte' }); },
});
