import { createFileRoute } from '@tanstack/react-router';
import { MapPin } from 'lucide-react';
import { pageHead } from '@/lib/storefront';
export const Route=createFileRoute('/contact')({head:()=>pageHead('Contact','CYCY shop est votre boutique à Brazzaville, en République du Congo.'),component:()=> <main className="wrap"><div className="page-heading"><p className="overline">À votre écoute</p><h1>Parlons de vos envies.</h1><p>Votre prochain coup de cœur commence par une rencontre.</p></div><section className="contact-panel"><h2>CYCY shop, à Brazzaville</h2><p className="flex items-center gap-3"><MapPin size={20}/>Brazzaville, République du Congo</p><div className="status">Nos coordonnées de contact et horaires seront communiqués à l’ouverture de la boutique.</div></section></main>});
