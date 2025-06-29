# stripe-astro-loader

Fetch data from the Stripe API and use it in Astro collections with full TypeScript support. This loader leverages Stripe's own TypeScript definitions for perfect type safety without manual schema maintenance.

## Features

- ✅ **Full TypeScript Support** - Uses Stripe SDK types directly, no manual type definitions
- ✅ **Automatic Schema Generation** - Converts Stripe TypeScript types to Zod schemas
- ✅ **Flexible API** - Create loaders for any Stripe object with minimal configuration
- ✅ **Smart Caching** - Incremental updates based on Stripe's `created` timestamps
- ✅ **Runtime Validation** - Validates essential fields while preserving full Stripe object structure
- ✅ **Quick Setup** - From simple quick loaders to fully customizable implementations

## Install

```bash
npm i stripe stripe-astro-loader
```

## Quick Start

```ts
// astro.config.ts
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    contentLayer: true,
  },
});
```

```ts
// src/content/config.ts
import { defineCollection } from "astro:content";
import { createStripeLoader, stripeTsToZod } from "stripe-astro-loader";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
  }),
});

export const collections = { products };
```

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';

// products is fully typed as Array<{ id: string, data: Stripe.Product }>
const products = await getCollection('products');
---

<ul>
  {products.map((product) => (
    <li>
      <h3>{product.data.name}</h3>
      <p>{product.data.description}</p>
      <span>{product.data.active ? 'Active' : 'Inactive'}</span>
    </li>
  ))}
</ul>
```

## Creating Loaders

### Pattern 1: Quick Loaders (Simplest)

For common Stripe objects, use the quick loader:

```ts
import { createQuickStripeLoader } from "stripe-astro-loader";

const coupons = defineCollection({
  loader: createQuickStripeLoader(stripe, "coupons"),
});

const invoices = defineCollection({
  loader: createQuickStripeLoader(stripe, "invoices", { limit: 50 }),
});

const paymentMethods = defineCollection({
  loader: createQuickStripeLoader(stripe, "paymentMethods"),
});

export const collections = {
  coupons,
  invoices,
  paymentMethods,
};
```

Supported quick loaders: `coupons`, `invoices`, `paymentMethods`, `promotionCodes`, `setupIntents`, `paymentIntents`

### Pattern 2: Standard Loaders (Recommended)

Use `createStripeLoader` for any Stripe object with auto-generated schemas:

```ts
import { createStripeLoader } from "stripe-astro-loader";

// Products
const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
  }),
});

// Prices
const prices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "price",
    objectType: "price",
    listFunction: stripe.prices.list.bind(stripe.prices),
  }),
});

// Customers
const customers = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "customer",
    objectType: "customer",
    listFunction: stripe.customers.list.bind(stripe.customers),
  }),
});

// Subscriptions
const subscriptions = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "subscription",
    objectType: "subscription",
    listFunction: stripe.subscriptions.list.bind(stripe.subscriptions),
  }),
});

export const collections = {
  products,
  prices,
  customers,
  subscriptions,
};
```

### Pattern 3: Loaders with Custom Validation

Add runtime validation while preserving full Stripe types:

```ts
import { createStripeLoader, stripeTsToZod } from "stripe-astro-loader";
import { z } from "astro/zod";

const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
    schema: stripeTsToZod<Stripe.Product>("product", {
      name: z.string().min(1),
      active: z.boolean(),
      type: z.enum(["good", "service"]),
      // Validates these fields while allowing all other Stripe.Product properties
    }),
  }),
});

const subscriptions = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "subscription",
    objectType: "subscription",
    listFunction: stripe.subscriptions.list.bind(stripe.subscriptions),
    schema: stripeTsToZod<Stripe.Subscription>("subscription", {
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

### Pattern 4: Loaders with Filtering and Options

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

// Legacy plans (if still using them)
const plans = defineCollection({
  loader: createStripeLoader(
    stripe,
    {
      name: "plan",
      objectType: "plan",
      listFunction: stripe.plans.list.bind(stripe.plans),
    },
    {
      active: true,
    }
  ),
});
```

### Pattern 5: Loaders with Custom Rendering

Generate HTML content for each item:

```ts
const products = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "product",
    objectType: "product",
    listFunction: stripe.products.list.bind(stripe.products),
    renderItem: (product) => {
      // This HTML will be available as rendered.html in your templates
      return `<h2>${product.name}</h2><p>${product.description || ""}</p>`;
    },
  }),
});
```

```astro
---
const products = await getCollection('products');
---

