import { defineCollection, z } from 'astro:content';
const products = defineCollection({ type: 'content', schema: z.object({
  title:z.string(), titleZh:z.string().optional(), category:z.string(), sku:z.string().optional(), cover:z.string().min(1),
  media:z.array(z.object({url:z.string().min(1),type:z.enum(['image','video']).default('image'),alt:z.string().optional()})).default([]),
  price:z.string().optional(), description:z.string().optional(), descriptionZh:z.string().optional(), tags:z.array(z.string()).default([]),
  variants:z.array(z.object({name:z.string(),options:z.array(z.string()).default([])})).default([]),
  reviews:z.array(z.object({author:z.string(),email:z.string().email().optional(),rating:z.number().min(1).max(5),title:z.string().optional(),body:z.string(),date:z.string().optional(),variants:z.string().optional()})).default([]),
  featured:z.boolean().default(false), published:z.boolean().default(true), sortOrder:z.number().default(0)
}) });
const reviews = defineCollection({ type: 'content', schema: z.object({ product:z.string(), author:z.string(), email:z.string().email().optional(), rating:z.number().min(1).max(5), title:z.string().optional(), body:z.string(), date:z.string(), variants:z.string().optional(), status:z.enum(['pending','approved','rejected']).default('pending') }) });
export const collections = { products, reviews };
