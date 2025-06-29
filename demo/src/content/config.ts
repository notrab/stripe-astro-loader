import { defineCollection } from "astro:content";
import {
  stripePriceLoader,
  stripeProductLoader,
  stripePlanLoader,
} from "stripe-astro-loader";
import Stripe from "stripe";

const stripe = new Stripe("");

const products = defineCollection({
  loader: stripeProductLoader(stripe),
});

const prices = defineCollection({
  loader: stripePriceLoader(stripe),
});

const plans = defineCollection({
  loader: stripePlanLoader(stripe),
});

export const collections = { products, prices, plans };
