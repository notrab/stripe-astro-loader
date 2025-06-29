import { z } from "astro/zod";
import type Stripe from "stripe";

/**
 * Creates a Zod schema that validates essential Stripe object properties
 * while preserving full TypeScript typing from the Stripe SDK.
 * This approach avoids manually maintaining schemas that duplicate Stripe's types.
 */
function createStripeObjectSchema<T extends Record<string, any>>(
  stripeObjectType: string,
  additionalValidation?: z.ZodRawShape
): z.ZodType<T> {
  const baseSchema = z.object({
    id: z.string(),
    object: z.literal(stripeObjectType),
    created: z.number().optional(),
    livemode: z.boolean().optional(),
    metadata: z.record(z.string()).optional(),
    ...additionalValidation,
  });

  // Use passthrough to allow all Stripe properties while validating key ones
  return baseSchema.passthrough() as unknown as z.ZodType<T>;
}

/**
 * Creates a Zod schema for any Stripe object type with optional additional validation.
 * This function provides validation for core Stripe properties while preserving
 * full TypeScript types from the Stripe SDK.
 *
 * @param stripeObjectType - The Stripe object type (e.g., 'product', 'price', 'customer')
 * @param additionalValidation - Optional additional Zod validation rules
 * @returns A Zod schema that validates the object while preserving full Stripe types
 *
 * @example
 * // Basic usage - validates core Stripe properties
 * const productSchema = stripeTsToZod<Stripe.Product>("product");
 *
 * @example
 * // With additional validation
 * const productSchema = stripeTsToZod<Stripe.Product>("product", {
 *   name: z.string().min(1),
 *   active: z.boolean(),
 *   type: z.enum(["good", "service"])
 * });
 */
export function stripeTsToZod<T extends Record<string, any>>(
  stripeObjectType: string,
  additionalValidation?: z.ZodRawShape
): z.ZodType<T> {
  return createStripeObjectSchema<T>(stripeObjectType, additionalValidation);
}

/**
 * Helper to create schemas for Stripe objects with custom validation.
 * This is an alias for stripeTsToZod for backwards compatibility.
 */
export function createCustomStripeSchema<T extends Record<string, any>>(
  objectType: string,
  validation?: z.ZodRawShape
): z.ZodType<T> {
  return stripeTsToZod<T>(objectType, validation);
}

// Export the actual Stripe types for TypeScript inference
export type StripeProduct = Stripe.Product;
export type StripePrice = Stripe.Price;
export type StripePlan = Stripe.Plan;
export type StripeCustomer = Stripe.Customer;
export type StripeSubscription = Stripe.Subscription;
export type StripeInvoice = Stripe.Invoice;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeSetupIntent = Stripe.SetupIntent;
export type StripePaymentMethod = Stripe.PaymentMethod;
export type StripeCoupon = Stripe.Coupon;
export type StripePromotionCode = Stripe.PromotionCode;
