# Stripe Astro Loader Examples

This document provides examples of how to use the Stripe Astro Loader API to create collections for any Stripe object.

## Basic Setup

```ts
// src/content/config.ts
import { defineCollection } from "astro:content";
import {
  createStripeLoader,
  createQuickStripeLoader,
  stripeTsToZod,
} from "stripe-astro-loader";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

## 1. Quick Loaders (Simplest)

For common Stripe objects, use the quick loader:

```ts
const coupons = defineCollection({
  loader: createQuickStripeLoader(stripe, "coupons"),
});

const invoices = defineCollection({
  loader: createQuickStripeLoader(stripe, "invoices", {
    limit: 50,
    status: "paid",
  }),
});

const paymentMethods = defineCollection({
  loader: createQuickStripeLoader(stripe, "paymentMethods"),
});

const promotionCodes = defineCollection({
  loader: createQuickStripeLoader(stripe, "promotionCodes"),
});

const setupIntents = defineCollection({
  loader: createQuickStripeLoader(stripe, "setupIntents"),
});

const paymentIntents = defineCollection({
  loader: createQuickStripeLoader(stripe, "paymentIntents"),
});
```

## 2. Standard Loaders (Recommended)

Use `createStripeLoader` for any Stripe object with auto-generated schemas:

### Products

```ts
const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
    renderItem: (product) => product.description || null,
  }),
});
```

### Prices

```ts
const prices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "price",
    objectType: "price",
    listFunction: stripe.prices.list.bind(stripe.prices),
  }),
});
```

### Customers

```ts
const customers = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "customer",
    objectType: "customer",
    listFunction: stripe.customers.list.bind(stripe.customers),
    renderItem: (customer) => customer.description || customer.name || null,
  }),
});
```

### Subscriptions

```ts
const subscriptions = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "subscription",
    objectType: "subscription",
    listFunction: stripe.subscriptions.list.bind(stripe.subscriptions),
    renderItem: (subscription) => subscription.description || null,
  }),
});
```

### Plans (Legacy)

```ts
const plans = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "plan",
    objectType: "plan",
    listFunction: stripe.plans.list.bind(stripe.plans),
  }),
});
```

## 3. Loaders with Custom Validation

Add runtime validation while preserving full Stripe types:

```ts
import { z } from "astro/zod";

const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
    schema: stripeTsToZod("product", {
      name: z.string().min(1),
      active: z.boolean(),
      type: z.enum(["good", "service"]),
      description: z.string().nullable().optional(),
      images: z.array(z.string()).optional(),
    }),
  }),
});

const subscriptions = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "subscription",
    objectType: "subscription",
    listFunction: stripe.subscriptions.list.bind(stripe.subscriptions),
    schema: stripeTsToZod("subscription", {
      status: z.enum([
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ]),
      current_period_start: z.number(),
      current_period_end: z.number(),
      cancel_at_period_end: z.boolean(),
    }),
  }),
});
```

## 4. Loaders with Filtering and Options

Pass Stripe API parameters to filter data:

```ts
// Only active products from the last 30 days
const recentProducts = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "recent-product",
      objectType: "product",
      listFunction: stripe.products.list.bind(stripe.products),
    },
    {
      active: true,
      created: { gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60 },
      limit: 50,
    }
  ),
});

// Only recurring prices
const recurringPrices = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "recurring-price",
      objectType: "price",
      listFunction: stripe.prices.list.bind(stripe.prices),
    },
    {
      type: "recurring",
      active: true,
    }
  ),
});

// Paid invoices from last 90 days
const recentInvoices = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "recent-invoice",
      objectType: "invoice",
      listFunction: stripe.invoices.list.bind(stripe.invoices),
    },
    {
      status: "paid",
      created: { gte: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60 },
      limit: 100,
    }
  ),
});
```

## 5. Loaders with Custom Rendering

Generate HTML content for each item:

```ts
const productsWithRendering = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
    renderItem: (product) => {
      return `
        <div class="product-card">
          <h3>${product.name}</h3>
          <p>${product.description || "No description"}</p>
          <span class="status">${product.active ? "Active" : "Inactive"}</span>
          <div class="images">
            ${product.images
              .map((img) => `<img src="${img}" alt="${product.name}" />`)
              .join("")}
          </div>
        </div>
      `;
    },
  }),
});

