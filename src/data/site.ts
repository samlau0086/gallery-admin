export const site = { name:'Atelier Eleven', tagline:'Objects with a quieter point of view.', hero:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=2200&q=88', contact:{ whatsapp:'https://wa.me/85265426672', email:'mailto:info@maesvanti.online' } };
export const categories = ['All','Apparel','Bags','Accessories'];

export const categorySlug = (category: string) => category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
