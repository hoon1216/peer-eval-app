import {
  getProfessorFields,
  updatePresentationProfessorFields,
  type ProfessorFieldValues,
} from "@/lib/presentation-professor-fields";
import {
  isProfessorEvaluationSubmitted,
  leadEvaluationFromPresentation,
  observerEvaluationFromPresentation,
  type ProfessorEvaluationFormValues,
} from "@/lib/professor-evaluation-display";

export type ProfessorEvalRole = "observer" | "lead";

function parseEmpathyScore(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n) || n < 1 || n > 10) return null;
  return Math.round(n);
}

export async function saveProfessorEvaluation(
  presentationId: string,
  role: ProfessorEvalRole,
  body: Record<string, unknown>
): Promise<{ error?: string; professorEvaluation?: ProfessorEvaluationFormValues }> {
  const isDraft = body.draft === true;
  const empathyScore = parseEmpathyScore(body.empathyScore);
  const reason = String(body.reason ?? "").trim();
  const suggestions = String(body.suggestions ?? "").trim();

  const current = await getProfessorFields(presentationId);
  const currentEval =
    role === "observer"
      ? observerEvaluationFromPresentation(current)
      : leadEvaluationFromPresentation(current);

  if (isProfessorEvaluationSubmitted(currentEval)) {
    return { error: "이미 평가를 제출했습니다. 제출 후에는 수정할 수 없습니다." };
  }

  if (!isDraft) {
    if (empathyScore === null) {
      return { error: "공감도 점수를 선택해주세요." };
    }
    if (!reason) {
      return { error: "평가 이유를 입력해주세요." };
    }
    if (!suggestions) {
      return { error: "개선점 및 아이디어를 입력해주세요." };
    }
  }

  const score = empathyScore ?? currentEval.empathyScore ?? 5;

  const update: Partial<ProfessorFieldValues> =
    role === "observer"
      ? {
          observerProfessorScore: score,
          observerProfessorReason: reason,
          observerProfessorSuggestions: suggestions,
          observerProfessorComment: null,
          observerEvaluationIsDraft: isDraft,
        }
      : {
          professorScore: score,
          professorReason: reason,
          professorSuggestions: suggestions,
          professorComment: null,
          professorEvaluationIsDraft: isDraft,
        };

  await updatePresentationProfessorFields(presentationId, update);

  const saved = await getProfessorFields(presentationId);
  const professorEvaluation =
    role === "observer"
      ? observerEvaluationFromPresentation(saved)
      : leadEvaluationFromPresentation(saved);

  return { professorEvaluation };
}
