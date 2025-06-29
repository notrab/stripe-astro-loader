import type { Loader } from "astro/loaders";
import Stripe from "stripe";
import {
  stripeTsToZod,
  paginateStripeAPI,
  type StripeLoaderOptions,
} from "./utils";

export type StripePlanLoaderOptions =
  StripeLoaderOptions<Stripe.PlanListParams>;

export const zodSchemaFromStripePlans = stripeTsToZod<Stripe.Plan>();

export function stripePlanLoader(
  stripe: Stripe,
  options: StripePlanLoaderOptions = {}
): Loader {
  return {
    name: "stripe-plan-loader",
    load: async (context) => {
      await paginateStripeAPI<Stripe.Plan, Stripe.PlanListParams>(
        stripe.plans.list.bind(stripe.plans),
        options,
        context,
        "stripe-plans-last-updated",
        (plan) => plan.nickname || null
      );
    },
    schema: zodSchemaFromStripePlans,
  };
}
