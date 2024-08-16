import type { Loader } from "astro/loaders";
import Stripe from "stripe";
import {
  stripeTsToZod,
  paginateStripeAPI,
  type StripeLoaderOptions,
} from "./utils";

export type StripeProductLoaderOptions =
  StripeLoaderOptions<Stripe.ProductListParams>;

export const zodSchemaFromStripeProducts = stripeTsToZod<Stripe.Product>();

export function stripeProductLoader(
  stripe: Stripe,
  options: StripeProductLoaderOptions = {}
): Loader {
  return {
    name: "stripe-product-loader",
    load: async (context) => {
      await paginateStripeAPI(
        stripe.products.list.bind(stripe.products),
        options,
        context,
        "stripe-products-last-updated"
      );
    },
    schema: zodSchemaFromStripeProducts,
  };
}
