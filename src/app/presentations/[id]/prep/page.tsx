"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Presentation = {
  id: string;
  courseId: string;
  title: string | null;
  overview: string | null;
  status: string;
  hasPresentationPdf?: boolean;
  presenter: { name: string; studentId: string | null };
};

export default function PrepPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [title, setTitle] = useState("");
  const [overview, setOverview] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEdit =
    Boolean(presentation?.title?.trim()) && Boolean(presentation?.overview?.trim());

  useEffect(() => {
    fetch(`/api/presentations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPresentation(data);
        setTitle(data.title ?? "");
        setOverview(data.overview ?? "");
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("overview", overview);
    if (pdfFile) formData.append("pdf", pdfFile);
    if (removePdf) formData.append("removePdf", "true");

    const res = await fetch(`/api/presentations/${id}/assignment`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "제출에 실패했습니다.");
      return;
    }

    if (!presentation) return;
    router.push(`/dashboard/courses/${presentation.courseId}`);
    router.refresh();
  }

  if (!presentation) {
    return <div className="mx-auto max-w-2xl px-4 py-10">불러오는 중...</div>;
  }

  const showExistingPdf =
    presentation.hasPresentationPdf && !removePdf && !pdfFile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← 이전 화면
      </button>
      <h1 className="mt-4 text-2xl font-bold">
        {isEdit ? "등록 과제 편집" : "발표 개요 제출"}
      </h1>
      <p className="mt-2 text-zinc-600">
        제목과 개요는 필수입니다. 발표 PDF는 선택 사항이며, 없어도 과제 등록이
        완료됩니다.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
      >
        <div>
          <label className="block text-sm font-medium">발표 제목</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="프로젝트 제목을 입력하세요"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">발표 개요</label>
          <textarea
            required
            rows={8}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="프로젝트 배경, 목표, 핵심 내용, 기대 효과 등을 작성하세요"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            발표 PDF 첨부{" "}
            <span className="font-normal text-zinc-500">(선택)</span>
          </label>
          {showExistingPdf && (
            <p className="mt-2 text-sm text-zinc-600">
              현재 PDF가 첨부되어 있습니다.{" "}
              <a
                href={`/api/presentations/${id}/presentation-pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                미리보기
              </a>
            </p>
          )}
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPdfFile(file);
              if (file) setRemovePdf(false);
            }}
            className="mt-2 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
          />
          {showExistingPdf && (
            <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={removePdf}
                onChange={(e) => setRemovePdf(e.target.checked)}
              />
              기존 PDF 삭제
            </label>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || presentation.status === "CLOSED"}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "저장 중..." : isEdit ? "과제 저장" : "과제 등록"}
        </button>
      </form>
    </div>
  );
}
