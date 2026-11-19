import electronics from '@/assets/cycy-electronique.webp.asset.json';
import clothing from '@/assets/cycy-vetements.webp.asset.json';
import shoes from '@/assets/cycy-chaussures.webp.asset.json';
import accessories from '@/assets/cycy-accessoires.webp.asset.json';
export const categories = [
 { slug:'electronique', name:'Électronique', description:'La technologie au quotidien', image:electronics.url },
 { slug:'vetements', name:'Vêtements', description:'Votre style, votre signature', image:clothing.url },
 { slug:'chaussures', name:'Chaussures', description:'L’élégance à chaque pas', image:shoes.url },
 { slug:'accessoires', name:'Accessoires', description:'Les détails qui font la différence', image:accessories.url },
];
export function pageHead(title:string, description:string) { return { meta:[{title:`${title} | CYCY shop`},{name:'description',content:description},{property:'og:title',content:`${title} | CYCY shop`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}] }; }
