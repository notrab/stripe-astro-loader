# stripe-astro-loader

Fetch data from the Stripe API and use it in Astro collections &mdash; only has **products** for now.

## Install

```bash
npm i stripe stripe-astro-loader
```

## Quickstart

```ts
import { defineCollection } from "astro:content";
import { stripeProductLoader } from "stripe-astro-loader";

const products = defineCollection({
  loader: stripeProductLoader({
    secretKey: "...",
  }),
});

export const collections = { products };
```
