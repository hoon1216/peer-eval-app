"use client";

import type { EvaluationContent } from "@/lib/evaluation-content";
import {
  collectReasons,
  collectSuggestions,
  REASON_QUESTION_LABEL,
  SUGGESTIONS_QUESTION_LABEL,
} from "@/lib/group-evaluation-content";

function QuestionAnswers({
  entries,
  emptyText = "등록된 내용이 없습니다.",
}: {
  entries: string[];
  emptyText?: string;
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">{emptyText}</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-5">
      {entries.map((text, i) => (
        <li key={i} className="text-sm leading-relaxed text-zinc-700">
          {text}
        </li>
      ))}
    </ul>
  );
}

export function GroupedEvaluationContent({
  items,
}: {
  items: EvaluationContent[];
}) {
  const reasons = collectReasons(items);
  const suggestions = collectSuggestions(items);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-zinc-200 p-3">
        <p className="text-sm font-semibold text-zinc-800">
          1. {REASON_QUESTION_LABEL}
        </p>
        <div className="mt-2">
          <QuestionAnswers entries={reasons} />
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200 p-3">
        <p className="text-sm font-semibold text-zinc-800">
          2. {SUGGESTIONS_QUESTION_LABEL}
        </p>
        <div className="mt-2">
          <QuestionAnswers entries={suggestions} />
        </div>
      </div>
    </div>
  );
}
