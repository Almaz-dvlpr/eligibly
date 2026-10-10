export type CriterionKey = "task_response" | "coherence_cohesion" | "lexical_resource" | "grammatical_range_accuracy";

export type Skill = {
  code: string; name: string; criterion: CriterionKey; description: string;
  praise: string; tip: string; practice: string;
};

export const CRITERIA: { key: CriterionKey; label: string; short: string; blurb: string }[] = [
  { key: "task_response", label: "Task Response", short: "TR", blurb: "Understanding the question, a clear position, developed ideas and examples." },
  { key: "coherence_cohesion", label: "Coherence & Cohesion", short: "CC", blurb: "Logical paragraphs, a clear order of arguments, natural linking." },
  { key: "lexical_resource", label: "Lexical Resource", short: "LR", blurb: "Range and precision of vocabulary, collocations, less repetition." },
  { key: "grammatical_range_accuracy", label: "Grammatical Range & Accuracy", short: "GRA", blurb: "Variety of structures, accuracy, punctuation." },
];

export const SKILLS: Skill[] = [
  { code: "TR-01", name: "Reading the question", criterion: "task_response", description: "Understand the question type and answer every part of it.",
    praise: "You answer the question that was actually asked.", tip: "Underline every part of the question before you plan, then tick each one off in your essay.", practice: "Practise breaking a two-part question into separate points before writing." },
  { code: "TR-02", name: "Clear position", criterion: "task_response", description: "State a clear opinion and keep it consistent to the end.",
    praise: "Your position is easy to find and stays consistent.", tip: "State your opinion in the introduction and echo it in the conclusion with fresh wording.", practice: "Write a one-sentence thesis, then improve it until it names your view and your two main reasons." },
  { code: "TR-03", name: "Developing arguments", criterion: "task_response", description: "Idea → explanation → specific example.",
    praise: "Your arguments are well supported with relevant ideas.", tip: "After each main idea add one sentence of explanation and one specific example to make it more persuasive.", practice: "Take one body paragraph and extend every idea with 'because…' and 'for example…'." },
  { code: "CC-01", name: "Paragraph structure", criterion: "coherence_cohesion", description: "One main idea per paragraph, with a clear topic sentence.",
    praise: "Your paragraphs are clearly organised around one idea each.", tip: "Open each body paragraph with a topic sentence that previews its main idea.", practice: "Rewrite your body paragraphs so that each starts with a clear topic sentence." },
  { code: "CC-02", name: "Linking ideas", criterion: "coherence_cohesion", description: "Natural linking words and references, without overuse.",
    praise: "Your ideas flow naturally from one to the next.", tip: "Link ideas with a variety of devices rather than repeating the same connectors.", practice: "Replace repeated connectors with reference words (this, such, these) and a few precise linkers." },
  { code: "LR-01", name: "Precise vocabulary", criterion: "lexical_resource", description: "Word choice, collocations and avoiding repetition.",
    praise: "You use a good range of vocabulary to express your ideas.", tip: "Swap general words for more precise collocations to make your meaning sharper.", practice: "Pick five general words from your essay and replace them with precise collocations." },
  { code: "GRA-01", name: "Complex sentences", criterion: "grammatical_range_accuracy", description: "Subordinate clauses, passives, conditionals.",
    praise: "You use a good mix of sentence structures.", tip: "Practise combining short sentences into clear, complex structures.", practice: "Combine pairs of short sentences using relative clauses and conditionals." },
  { code: "GRA-02", name: "Grammatical accuracy", criterion: "grammatical_range_accuracy", description: "Tenses, articles, agreement and punctuation.",
    praise: "Most of your sentences are accurate and easy to follow.", tip: "Proofread for articles, plural forms and subject–verb agreement in the last two minutes.", practice: "Proofread one paragraph aloud, checking articles, plurals and verb agreement." },
];

export const skillByCode = (code: string) => SKILLS.find((s) => s.code === code);
