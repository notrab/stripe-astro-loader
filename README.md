# stripe-astro-loader

Fetch data from the Stripe API and use it in Astro collections &mdash; only has **products** for now.

## Install

```bash
npm i stripe stripe-astro-loader
```

## Configure

```ts
import { defineCollection } from "astro:content";
import { stripeProductLoader } from "stripe-astro-loader";
import Stripe from "stripe";

const stripe = new Stripe("SECRET_KEY");

const products = defineCollection({
  loader: stripeProductLoader(stripe),
});

const prices = defineCollection({
  loader: stripePriceLoader(stripe),
});

export const collections = { products, prices };
```

Make sure to enable the experimental content layer in your Astro config:

```ts
import { defineConfig } from "astro/config";

export default defineConfig({
  experimental: {
    contentLayer: true,
  },
});
```

## Usage

```astro
// pages/index.astro
---
import { getCollection } from 'astro:content';

const products = await getCollection('products');
---
```

```astro
// pages/products/[id].astro
---
import { getCollection,render } from 'astro:content';

export async function getStaticPaths() {
  const products = await getCollection('products');

  return products.map(product => ({
    params: { id: product.id }, props: { product },
  }));
}

const { product } = Astro.props;
const { Content, headings } = await render(product);
---

<h1>{product.data.name}</h1>

<pre>{JSON.stringify({product, headings}, null, 2)}</pre>

<Content />
```
