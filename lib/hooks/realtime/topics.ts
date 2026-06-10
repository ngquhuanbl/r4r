import type { Tables } from "@/types/database";

type BusinessId = Tables<"businesses">["id"];

export interface Topic<TArgs extends Record<string, unknown>> {
  getKey(args: TArgs): string;
  isThisTopic(key: string): boolean;
  getArgsFromKey(key: string): TArgs | null;
}

const REVIEWS_BUSINESS_PREFIX = "reviews:business:";
const REVIEWS_OUTGOING_BUSINESS_PREFIX = `outgoing:${REVIEWS_BUSINESS_PREFIX}`;
const REVIEWS_INCOMING_BUSINESS_PREFIX = `incoming:${REVIEWS_BUSINESS_PREFIX}`;
const REVIEWS_CHANNEL_UNHEALTHY_USER_PREFIX = "reviews:channel-unhealthy:user:";

function parseBusinessIdByKey(topicKey: string): BusinessId | null {
  const rawId = topicKey.split(":").at(-1);
  const id = Number(rawId);
  return Number.isFinite(id) ? id : null;
}

export const ReviewBusinessTopic: Topic<{ businessId: BusinessId }> = {
  getKey: ({ businessId }) => `${REVIEWS_BUSINESS_PREFIX}${businessId}`,
  isThisTopic: (key) => key.includes(REVIEWS_BUSINESS_PREFIX),
  getArgsFromKey: (key) => {
    const businessId = parseBusinessIdByKey(key);
    if (businessId == null) return null;
    return { businessId };
  },
};

export const ReviewsOutgoingBusinessTopic: Topic<{ businessId: BusinessId }> = {
  ...ReviewBusinessTopic,
  getKey: ({ businessId }) =>
    `${REVIEWS_OUTGOING_BUSINESS_PREFIX}${businessId}`,
  isThisTopic: (key) => key.startsWith(REVIEWS_OUTGOING_BUSINESS_PREFIX),
};

export const ReviewsIncomingBusinessTopic: Topic<{ businessId: BusinessId }> = {
  ...ReviewBusinessTopic,
  getKey: ({ businessId }) =>
    `${REVIEWS_INCOMING_BUSINESS_PREFIX}${businessId}`,
  isThisTopic: (key) => key.startsWith(REVIEWS_INCOMING_BUSINESS_PREFIX),
};

export const ReviewsChannelUnhealthyUserTopic: Topic<{ userId: string }> = {
  getKey: ({ userId }) => `${REVIEWS_CHANNEL_UNHEALTHY_USER_PREFIX}${userId}`,
  isThisTopic: (key) => key.startsWith(REVIEWS_CHANNEL_UNHEALTHY_USER_PREFIX),
  getArgsFromKey: (key) => {
    if (!key.startsWith(REVIEWS_CHANNEL_UNHEALTHY_USER_PREFIX)) return null;
    const userId = key.slice(REVIEWS_CHANNEL_UNHEALTHY_USER_PREFIX.length);
    if (userId.length === 0) return null;
    return { userId };
  },
};

export const realtimeTopic = {
  reviewsBusiness: ReviewBusinessTopic,
  reviewsOutgoingBusiness: ReviewsOutgoingBusinessTopic,
  reviewsIncomingBusiness: ReviewsIncomingBusinessTopic,
  reviewsChannelUnhealthyUser: ReviewsChannelUnhealthyUserTopic,
} as const;