const customersWithRendering = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "customer",
    objectType: "customer",
    listFunction: stripe.customers.list.bind(stripe.customers),
    renderItem: (customer) => {
      return `
        <div class="customer-card">
          <h4>${customer.name || "Unnamed Customer"}</h4>
          <p>Email: ${customer.email || "No email"}</p>
          <p>Balance: $${(customer.balance / 100).toFixed(2)}</p>
          <span class="status">${
            customer.delinquent ? "Delinquent" : "Good Standing"
          }</span>
        </div>
      `;
    },
  }),
});
```

## 6. Advanced Custom Objects

For any Stripe object with a `.list()` method:

```ts
// Webhook Endpoints
const webhookEndpoints = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "webhook-endpoint",
    objectType: "webhook_endpoint",
    listFunction: stripe.webhookEndpoints.list.bind(stripe.webhookEndpoints),
    schema: stripeTsToZod("webhook_endpoint", {
      url: z.string().url(),
      enabled_events: z.array(z.string()),
      status: z.enum(["enabled", "disabled"]).optional(),
    }),
  }),
});

// Payment Intents
const paymentIntents = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "payment-intent",
    objectType: "payment_intent",
    listFunction: stripe.paymentIntents.list.bind(stripe.paymentIntents),
  }),
});

// Setup Intents
const setupIntents = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "setup-intent",
    objectType: "setup_intent",
    listFunction: stripe.setupIntents.list.bind(stripe.setupIntents),
  }),
});

// Disputes
const disputes = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "dispute",
    objectType: "dispute",
    listFunction: stripe.disputes.list.bind(stripe.disputes),
  }),
});

// Application Fees
const applicationFees = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "application-fee",
    objectType: "application_fee",
    listFunction: stripe.applicationFees.list.bind(stripe.applicationFees),
  }),
});
```

## 7. Complete Configuration Example

```ts
// src/content/config.ts
import { defineCollection } from "astro:content";
import {
  createStripeLoader,
  createQuickStripeLoader,
  stripeTsToZod,
} from "stripe-astro-loader";
import { z } from "astro/zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Core business objects
const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
  }),
});

const prices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "price",
    objectType: "price",
    listFunction: stripe.prices.list.bind(stripe.prices),
  }),
});

const customers = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "customer",
    objectType: "customer",
    listFunction: stripe.customers.list.bind(stripe.customers),
  }),
});

const subscriptions = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "subscription",
    objectType: "subscription",
    listFunction: stripe.subscriptions.list.bind(stripe.subscriptions),
  }),
});

// Marketing objects using quick loaders
const coupons = defineCollection({
  loader: createQuickStripeLoader(stripe, "coupons"),
});

const promotionCodes = defineCollection({
  loader: createQuickStripeLoader(stripe, "promotionCodes"),
});

// Financial objects using quick loaders
const invoices = defineCollection({
  loader: createQuickStripeLoader(stripe, "invoices"),
});

const paymentIntents = defineCollection({
  loader: createQuickStripeLoader(stripe, "paymentIntents"),
});

// Custom objects with validation
const webhookEndpoints = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "webhook-endpoint",
    objectType: "webhook_endpoint",
    listFunction: stripe.webhookEndpoints.list.bind(stripe.webhookEndpoints),
    schema: stripeTsToZod("webhook_endpoint", {
      url: z.string().url(),
      enabled_events: z.array(z.string()),
      status: z.enum(["enabled", "disabled"]).optional(),
    }),
  }),
});

export const collections = {
  products,
  prices,
  customers,
  subscriptions,
  coupons,
  promotionCodes,
  invoices,
  paymentIntents,
  webhookEndpoints,
};
```

## 8. Using the Data in Astro Pages

### Basic Usage

```astro
---
// src/pages/products.astro
import { getCollection } from 'astro:content';

const products = await getCollection('products');
const prices = await getCollection('prices');
---

<h1>Products</h1>
<div class="products-grid">
  {products.map((product) => (
    <div class="product-card">
      <h3>{product.data.name}</h3>
      <p>{product.data.description}</p>
      <span class="status">
        {product.data.active ? 'Active' : 'Inactive'}
      </span>
      <p>Created: {new Date(product.data.created * 1000).toLocaleDateString()}</p>
    </div>
  ))}
</div>
```

### With Rendered Content

```astro
---
// src/pages/rendered-products.astro
import { getCollection } from 'astro:content';

const products = await getCollection('productsWithRendering');
---

<h1>Products with Custom Rendering</h1>
{products.map((product) => (
  <Fragment set:html={product.rendered?.html} />
))}
```

### Filtering and Sorting

```astro
---
// src/pages/active-products.astro
import { getCollection } from 'astro:content';

const allProducts = await getCollection('products');
const activeProducts = allProducts
  .filter(product => product.data.active)
  .sort((a, b) => a.data.name.localeCompare(b.data.name));
---

