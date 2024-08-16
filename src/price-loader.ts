import type { Loader } from "astro/loaders";
import Stripe from "stripe";
import {
  stripeTsToZod,
  paginateStripeAPI,
  type StripeLoaderOptions,
} from "./utils";

export type StripePriceLoaderOptions =
  StripeLoaderOptions<Stripe.PriceListParams>;

const zodSchemaFromStripePrices = stripeTsToZod<Stripe.Price>();

export function stripePriceLoader(
  stripe: Stripe,
  options: StripePriceLoaderOptions = {}
): Loader {
  return {
    name: "stripe-price-loader",
    load: async (context) => {
      await paginateStripeAPI<Stripe.Price, Stripe.PriceListParams>(
        stripe.prices.list.bind(stripe.prices),
        options,
        context,
        "stripe-prices-last-updated"
      );
    },
    schema: zodSchemaFromStripePrices,
  };
}

export { zodSchemaFromStripePrices };
