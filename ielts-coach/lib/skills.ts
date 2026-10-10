export type Skill = { code: string; name: string; criterion: string; description: string };

export const SKILLS: Skill[] = [
  { code: "TR-01", name: "Разбор задания", criterion: "Task Response", description: "Понять тип вопроса и все его части." },
  { code: "TR-02", name: "Ясная позиция", criterion: "Task Response", description: "Чётко сформулировать thesis statement и держать его до конца." },
  { code: "TR-03", name: "Развитие аргумента", criterion: "Task Response", description: "Идея → объяснение → пример." },
  { code: "CC-01", name: "Структура абзаца", criterion: "Coherence & Cohesion", description: "Одна главная мысль на абзац, topic sentence." },
  { code: "CC-02", name: "Связки и референции", criterion: "Coherence & Cohesion", description: "Естественные cohesive devices без переизбытка." },
  { code: "LR-01", name: "Точность лексики", criterion: "Lexical Resource", description: "Подбор слов и коллокаций." },
  { code: "GRA-01", name: "Сложные предложения", criterion: "Grammatical Range & Accuracy", description: "Придаточные, пассив, условные." },
  { code: "GRA-02", name: "Базовая точность", criterion: "Grammatical Range & Accuracy", description: "Времена, артикли, согласование." },
];
