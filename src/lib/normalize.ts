import type { RawUpworkJob, Job } from '../types';
import { parseTier, parseEngagement, parseJobType, parseProposalsTier } from './constants';
import { computeClientScore } from './scoring';

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** Countries to silently reject during ingest. */
export const BLOCKED_COUNTRIES = new Set(['India', 'Israel']);

/** Maps ISO 3166-1 alpha-2/alpha-3 codes and common aliases to canonical country names. */
const COUNTRY_ALIASES: Record<string, string> = {
  'US': 'United States', 'USA': 'United States',
  'GB': 'United Kingdom', 'GBR': 'United Kingdom', 'UK': 'United Kingdom',
  'DE': 'Germany', 'DEU': 'Germany',
  'NL': 'Netherlands', 'NLD': 'Netherlands',
  'HU': 'Hungary', 'HUN': 'Hungary',
  'PK': 'Pakistan', 'PAK': 'Pakistan',
  'SG': 'Singapore', 'SGP': 'Singapore',
  'IN': 'India', 'IND': 'India',
  'AU': 'Australia', 'AUS': 'Australia',
  'CA': 'Canada', 'CAN': 'Canada',
  'FR': 'France', 'FRA': 'France',
  'IL': 'Israel', 'ISR': 'Israel',
  'IT': 'Italy', 'ITA': 'Italy',
  'ES': 'Spain', 'ESP': 'Spain',
  'BR': 'Brazil', 'BRA': 'Brazil',
  'MX': 'Mexico', 'MEX': 'Mexico',
  'JP': 'Japan', 'JPN': 'Japan',
  'CN': 'China', 'CHN': 'China',
  'KR': 'South Korea', 'KOR': 'South Korea',
  'PH': 'Philippines', 'PHL': 'Philippines',
  'EG': 'Egypt', 'EGY': 'Egypt',
  'PL': 'Poland', 'POL': 'Poland',
  'CY': 'Cyprus', 'CYP': 'Cyprus',
  'CZ': 'Czech Republic', 'CZE': 'Czech Republic',
  'AT': 'Austria', 'AUT': 'Austria',
  'CH': 'Switzerland', 'CHE': 'Switzerland',
  'ZA': 'South Africa', 'ZAF': 'South Africa',
  'KW': 'Kuwait', 'KWT': 'Kuwait',
  'TH': 'Thailand', 'THA': 'Thailand',
  'UA': 'Ukraine', 'UKR': 'Ukraine',
  'RO': 'Romania', 'ROU': 'Romania',
  'BD': 'Bangladesh', 'BGD': 'Bangladesh',
  'NG': 'Nigeria', 'NGA': 'Nigeria',
  'AR': 'Argentina', 'ARG': 'Argentina',
  'CO': 'Colombia', 'COL': 'Colombia',
  'SE': 'Sweden', 'SWE': 'Sweden',
  'NO': 'Norway', 'NOR': 'Norway',
  'DK': 'Denmark', 'DNK': 'Denmark',
  'FI': 'Finland', 'FIN': 'Finland',
  'PT': 'Portugal', 'PRT': 'Portugal',
  'IE': 'Ireland', 'IRL': 'Ireland',
  'NZ': 'New Zealand', 'NZL': 'New Zealand',
  'AE': 'United Arab Emirates', 'ARE': 'United Arab Emirates', 'UAE': 'United Arab Emirates',
  'SA': 'Saudi Arabia', 'SAU': 'Saudi Arabia',
  'HK': 'Hong Kong', 'HKG': 'Hong Kong',
};

function normalizeCountry(country: string | undefined | null): string | null {
  if (!country) return null;
  const trimmed = country.trim();
  return COUNTRY_ALIASES[trimmed.toUpperCase()] || COUNTRY_ALIASES[trimmed] || trimmed;
}

export function normalizeJob(raw: RawUpworkJob, sourceUrl?: string | null, searchQuery?: string | null): Job {
  const jobType = parseJobType(raw.type);

  return {
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
    client_country: normalizeCountry(raw.client?.location?.country),
    client_payment_verified: raw.client?.isPaymentVerified || false,
    client_total_spent: raw.client?.totalSpent ? (Number(raw.client.totalSpent.replace(/[^0-9.]/g, '')) || null) : null,
    client_total_reviews: raw.client?.totalReviews ?? 0,
    client_total_feedback: raw.client?.totalFeedback ?? null,
    client_quality_score: computeClientScore({
      totalSpent: raw.client?.totalSpent,
      totalReviews: raw.client?.totalReviews,
      totalFeedback: raw.client?.totalFeedback,
      isPaymentVerified: raw.client?.isPaymentVerified,
      totalAssignments: raw.clientTotalAssignments,
      totalJobsWithHires: raw.clientTotalJobsWithHires,
      activeAssignments: raw.clientActiveAssignments,
      openJobs: raw.clientOpenJobs,
    }),
    source_url: sourceUrl || null,
    search_query: searchQuery || null,
    job_status: raw.status || null,
    total_hired: raw.clientActivity?.totalHired ?? 0,
    total_applicants: raw.clientActivity?.totalApplicants ?? null,
    total_invited_to_interview: raw.clientActivity?.totalInvitedToInterview ?? 0,
    invitations_sent: raw.clientActivity?.invitationsSent ?? 0,
    unanswered_invites: raw.clientActivity?.unansweredInvites ?? 0,
    last_buyer_activity: raw.clientActivity?.lastBuyerActivity || null,
    client_total_assignments: raw.clientTotalAssignments ?? null,
    client_active_assignments: raw.clientActiveAssignments ?? null,
    client_total_jobs_with_hires: raw.clientTotalJobsWithHires ?? null,
    client_open_jobs: raw.clientOpenJobs ?? null,
    qualifications: raw.qualifications ?? null,
    segmentation_data: raw.segmentationData ?? null,
    tools: raw.tools ?? null,
    qualification_matches: raw.qualificationMatches ?? null,
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
