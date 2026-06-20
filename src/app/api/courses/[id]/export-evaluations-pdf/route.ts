import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import {
  peerEvaluationsToRows,
  sortIndividualEvaluationRows,
} from "@/lib/export-evaluation-details";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import { IndividualEvaluationsPdfDocument } from "@/lib/pdf/individual-evaluations-document";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    return await exportEvaluationsPdf(_request, { params });
  } catch (err) {
    console.error("GET /export-evaluations-pdf failed:", err);
    return NextResponse.json(
      { error: "PDF 생성 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function exportEvaluationsPdf(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const allowed = await userCanAccessCourse(
    id,
    session.user.id,
    session.user.role
  );
  if (!allowed || !canViewCourseResults(session.user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const presentations = await prisma.presentation.findMany({
    where: { courseId: id },
    select: {
      title: true,
      evaluations: {
        select: {
          empathyScore: true,
          reason: true,
          suggestions: true,
          isDraft: true,
          evaluator: { select: { name: true } },
        },
      },
    },
  });

  const rows = sortIndividualEvaluationRows(
    presentations.flatMap((presentation) =>
      peerEvaluationsToRows(
        presentation.title?.trim() || "미등록",
        submittedEvaluations(presentation.evaluations)
      )
    )
  );

  const buffer = await renderToBuffer(
    IndividualEvaluationsPdfDocument({
      courseName: course.name,
      semester: course.semester,
      rows,
    })
  );

  const filename = encodeURIComponent(`${course.name}_개별평가내역.pdf`);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
