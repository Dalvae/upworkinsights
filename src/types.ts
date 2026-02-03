export interface RawUpworkJob {
  uid: string;
  ciphertext: string;
  title: string;
  description: string;
  createdOn: string;
  publishedOn: string;
  renewedOn?: string | null;
  type: number;
  durationLabel: string | null;
  engagement: string | null;
  amount: { amount: number } | null;
  client: {
    location: { country: string };
    isPaymentVerified: boolean;
    totalSpent: string;
    totalReviews: number;
    totalFeedback: number;
    hasFinancialPrivacy: boolean;
  };
  clientRelation?: Record<string, unknown> | null;
  freelancersToHire: number;
  relevanceEncoded?: string;
  enterpriseJob?: boolean;
  tierText: string;
  isApplied: boolean;
  proposalsTier: string;
  premium: boolean;
  attrs: {
    uid: string;
    parentSkillUid?: string | null;
    prefLabel: string;
    prettyName: string;
    freeText?: string | null;
    highlighted: boolean;
  }[];
  hourlyBudget: { min: number; max: number } | null;
  weeklyBudget?: { amount: number } | null;
  isSTSVectorSearchResult?: boolean | null;
  // From jobAuthDetails (job detail page)
  status?: string | null;
  clientActivity?: {
    totalHired?: number;
    totalApplicants?: number;
    totalInvitedToInterview?: number;
    invitationsSent?: number;
    unansweredInvites?: number;
    lastBuyerActivity?: string;
    numberOfPositionsToHire?: number;
  } | null;
}

export type JobType = 'fixed' | 'hourly';
export type Tier = 'expert' | 'intermediate' | 'entry';
export type EngagementType = 'full_time' | 'part_time' | null;

export interface Job {
  id?: number;
  ciphertext: string;
  title: string;
  description: string;
  created_on: string;
  published_on: string;
  first_seen_at?: string;
  last_seen_at?: string;
  job_type: JobType;
  duration: string | null;
  engagement: EngagementType;
  fixed_budget: number | null;
  hourly_min: number | null;
  hourly_max: number | null;
  tier: Tier;
  proposals_tier: string | null;
  is_premium: boolean;
  freelancers_to_hire: number;
  is_applied: boolean;
  client_country: string | null;
  client_payment_verified: boolean;
  client_total_spent: number | null;
  client_total_reviews: number;
  client_total_feedback: number | null;
  client_quality_score: number | null;
  source_url: string | null;
  search_query: string | null;
  job_status: string | null;
  total_hired: number;
  total_applicants: number | null;
  total_invited_to_interview: number;
  invitations_sent: number;
  unanswered_invites: number;
  last_buyer_activity: string | null;
}

export type JobRow = Job & { id: number; first_seen_at: string; last_seen_at: string };

export interface JobWithSkills extends JobRow {
  job_skills: { skill_uid: string; is_highlighted: boolean; skills: { uid?: string; label: string } | null }[];
}

export interface Skill {
  uid: string;
  label: string;
  job_count: number;
}

export interface JobSkill {
  job_id: number;
  skill_uid: string;
  is_highlighted: boolean;
}

export interface UserProfile {
  id: string;
  skills: string[];
  hourly_rate: number | null;
  preferred_tiers: Tier[];
  min_budget: number | null;
  api_key: string | null;
}

export interface DailyStats {
  date: string;
  total_jobs: number;
  new_jobs: number;
  avg_fixed_budget: number | null;
  top_skills: Record<string, number>;
  tier_breakdown: Record<string, number>;
}

export interface JobSnapshot {
  id: number;
  job_id: number;
  snapshot_at: string;
  proposals_tier: string | null;
  freelancers_to_hire: number;
  is_applied: boolean;
  total_hired: number | null;
  total_applicants: number | null;
}

export interface IngestPayload {
  source: string;
  alias: string;
  url: string;
  extractedAt: string;
  jobCount: number;
  jobs: RawUpworkJob[];
}

export interface JobFilters {
  tier?: Tier;
  job_type?: JobType;
  skill?: string;
  country?: string;
  q?: string;
  page?: number;
  limit?: number;
}
