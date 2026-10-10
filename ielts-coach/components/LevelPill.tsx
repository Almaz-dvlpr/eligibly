import { LEVEL_LABEL, levelOf } from "@/lib/levels";
export default function LevelPill({ status, score }: { status: string; score: number }) {
  const l = levelOf(status, score);
  return <span className={`pill ${l}`}>{LEVEL_LABEL[l]}</span>;
}
