import { z } from "zod";
import { apartment, lodge, villa, type Listing } from "@/lib/markham-data";

const propertySchema = z.object({
  id: z.number(),
  name: z.string(),
  district: z.string(),
  area: z.string(),
  imageKey: z.enum(["villa", "apartment", "lodge"]),
  price: z.number(),
  rating: z.union([z.number(), z.string()]).nullable(),
  type: z.string(),
  beds: z.number(),
  guests: z.number(),
  status: z.enum(["AVAILABLE", "UPCOMING"]),
  tag: z.string(),
});

const areaAnalyticsSchema = z.object({
  metric: z.enum(["ACTIVITY", "SAFETY", "AMENITIES"]),
  illustrative: z.boolean(),
  areas: z.array(
    z.object({
      district: z.string(),
      metric: z.string(),
      score: z.union([z.number(), z.string()]),
      summary: z.string(),
    }),
  ),
});

const pricingEventFactorSchema = z.object({
  id: z.number(),
  name: z.string(),
  multiplier: z.union([z.number(), z.string()]),
});

const pricingDecisionSchema = z.object({
  id: z.number(),
  propertyId: z.number(),
  propertyName: z.string(),
  district: z.string(),
  effectiveDate: z.string(),
  recordedAt: z.string().nullable(),
  baseRate: z.union([z.number(), z.string()]),
  seasonalMultiplier: z.union([z.number(), z.string()]),
  demandMultiplier: z.union([z.number(), z.string()]),
  eventMultiplier: z.union([z.number(), z.string()]),
  unconstrainedRate: z.union([z.number(), z.string()]),
  minimumRate: z.union([z.number(), z.string()]),
  maximumRate: z.union([z.number(), z.string()]),
  rateLimitAction: z.enum(["NONE", "FLOOR", "CAP"]),
  finalRate: z.union([z.number(), z.string()]),
  activeEvents: z.array(pricingEventFactorSchema),
});

const pricingQuoteSchema = z.object({
  propertyId: z.number(),
  nights: z.number(),
  total: z.union([z.number(), z.string()]),
  currency: z.string(),
  rates: z.array(
    z.object({
      date: z.string(),
      price: z.union([z.number(), z.string()]),
      decision: pricingDecisionSchema,
    }),
  ),
});

export type AreaAnalytics = z.infer<typeof areaAnalyticsSchema>;
export type PricingDecision = z.infer<typeof pricingDecisionSchema>;
export type PricingQuote = z.infer<typeof pricingQuoteSchema>;

const imageByKey = { villa, apartment, lodge };
const apiBaseUrl = (import.meta.env.VITE_ENGINE_API_URL ?? "http://localhost:8081/api/v1").replace(
  /\/$/,
  "",
);

export async function fetchListings(district = ""): Promise<Listing[]> {
  const url = new URL(`${apiBaseUrl}/properties`);
  if (district) url.searchParams.set("district", district);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Property service returned ${response.status}`);

  const properties = z.array(propertySchema).parse(await response.json());
  return properties.map((property) => ({
    ...property,
    image: imageByKey[property.imageKey],
    rating: property.rating === null ? "New" : String(property.rating),
    status: property.status === "AVAILABLE" ? "Available" : "Upcoming",
    source: "engine" as const,
  }));
}

export async function fetchAreaAnalytics(metric: AreaAnalytics["metric"]): Promise<AreaAnalytics> {
  const url = new URL(`${apiBaseUrl}/analytics/areas`);
  url.searchParams.set("metric", metric);

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Analytics service returned ${response.status}`);
  return areaAnalyticsSchema.parse(await response.json());
}

export async function fetchPricingQuote(
  propertyId: number,
  checkIn: string,
  checkOut: string,
): Promise<PricingQuote> {
  const url = new URL(`${apiBaseUrl}/pricing/quote`);
  url.search = new URLSearchParams({
    propertyId: String(propertyId),
    checkIn,
    checkOut,
  }).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pricing service returned ${response.status}`);
  return pricingQuoteSchema.parse(await response.json());
}

export async function fetchRecentPricingDecisions(limit = 25): Promise<PricingDecision[]> {
  const url = new URL(`${apiBaseUrl}/pricing/decisions`);
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pricing history returned ${response.status}`);
  return z.array(pricingDecisionSchema).parse(await response.json());
}
