import type { RawUpworkJob, Job } from '../types';
import { parseTier, parseEngagement, parseJobType } from './constants';
import { computeClientScore } from './scoring';

export function normalizeJob(raw: RawUpworkJob, sourceUrl?: string | null, searchQuery?: string | null): Job {
  const jobType = parseJobType(raw.type);

  return {
    id: parseInt(raw.uid),
    ciphertext: raw.ciphertext,
    title: raw.title,
    description: raw.description,
    created_on: raw.createdOn,
    published_on: raw.publishedOn,
    job_type: jobType,
    duration: raw.durationLabel || null,
    engagement: parseEngagement(raw.engagement),
    fixed_budget: jobType === 'fixed' ? (raw.amount?.amount || null) : null,
    hourly_min: raw.hourlyBudget?.min && raw.hourlyBudget.min > 0 ? raw.hourlyBudget.min : null,
    hourly_max: raw.hourlyBudget?.max && raw.hourlyBudget.max > 0 ? raw.hourlyBudget.max : null,
    tier: parseTier(raw.tierText || ''),
    proposals_tier: raw.proposalsTier || null,
    is_premium: raw.premium || false,
    freelancers_to_hire: raw.freelancersToHire || 1,
    is_applied: raw.isApplied || false,
    client_country: raw.client?.location?.country || null,
    client_payment_verified: raw.client?.isPaymentVerified || false,
    client_total_spent: parseFloat(raw.client?.totalSpent) || null,
    client_total_reviews: raw.client?.totalReviews || 0,
    client_total_feedback: raw.client?.totalFeedback || null,
    client_quality_score: computeClientScore({
      totalSpent: raw.client?.totalSpent,
      totalReviews: raw.client?.totalReviews,
      totalFeedback: raw.client?.totalFeedback,
      isPaymentVerified: raw.client?.isPaymentVerified,
    }),
    source_url: sourceUrl || null,
    search_query: searchQuery || null,
  };
}

export function extractSkills(raw: RawUpworkJob): { uid: string; label: string; is_highlighted: boolean }[] {
  if (!raw.attrs || !Array.isArray(raw.attrs)) return [];
  return raw.attrs.map((attr) => ({
    uid: attr.uid,
    label: attr.prettyName || attr.prefLabel,
    is_highlighted: attr.highlighted || false,
  }));
}
