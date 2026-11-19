import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/components/catalog-page';
import { pageHead } from '@/lib/storefront';
export const Route=createFileRoute('/promotions')({head:()=>pageHead('Promotions','Retrouvez les offres et promotions de CYCY shop à Brazzaville.'),component:()=> <CatalogPage title="Les belles occasions" promotions/>});
