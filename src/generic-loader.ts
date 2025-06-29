import type { Loader } from "astro/loaders";
import type Stripe from "stripe";
import { paginateStripeAPI, type StripeLoaderOptions } from "./utils";
import { stripeTsToZod } from "./schemas";
import { z } from "astro/zod";

/**
 * Configuration for creating a Stripe loader
 */
export interface StripeLoaderConfig<
  T extends { id: string; created: number } & Record<string, any>,
  P extends Record<string, any>
> {
  /** Name of the loader (will be prefixed with 'stripe-') */
  name: string;
  /** Stripe object type (e.g., 'product', 'price', 'customer') */
  objectType: string;
  /** Function to list objects from Stripe API */
  listFunction: (params: P) => Promise<Stripe.ApiList<T>>;
  /** Optional custom Zod schema validation rules */
  schema?: z.ZodType<T>;
  /** Optional function to generate rendered content for each item */
  renderItem?: (item: T) => string | null;
}

/**
 * Creates a Stripe loader with minimal configuration
 *
 * This is the main function for creating Stripe loaders. It handles the most common
 * use cases with sensible defaults while allowing customization when needed.
 *
 * @example
 * // Simple usage - auto-generates schema
 * const couponLoader = createStripeLoader(stripe, {
 *   name: 'coupon',
 *   objectType: 'coupon',
 *   listFunction: stripe.coupons.list.bind(stripe.coupons)
 * });
 *
 * @example
 * // With custom schema
 * const productLoader = createStripeLoader(stripe, {
 *   name: 'product',
 *   objectType: 'product',
 *   listFunction: stripe.products.list.bind(stripe.products),
 *   schema: stripeProductSchema,
 *   renderItem: (product) => product.description || null
 * });
 */
export function createStripeLoader<
  T extends { id: string; created: number } & Record<string, any>,
  P extends Record<string, any> = Record<string, any>
>(
  stripe: Stripe,
  config: StripeLoaderConfig<T, P>,
  options: StripeLoaderOptions<P> = {} as StripeLoaderOptions<P>
): Loader {
  const { name, objectType, listFunction, schema, renderItem } = config;

  // Use provided schema or generate one automatically
  const loaderSchema = schema || stripeTsToZod<T>(objectType);

  return {
    name: `stripe-${name}-loader`,
    load: async (context) => {
      await paginateStripeAPI<T, P>(
        listFunction,
        options,
        context,
        `stripe-${name}s-last-updated`,
        renderItem
      );
    },
    schema: loaderSchema,
  };
}

/**
 * Quick loader creation for common Stripe objects
 *
 * This function provides shortcuts for the most commonly used Stripe objects,
 * automatically setting up the correct list function and object type.
 *
 * @example
 * const couponLoader = createQuickStripeLoader(stripe, 'coupons');
 * const invoiceLoader = createQuickStripeLoader(stripe, 'invoices', { limit: 50 });
 */
export function createQuickStripeLoader(
  stripe: Stripe,
  stripeCollection: keyof Pick<
    Stripe,
    | "coupons"
    | "invoices"
    | "paymentMethods"
    | "promotionCodes"
    | "setupIntents"
    | "paymentIntents"
  >,
  options: StripeLoaderOptions<any> = {} as StripeLoaderOptions<any>
): Loader {
  // Map collection names to their object types and display names
  const collectionMap = {
    coupons: { objectType: "coupon", name: "coupon" },
    invoices: { objectType: "invoice", name: "invoice" },
    paymentMethods: { objectType: "payment_method", name: "payment-method" },
    promotionCodes: { objectType: "promotion_code", name: "promotion-code" },
    setupIntents: { objectType: "setup_intent", name: "setup-intent" },
    paymentIntents: { objectType: "payment_intent", name: "payment-intent" },
  };

  const config = collectionMap[stripeCollection];
  if (!config) {
    throw new Error(`Unsupported Stripe collection: ${stripeCollection}`);
  }

  const listFunction = (stripe[stripeCollection] as any)?.list?.bind(
    stripe[stripeCollection]
  );
  if (!listFunction) {
    throw new Error(
      `No list function found for Stripe collection: ${stripeCollection}`
    );
  }

  return createStripeLoader(
    stripe,
    {
      name: config.name,
      objectType: config.objectType,
      listFunction,
    },
    options
  );
}

/**
 * Backwards compatibility exports
 * These maintain the same API as the previous version
 */

export type GenericStripeLoaderConfig<
  T extends { id: string; created: number } & Record<string, any>,
  P extends Record<string, any>
> = StripeLoaderConfig<T, P>;
export type GenericStripeLoaderOptions<P> = StripeLoaderOptions<P>;

export const createGenericStripeLoader = createStripeLoader;
export const createTypedStripeLoader = createStripeLoader;

/**
 * Helper type to extract the Stripe object type from a loader config
 */
export type StripeObjectFromConfig<T> = T extends StripeLoaderConfig<
  infer U,
  any
>
  ? U
  : never;

/**
 * Predefined configurations for common Stripe objects (backwards compatibility)
 */
export const STRIPE_OBJECT_CONFIGS = {
  coupon: {
    name: "coupon",
    objectType: "coupon",
  },
  invoice: {
    name: "invoice",
    objectType: "invoice",
  },
  paymentMethod: {
    name: "payment-method",
    objectType: "payment_method",
  },
  promotionCode: {
    name: "promotion-code",
    objectType: "promotion_code",
  },
} as const;
