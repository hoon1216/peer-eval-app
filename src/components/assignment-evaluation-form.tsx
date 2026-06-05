"use client";

type Props = {
  empathyScore: number;
  reason: string;
  suggestions: string;
  onEmpathyScoreChange: (value: number) => void;
  onReasonChange: (value: string) => void;
  onSuggestionsChange: (value: string) => void;
  error?: string;
  draftSaved?: boolean;
  loading?: boolean;
  draftSaving?: boolean;
  onDraft: () => void;
  readOnly?: boolean;
};

export function AssignmentEvaluationForm({
  empathyScore,
  reason,
  suggestions,
  onEmpathyScoreChange,
  onReasonChange,
  onSuggestionsChange,
  error,
  draftSaved,
  loading,
  draftSaving,
  onDraft,
  readOnly = false,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">
          1. 공감도 (10점 만점): {empathyScore}점
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={empathyScore}
          disabled={readOnly}
          onChange={(e) => onEmpathyScoreChange(Number(e.target.value))}
          className="mt-2 w-full disabled:opacity-60"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">2. 평가 이유</label>
        <textarea
          rows={4}
          value={reason}
          disabled={readOnly}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="공감도 점수를 부여한 이유를 작성해주세요"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:opacity-60"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">3. 개선점 및 아이디어 제안</label>
        <textarea
          rows={4}
          value={suggestions}
          disabled={readOnly}
          onChange={(e) => onSuggestionsChange(e.target.value)}
          placeholder="프로젝트를 발전시킬 수 있는 구체적인 제안을 작성해주세요"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 disabled:opacity-60"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {draftSaved && (
        <p className="text-sm text-emerald-700">임시저장되었습니다.</p>
      )}

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={draftSaving || loading}
            onClick={onDraft}
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
          >
            {draftSaving ? "저장 중..." : "임시저장"}
          </button>
          <button
            type="submit"
            disabled={loading || draftSaving}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "제출 중..." : "평가 제출"}
          </button>
        </div>
      )}
    </div>
  );
}
