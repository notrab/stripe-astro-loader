import { defineCollection } from "astro:content";
import { stripeProductLoader } from "stripe-astro-loader";

const products = defineCollection({
  loader: stripeProductLoader({
    secretKey: "...",
  }),
});

export const collections = { products };
