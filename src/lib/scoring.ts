export function computeClientScore(client: {
  totalSpent?: string | number;
  totalReviews?: number;
  totalFeedback?: number;
  isPaymentVerified?: boolean;
}): number {
  let score = 0;

  // Payment verified: +2
  if (client.isPaymentVerified) score += 2;

  // Total spent: 0-3 (scaled, $10k+ = 3)
  const spent = typeof client.totalSpent === 'string'
    ? parseFloat(client.totalSpent) || 0
    : (client.totalSpent ?? 0);
  score += Math.min(3, (spent / 10000) * 3);

  // Total reviews: 0-2 (scaled, 20+ = 2)
  const reviews = client.totalReviews ?? 0;
  score += Math.min(2, (reviews / 20) * 2);

  // Total feedback: 0-3 (scaled from 0-5 rating)
  const feedback = client.totalFeedback ?? 0;
  score += (feedback / 5) * 3;

  return Math.round(Math.min(10, Math.max(0, score)) * 10) / 10;
}
