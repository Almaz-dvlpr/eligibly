export { CRITERIA } from "./skills";
import { CRITERIA } from "./skills";
export const LABELS: Record<string, string> = Object.fromEntries(CRITERIA.map((c) => [c.key, c.label]));