<h1>Active Products ({activeProducts.length})</h1>
{activeProducts.map((product) => (
  <div class="product">
    <h3>{product.data.name}</h3>
    <p>Type: {product.data.type === 'good' ? 'Physical Good' : 'Service'}</p>
    <p>Images: {product.data.images.length}</p>
  </div>
))}
```

### Combining Multiple Collections

```astro
---
// src/pages/dashboard.astro
import { getCollection } from 'astro:content';

const [products, customers, subscriptions, invoices] = await Promise.all([
  getCollection('products'),
  getCollection('customers'),
  getCollection('subscriptions'),
  getCollection('invoices')
]);

const activeProducts = products.filter(p => p.data.active);
const activeSubscriptions = subscriptions.filter(s => s.data.status === 'active');
const paidInvoices = invoices.filter(i => i.data.status === 'paid');
---

<h1>Stripe Dashboard</h1>
<div class="stats">
  <div class="stat">
    <h3>Products</h3>
    <p>{activeProducts.length} active</p>
  </div>
  <div class="stat">
    <h3>Customers</h3>
    <p>{customers.length} total</p>
  </div>
  <div class="stat">
    <h3>Subscriptions</h3>
    <p>{activeSubscriptions.length} active</p>
  </div>
  <div class="stat">
    <h3>Invoices</h3>
    <p>{paidInvoices.length} paid</p>
  </div>
</div>
```

## 9. TypeScript Benefits

The loaders provide full TypeScript support using Stripe's own type definitions:

```astro
---
import { getCollection } from 'astro:content';
import type Stripe from 'stripe';

const products = await getCollection('products');
const customers = await getCollection('customers');

// All properties are fully typed based on Stripe's TypeScript definitions
products.forEach(product => {
  // product.data is typed as Stripe.Product
  console.log(product.data.name); // ✅ string
  console.log(product.data.active); // ✅ boolean
  console.log(product.data.created); // ✅ number
  console.log(product.data.images); // ✅ string[]
  console.log(product.data.type); // ✅ "good" | "service"
});

customers.forEach(customer => {
  // customer.data is typed as Stripe.Customer
  console.log(customer.data.email); // ✅ string | null
  console.log(customer.data.name); // ✅ string | null
  console.log(customer.data.balance); // ✅ number
  console.log(customer.data.delinquent); // ✅ boolean | null
});
---
```

## 10. Advanced Patterns

### Environment-based Configuration

```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
});

const isProduction = process.env.NODE_ENV === "production";

const products = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "product",
      objectType: "product",
      listFunction: stripe.products.list.bind(stripe.products),
    },
    {
      active: isProduction, // Only active products in production
      limit: isProduction ? 100 : 10, // Fewer items in development
    }
  ),
});
```

### Custom Filtering Logic

```ts
const recentPaidInvoices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "recent-paid-invoice",
    objectType: "invoice",
    listFunction: (params) =>
      stripe.invoices.list({
        ...params,
        created: {
          gte: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60, // Last 30 days
        },
        status: "paid",
      }),
  }),
});
```

### Multiple Configurations for Same Object

```ts
// Different configurations for different use cases
const allProducts = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
  }),
});

const activeProducts = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "active-product",
      objectType: "product",
      listFunction: stripe.products.list.bind(stripe.products),
    },
    { active: true }
  ),
});

const recurringPrices = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "recurring-price",
      objectType: "price",
      listFunction: stripe.prices.list.bind(stripe.prices),
    },
    { type: "recurring" }
  ),
});

const oneTimePrices = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "onetime-price",
      objectType: "price",
      listFunction: stripe.prices.list.bind(stripe.prices),
    },
    { type: "one_time" }
  ),
});
```

## 11. Error Handling and Development Tips

### Safe Environment Setup

```ts
// Safely handle missing environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable is required");
}

const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-04-10",
});
```

### Development vs Production

```ts
const isDev = process.env.NODE_ENV === "development";

const products = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "product",
      objectType: "product",
      listFunction: stripe.products.list.bind(stripe.products),
    },
    {
      limit: isDev ? 5 : 100, // Fewer items in development for faster builds
    }
  ),
});
```

### Testing with Mock Data

```ts
// For testing, you can create a mock loader
const testProducts =
  isDev && process.env.USE_MOCK_DATA
    ? defineCollection({
        loader: () => [
          {
            id: "prod_test1",
            data: { id: "prod_test1", name: "Test Product", active: true },
          },
        ],
      })
    : defineCollection({
        loader: createStripeLoader(stripe, {
          name: "product",
          objectType: "product",
          listFunction: stripe.products.list.bind(stripe.products),
        }),
      });
```

This examples file shows you how to replace the old manual loaders with the flexible `createStripeLoader` and `createQuickStripeLoader` functions, giving you more control while maintaining the same functionality.
