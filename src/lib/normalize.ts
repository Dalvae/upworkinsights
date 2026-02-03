import type { RawUpworkJob, Job } from '../types';
import { parseTier, parseEngagement, parseJobType } from './constants';
import { computeClientScore } from './scoring';

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseProposalsTier(raw: string | null): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('lessthan5') || lower.includes('less_than_5')) return 'Less than 5';
  if (lower.includes('5to10') || lower.includes('5_to_10')) return '5 to 10';
  if (lower.includes('10to15') || lower.includes('10_to_15')) return '10 to 15';
  if (lower.includes('15to20') || lower.includes('15_to_20')) return '15 to 20';
  if (lower.includes('20to50') || lower.includes('20_to_50')) return '20 to 50';
  if (lower.includes('50plus') || lower.includes('50_plus') || lower.includes('50+')) return '50+';
  // Already human-readable
  if (/^\d/.test(raw) || raw.startsWith('Less')) return raw;
  return raw;
}

export function normalizeJob(raw: RawUpworkJob, sourceUrl?: string | null, searchQuery?: string | null): Job {
  const jobType = parseJobType(raw.type);

  return {
    id: parseInt(raw.uid),
    ciphertext: raw.ciphertext,
    title: stripHtml(raw.title),
    description: stripHtml(raw.description),
    created_on: raw.createdOn,
    published_on: raw.publishedOn,
    job_type: jobType,
    duration: raw.durationLabel || null,
    engagement: parseEngagement(raw.engagement),
    fixed_budget: jobType === 'fixed' ? (raw.amount?.amount || null) : null,
    hourly_min: raw.hourlyBudget?.min && raw.hourlyBudget.min > 0 ? raw.hourlyBudget.min : null,
    hourly_max: raw.hourlyBudget?.max && raw.hourlyBudget.max > 0 ? raw.hourlyBudget.max : null,
    tier: parseTier(raw.tierText || ''),
    proposals_tier: parseProposalsTier(raw.proposalsTier) || null,
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
