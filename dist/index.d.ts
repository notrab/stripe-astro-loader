import { Loader } from 'astro/loaders';
import Stripe from 'stripe';

interface StripeProductLoaderOptions {
    secretKey: string;
    queryParams?: Stripe.ProductListParams;
    maxProducts?: number;
}
declare function stripeProductLoader({ secretKey, queryParams, maxProducts, }: StripeProductLoaderOptions): Loader;

export { type StripeProductLoaderOptions, stripeProductLoader };
