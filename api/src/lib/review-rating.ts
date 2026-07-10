/** Pure helpers for review aggregates. */

export function averageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

export function isValidReviewTarget(hotelId?: string | null, tourId?: string | null): boolean {
  const h = Boolean(hotelId);
  const t = Boolean(tourId);
  return (h || t) && !(h && t);
}
