import type { EvaluationContent } from "@/lib/evaluation-content";

export const REASON_QUESTION_LABEL = "평가 이유";
export const SUGGESTIONS_QUESTION_LABEL = "개선점 및 아이디어 제안";

export function collectReasons(items: EvaluationContent[]): string[] {
  return items.map((item) => item.reason.trim()).filter(Boolean);
}

export function collectSuggestions(items: EvaluationContent[]): string[] {
  return items.map((item) => item.suggestions.trim()).filter(Boolean);
}

export function hasGroupedEvaluationContent(items: EvaluationContent[]) {
  return (
    collectReasons(items).length > 0 || collectSuggestions(items).length > 0
  );
}

export function mergeProfessorEvaluationItems(
  observer: EvaluationContent | null,
  professor: EvaluationContent | null
): EvaluationContent[] {
  const items: EvaluationContent[] = [];
  if (observer) items.push(observer);
  if (professor) items.push(professor);
  return items;
}
