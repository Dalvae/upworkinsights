import type { RawUpworkJob, Job } from '../types';
import { parseTier, parseEngagement, parseJobType, parseProposalsTier } from './constants';
import { computeClientScore } from './scoring';

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
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
    client_country: raw.client?.location?.country || null,
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
