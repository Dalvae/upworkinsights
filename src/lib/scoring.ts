export function computeClientScore(client: {
  totalSpent?: string | number;
  totalReviews?: number;
  totalFeedback?: number;
  isPaymentVerified?: boolean;
  totalAssignments?: number | null;
  totalJobsWithHires?: number | null;
  activeAssignments?: number | null;
  openJobs?: number | null;
}): number {
  let score = 0;

  // Payment verified: +1.5
  if (client.isPaymentVerified) score += 1.5;

  // Total spent: 0-2.5 (scaled, $10k+ = 2.5)
  const spent = typeof client.totalSpent === 'string'
    ? parseFloat(client.totalSpent) || 0
    : (client.totalSpent ?? 0);
  score += Math.min(2.5, (spent / 10000) * 2.5);

  // Total reviews: 0-1.5 (scaled, 20+ = 1.5)
  const reviews = client.totalReviews ?? 0;
  score += Math.min(1.5, (reviews / 20) * 1.5);

  // Total feedback: 0-2.5 (scaled from 0-5 rating)
  const feedback = client.totalFeedback ?? 0;
  score += (feedback / 5) * 2.5;

  // --- New buyer detail fields (only when available from detail page) ---

  // Total assignments: 0-1 (scaled, 10+ = 1)
  const assignments = client.totalAssignments;
  if (assignments != null) {
    score += Math.min(1, (assignments / 10));
  }

  // Hire rate bonus: 0-0.5 (ratio of jobs with hires / total assignments)
  const jobsWithHires = client.totalJobsWithHires;
  if (jobsWithHires != null && assignments != null && assignments > 0) {
    const hireRate = jobsWithHires / assignments;
    score += Math.min(0.5, hireRate * 0.5);
  }

  // Active assignments bonus: +0.3 if they have active contracts
  if (client.activeAssignments != null && client.activeAssignments > 0) {
    score += 0.3;
  }

  // Open jobs penalty: -0.3 if too many open jobs (5+), suggests spray-and-pray
  if (client.openJobs != null && client.openJobs >= 5) {
    score -= 0.3;
  }

  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}
