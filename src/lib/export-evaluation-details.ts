import {
  formatCompletenessScore,
  mergeEvaluationComment,
} from "@/lib/evaluation-labels";

type PeerEvaluationScore = {
  empathyScore: number;
  evaluator: { name: string };
};

type PeerEvaluation = PeerEvaluationScore & {
  reason: string;
  suggestions: string;
};

export function formatPeerEvaluationScoreEntry(evaluation: PeerEvaluationScore) {
  return `${evaluation.evaluator.name} | ${formatCompletenessScore(evaluation.empathyScore)}`;
}

export function formatPeerEvaluationScoresList(
  evaluations: PeerEvaluationScore[]
) {
  return evaluations.map(formatPeerEvaluationScoreEntry).join("\n");
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
