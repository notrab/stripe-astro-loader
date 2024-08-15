import { z } from "zod";
import type { Loader } from "astro/loaders";
import { AstroError } from "astro/errors";
import Stripe from "stripe";

export interface StripeProductLoaderOptions {
  secretKey: string;
  queryParams?: Stripe.ProductListParams;
  maxProducts?: number;
}

function stripeTsToZod<T>() {
  return z.custom<T>(() => true) as z.ZodType<T>;
}

const zodSchemaFromStripeProducts = stripeTsToZod<Stripe.Product>();

export function stripeProductLoader({
  secretKey,
  queryParams = {},
  maxProducts = Infinity,
}: StripeProductLoaderOptions): Loader {
  if (!secretKey) {
    throw new AstroError("Stripe secret key is required");
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });

  return {
    name: "stripe-product-loader",
    load: async ({ logger, parseData, store }) => {
      logger.info("Loading products from Stripe");

      let allProducts: Stripe.Product[] = [];
      let hasMore = true;
      let starting_after: string | undefined;

      while (hasMore && allProducts.length < maxProducts) {
        const params: Stripe.ProductListParams = {
          ...queryParams,
          limit: Math.min(100, maxProducts - allProducts.length),
          starting_after,
        };

        const response = await stripe.products.list(params);

        for (const product of response.data) {
          if (allProducts.length >= maxProducts) break;

          const data = await parseData({
            id: product.id,
            data: product as any,
          });

          store.set({ id: product.id, data });
          allProducts.push(product);
        }

        hasMore = response.has_more && allProducts.length < maxProducts;
        starting_after = response.data[response.data.length - 1]?.id;

        logger.info(`Loaded ${allProducts.length} products from Stripe so far`);
      }
      logger.info(
        `Finished loading ${allProducts.length} products from Stripe`,
      );
    },
    schema: zodSchemaFromStripeProducts,
  };
}
