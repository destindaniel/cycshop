import { useEffect, useRef } from 'react';

type Widget = { render: (element: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: Widget } }

export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id: string | undefined;
    let active = true;
    const mount = () => {
      if (!active || !container.current || !window.turnstile || id) return;
      id = window.turnstile.render(container.current, { sitekey: siteKey, action: 'admin-login', callback: onToken, 'expired-callback': () => onToken(''), 'error-callback': () => onToken('') });
    };
    let script = document.querySelector<HTMLScriptElement>('script[data-turnstile]');
    if (!script) {
      script = document.createElement('script'); script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true; script.dataset['turnstile'] = 'true'; document.head.appendChild(script);
    }
    script.addEventListener('load', mount); mount();
    return () => { active = false; script?.removeEventListener('load', mount); if (id) window.turnstile?.remove(id); };
  }, [siteKey, onToken]);
  return <div ref={container} className="min-h-16" aria-label="Vérification de sécurité" />;
}