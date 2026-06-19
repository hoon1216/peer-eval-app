import {
  formatCompletenessScore,
  mergeEvaluationComment,
} from "@/lib/evaluation-labels";

type PeerEvaluation = {
  empathyScore: number;
  reason: string;
  suggestions: string;
  evaluator: { name: string };
};

export function formatPeerEvaluationEntry(evaluation: PeerEvaluation) {
  const comment = mergeEvaluationComment(
    evaluation.reason,
    evaluation.suggestions
  );
  return `${evaluation.evaluator.name} | ${formatCompletenessScore(evaluation.empathyScore)} | ${comment}`;
}

export function formatPeerEvaluationList(evaluations: PeerEvaluation[]) {
  return evaluations.map(formatPeerEvaluationEntry).join("\n");
}

export type IndividualEvaluationRow = {
  presenterName: string;
  presenterStudentId: string | null;
  score: number;
  comment: string;
};

export function peerEvaluationsToRows(
  presenterName: string,
  presenterStudentId: string | null,
  evaluations: PeerEvaluation[]
): IndividualEvaluationRow[] {
  return evaluations.map((evaluation) => ({
    presenterName,
    presenterStudentId,
    score: evaluation.empathyScore,
    comment: mergeEvaluationComment(evaluation.reason, evaluation.suggestions),
  }));
}
