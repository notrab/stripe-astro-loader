import { z } from "astro/zod";
import { AstroError } from "astro/errors";
import type { Loader } from "astro/loaders";
import Stripe from "stripe";

export function stripeTsToZod<T>() {
  return z.custom<T>(() => true) as z.ZodType<T>;
}

export type StripeLoaderOptions<T> = T & {
  limit?: number;
};

export async function paginateStripeAPI<
  T extends { id: string; created: number },
  P
>(
  listFunction: (params: P) => Promise<Stripe.ApiList<T>>,
  options: StripeLoaderOptions<P>,
  context: Parameters<Loader["load"]>[0],
  metaKey: string,
  renderItem?: (item: T) => string | null
): Promise<T[]> {
  const { logger, parseData, store, meta, generateDigest } = context;
  const { limit = Infinity, ...queryParams } = options;

  let allItems: T[] = [];
  let hasMore = true;
  let lastId: string | undefined;

  const lastUpdated = meta.get(metaKey);

  if (lastUpdated) {
    // @ts-expect-error
    queryParams.created = { gt: parseInt(lastUpdated) };
  }

  while (hasMore && allItems.length < limit) {
    const params = {
      ...queryParams,
      limit: Math.min(100, limit - allItems.length),
      starting_after: lastId,
    } as P;

    try {
      const response = await listFunction(params);

      for (const item of response.data) {
        if (allItems.length >= limit) break;

        const data = await parseData({ id: item.id, data: item });
        const digest = generateDigest(data);

        const storeItem: {
          id: string;
          data: any;
          digest: string | number;
          rendered?: { html: string };
        } = {
          id: item.id,
          data,
          digest,
        };

        if (renderItem) {
          const renderedHtml = renderItem(item);
          if (renderedHtml) {
            storeItem.rendered = { html: renderedHtml };
          }
        }

        const changed = store.set(storeItem);

        if (changed) {
          logger.debug(`Updated item: ${item.id}`);
        }

        allItems.push(item);
      }

      hasMore = response.has_more && allItems.length < limit;
      lastId = response.data[response.data.length - 1]?.id;

      if (response.data.length > 0) {
        const latestUpdated = Math.max(
          ...response.data.map((item) => item.created)
        );
        meta.set(metaKey, latestUpdated.toString());
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AstroError(`Stripe API error: ${error.message}`);
      }
      throw error;
    }

    logger.info(`Loaded ${allItems.length} items from Stripe so far`);
  }

  logger.info(`Finished loading ${allItems.length} items from Stripe`);

  return allItems;
}
