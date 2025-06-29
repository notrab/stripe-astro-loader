import {
  createStripeLoader,
  createQuickStripeLoader,
  stripeTsToZod,
} from "stripe-astro-loader";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Products using createStripeLoader
const products = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "product",
      objectType: "product",
      listFunction: stripe.products.list.bind(stripe.products),
      renderItem: (product) => product.description || null,
    },
    {
      active: true, // Only load active products
      limit: 100,
    }
  ),
});

// Prices using createStripeLoader
const prices = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "price",
      objectType: "price",
      listFunction: stripe.prices.list.bind(stripe.prices),
    },
    {
      active: true,
      type: "recurring",
    }
  ),
});

// Plans using createStripeLoader
const plans = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "plan",
    objectType: "plan",
    listFunction: stripe.plans.list.bind(stripe.plans),
  }),
});

// Customers using createStripeLoader
const customers = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "customer",
      objectType: "customer",
      listFunction: stripe.customers.list.bind(stripe.customers),
      renderItem: (customer) => customer.description || customer.name || null,
    },
    { limit: 50 }
  ),
});

// Quick loaders for common Stripe objects
const coupons = defineCollection({
  loader: createQuickStripeLoader(stripe, "coupons"),
});

const invoices = defineCollection({
  loader: createQuickStripeLoader(stripe, "invoices", { limit: 50 }),
});

// Custom loaders using the createStripeLoader API
const webhookEndpoints = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "webhook-endpoint",
    objectType: "webhook_endpoint",
    listFunction: stripe.webhookEndpoints.list.bind(stripe.webhookEndpoints),
    schema: stripeTsToZod("webhook_endpoint", {
      url: z.string(),
      enabled_events: z.array(z.string()),
      status: z.enum(["enabled", "disabled"]).optional(),
    }),
  }),
});

// Auto-generate schema (simplest approach)
const setupIntents = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "setup-intent",
    objectType: "setup_intent",
    listFunction: stripe.setupIntents.list.bind(stripe.setupIntents),
  }),
});

// Custom loader with render function
const promotionCodes = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "promotion-code",
    objectType: "promotion_code",
    listFunction: stripe.promotionCodes.list.bind(stripe.promotionCodes),
    renderItem: (code: any) => {
      return code.active
        ? `Code: ${code.code} - Active`
        : `Code: ${code.code} - Inactive`;
    },
  }),
});

export const collections = {
  products,
  prices,
  plans,
  customers,
  coupons,
  invoices,
  webhookEndpoints,
  setupIntents,
  promotionCodes,
};
