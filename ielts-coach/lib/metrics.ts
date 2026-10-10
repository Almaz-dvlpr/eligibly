// Objective text measurements. They are handed to the model as facts and used for conservative band caps.
const SUBORDINATORS = /\b(because|although|though|while|whereas|which|who|whom|whose|if|unless|when|whenever|since|where|after|before|until|so that|even if|as long as|whether)\b/i;
const STOP = new Set("the a an and or but of to in on at for with by from as is are was were be been being it this that these those they them their he she his her we our you your i my not no so if then than also very more most can could should would may might will have has had do does did people student students".split(" "));

export type Metrics = {
  words: number; sentences: number; paragraphs: number; avgSentenceWords: number;
  complexShare: number; // share of sentences containing a subordinating word (approximate)
  lexicalDiversity: number; // unique words / words, over the first 250 words so length does not distort it
  repeated: { word: string; count: number }[]; // content words used 4+ times
};

export function textMetrics(essay: string): Metrics {
  const sentences = essay.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const words = essay.toLowerCase().match(/[a-z']+/g) ?? [];
  const first = words.slice(0, 250);
  const freq = new Map<string, number>();
  for (const w of words) if (w.length > 3 && !STOP.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  return {
    words: words.length,
    sentences: sentences.length,
    paragraphs: essay.split(/\n\s*\n/).filter((p) => p.trim()).length,
    avgSentenceWords: sentences.length ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
    complexShare: sentences.length ? Math.round((sentences.filter((s) => SUBORDINATORS.test(s)).length / sentences.length) * 100) / 100 : 0,
    lexicalDiversity: first.length ? Math.round((new Set(first).size / first.length) * 100) / 100 : 0,
    repeated: [...freq].filter(([, c]) => c >= 4).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([word, count]) => ({ word, count })),
  };
}
