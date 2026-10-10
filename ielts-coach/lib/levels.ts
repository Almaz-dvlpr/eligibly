// Skill levels are labels, not IELTS bands. Score is the system's internal 0-1 estimate.
export type Level = "developing" | "building" | "strong" | "consistent";

export const LEVEL_LABEL: Record<Level, string> = {
  developing: "Developing", building: "Building Confidence", strong: "Strong", consistent: "Consistent",
};

export function levelFor(score: number, evidenceCount: number, recentScores: number[]): Level {
  const spread = recentScores.length ? Math.max(...recentScores) - Math.min(...recentScores) : 1;
  // "Consistent" needs a high score, at least 3 essays and stable results, so one good essay is never enough.
  if (score >= 0.8 && evidenceCount >= 3 && recentScores.length >= 3 && spread <= 0.15) return "consistent";
  if (score >= 0.65) return "strong";
  if (score >= 0.45) return "building";
  return "developing";
}

// Old rows from the first version used other status keys.
const LEGACY: Record<string, Level> = { needs_practice: "developing", unassessed: "developing", stable: "consistent" };
export function levelOf(status: string | null | undefined, score = 0): Level {
  if (status && status in LEVEL_LABEL) return status as Level;
  if (status && status in LEGACY) return LEGACY[status];
  return levelFor(score, 1, []);
}

export function confidenceLabel(c: number, n: number): string {
  const v = Math.min(1, n / 4) * c;
  return v >= 0.6 ? "High" : v >= 0.3 ? "Medium" : "Low";
}

export const roundHalf = (x: number) => Math.round(x * 2) / 2;
