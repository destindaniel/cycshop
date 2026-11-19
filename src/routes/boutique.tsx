import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/components/catalog-page';
import { pageHead } from '@/lib/storefront';
export const Route=createFileRoute('/boutique')({validateSearch:(s:Record<string,unknown>):{q?:string}=>typeof s['q']==='string'?{q:s['q']}:{},head:()=>pageHead('Boutique','Explorez les produits et les univers de CYCY shop à Brazzaville.'),component:Shop});
function Shop(){const {q}=Route.useSearch();return <CatalogPage query={q??''}/>}
