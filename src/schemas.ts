import { z } from "astro/zod";
import type Stripe from "stripe";

/**
 * Creates a Zod schema that preserves full TypeScript typing from the Stripe SDK
 * while providing minimal validation for essential properties.
 *
 * This approach avoids manually maintaining schemas that duplicate Stripe's types
 * and ensures that all Stripe properties are available with proper TypeScript inference.
 */
function createStripeObjectSchema<T extends Record<string, any>>(
  stripeObjectType: string,
  additionalValidation?: z.ZodRawShape
): z.ZodType<T> {
  // Create a minimal validation schema that checks essential Stripe properties
  const validationSchema = z.object({
    id: z.string(),
    object: z.literal(stripeObjectType),
    created: z.number().optional(),
    livemode: z.boolean().optional(),
    metadata: z.record(z.string()).optional(),
    ...additionalValidation,
  });

  // Return a schema that validates essential properties but allows all others
  // This preserves the full Stripe TypeScript types while ensuring data integrity
  return z.any().superRefine((data, ctx) => {
    // Basic type check
    if (typeof data !== "object" || data === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: "object",
        received: typeof data,
      });
      return;
    }

    // Validate essential properties using the validation schema
    const result = validationSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        ctx.addIssue(issue);
      });
    }
  }) as unknown as z.ZodType<T>;
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
 * // Basic usage - validates core Stripe properties, preserves all Stripe types
 * const productSchema = stripeTsToZod<Stripe.Product>("product");
 *
 * @example
 * // With additional validation for specific fields you care about
 * const productSchema = stripeTsToZod<Stripe.Product>("product", {
 *   name: z.string().min(1),
 *   active: z.boolean(),
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