{products.map((product) => (
  <div>
    <!-- Use the pre-rendered HTML -->
    <Fragment set:html={product.rendered?.html} />

    <!-- Or use the structured data -->
    <span>Price: ${product.data.default_price}</span>
  </div>
))}
```

## Type Safety

The loader automatically provides full TypeScript support using Stripe's own type definitions:

```astro
---
import { getCollection } from 'astro:content';
import type Stripe from 'stripe';

const products = await getCollection('products');
const prices = await getCollection('prices');
---

{products.map((product) => {
  // product.data is fully typed as Stripe.Product
  const isSubscription = product.data.type === 'service';
  const imageCount = product.data.images.length;
  const lastUpdate = new Date(product.data.updated * 1000);

  return (
    <div>
      <h3>{product.data.name}</h3>
      {product.data.description && <p>{product.data.description}</p>}
      <small>Updated: {lastUpdate.toLocaleDateString()}</small>
    </div>
  );
})}
```

## Common Loader Examples

### Products Loader

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

### Prices Loader

```ts
const prices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "price",
    objectType: "price",
    listFunction: stripe.prices.list.bind(stripe.prices),
  }),
});
```

### Customers Loader

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

### Subscriptions Loader

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

### Invoice Loader

```ts
const invoices = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "invoice",
    objectType: "invoice",
    listFunction: stripe.invoices.list.bind(stripe.invoices),
  }),
});
```

### Payment Intent Loader

```ts
const paymentIntents = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "payment-intent",
    objectType: "payment_intent",
    listFunction: stripe.paymentIntents.list.bind(stripe.paymentIntents),
  }),
});
```

## Advanced Usage

### Custom Stripe Objects

For any Stripe object with a `.list()` method:

```ts
const webhookEndpoints = defineCollection({
  loader: createStripeLoader(stripe, {
    name: "webhook-endpoint",
    objectType: "webhook_endpoint",
    listFunction: stripe.webhookEndpoints.list.bind(stripe.webhookEndpoints),
    schema: stripeTsToZod<Stripe.WebhookEndpoint>("webhook_endpoint", {
      url: z.string(),
      enabled_events: z.array(z.string()),
      status: z.enum(["enabled", "disabled"]).optional(),
    }),
  }),
});
```

### Fully Custom Loaders

For complete control, create your own loader:

```ts
const customInvoices = defineCollection({
  loader: {
    name: "custom-stripe-invoice-loader",
    load: async (context) => {
      // Your custom loading logic
      const invoices = await stripe.invoices.list({
        status: "paid",
        created: { gte: Date.now() / 1000 - 30 * 24 * 60 * 60 }, // Last 30 days
      });

      const { store, parseData, generateDigest } = context;

      for (const invoice of invoices.data) {
        const data = await parseData({ id: invoice.id, data: invoice });
        const digest = generateDigest(data);
        store.set({ id: invoice.id, data, digest });
      }
    },
    schema: stripeTsToZod<Stripe.Invoice>("invoice", {
      status: z
        .enum(["draft", "open", "paid", "uncollectible", "void"])
        .optional(),
      amount_due: z.number().optional(),
    }),
  },
});
```

## Environment Setup

```bash
# .env
STRIPE_SECRET_KEY=sk_test_...
```

```ts
// src/content/config.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10", // Use latest API version
});
```

## API Reference

### `createStripeLoader(stripe, config, options?)`

Creates a Stripe loader with the specified configuration.

**Parameters:**

- `stripe` - Stripe instance
- `config` - Loader configuration object
  - `name` - Loader name (will be prefixed with 'stripe-')
  - `objectType` - Stripe object type (e.g., 'product', 'price')
  - `listFunction` - Function to list objects from Stripe API
  - `schema?` - Optional custom Zod schema
  - `renderItem?` - Optional function to generate HTML for each item
- `options?` - Optional Stripe API parameters for filtering

### `createQuickStripeLoader(stripe, collection, options?)`

Creates a loader for common Stripe objects with minimal configuration.

**Parameters:**

- `stripe` - Stripe instance
- `collection` - One of: 'coupons', 'invoices', 'paymentMethods', 'promotionCodes', 'setupIntents', 'paymentIntents'
- `options?` - Optional Stripe API parameters

### `stripeTsToZod<T>(objectType, validation?)`

Creates a Zod schema for a Stripe object type with optional additional validation.

**Parameters:**

- `objectType` - Stripe object type string
- `validation?` - Optional additional Zod validation rules

## License

MIT
