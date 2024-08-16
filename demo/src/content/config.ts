import { defineCollection } from "astro:content";
import { stripePriceLoader, stripeProductLoader } from "stripe-astro-loader";
import Stripe from "stripe";

const stripe = new Stripe("...");

const products = defineCollection({
  loader: stripeProductLoader(stripe),
});

const prices = defineCollection({
  loader: stripePriceLoader(stripe),
});

export const collections = { products, prices };
