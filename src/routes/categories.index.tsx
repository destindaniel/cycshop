import { createFileRoute } from '@tanstack/react-router';
import { CategoryGrid } from '@/components/category-grid';
import { pageHead } from '@/lib/storefront';
export const Route=createFileRoute('/categories/')({head:()=>pageHead('Nos catégories','Découvrez les quatre univers CYCY shop : électronique, vêtements, chaussures et accessoires.'),component:()=> <main className="wrap"><div className="page-heading"><p className="overline">À chaque envie, son univers</p><h1>Nos catégories</h1><p>Des découvertes pour tous les styles de vie.</p></div><section className="section"><CategoryGrid/></section></main>});
