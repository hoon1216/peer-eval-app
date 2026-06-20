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
  evaluatorName: string;
  assignmentTitle: string;
  score: number;
  comment: string;
};

export function peerEvaluationsToRows(
  assignmentTitle: string,
  evaluations: PeerEvaluation[]
): IndividualEvaluationRow[] {
  return evaluations.map((evaluation) => ({
    evaluatorName: evaluation.evaluator.name,
    assignmentTitle,
    score: evaluation.empathyScore,
    comment: mergeEvaluationComment(evaluation.reason, evaluation.suggestions),
  }));
}

export function sortIndividualEvaluationRows(rows: IndividualEvaluationRow[]) {
  return [...rows].sort((a, b) => {
    const byEvaluator = a.evaluatorName.localeCompare(b.evaluatorName, "ko");
    if (byEvaluator !== 0) return byEvaluator;
    return a.assignmentTitle.localeCompare(b.assignmentTitle, "ko");
  });
}
