import { createFileRoute, notFound } from '@tanstack/react-router';
import { CatalogPage } from '@/components/catalog-page';
import { categories,pageHead } from '@/lib/storefront';
export const Route=createFileRoute('/categories/$slug')({loader:({params})=>{const category=categories.find(c=>c.slug===params.slug);if(!category)throw notFound();return category;},head:({loaderData})=>pageHead(loaderData?.name??'Catégorie indisponible',loaderData?.description??'Cette catégorie est indisponible chez CYCY shop.'),component:Category});
function Category(){const c=Route.useLoaderData();return <CatalogPage title={c.name} category={c.slug}/>}
