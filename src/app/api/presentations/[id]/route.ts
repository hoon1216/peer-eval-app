import { auth } from "@/lib/auth";
import {
  canAccessPresentation,
  canManageOwnAssignment,
  canLeadProfessorEvaluate,
  isLeadProfessor,
  isObserverProfessor,
  userCanAccessCourse,
} from "@/lib/permissions";
import { findMyEvaluation } from "@/lib/evaluation-persistence";
import {
  leadEvaluationFromPresentation,
  observerEvaluationFromPresentation,
} from "@/lib/professor-evaluation-display";
import {
  mergeProfessorFields,
  updatePresentationProfessorFields,
} from "@/lib/presentation-professor-fields";
import { prisma } from "@/lib/prisma";
import { presentationPdfFileExists } from "@/lib/presentation-pdf-storage";
import { saveProfessorEvaluation } from "@/lib/save-professor-evaluation";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    return await getPresentation(_request, { params });
  } catch (err) {
    console.error("GET /api/presentations/[id] failed:", err);
    return NextResponse.json(
      {
        error:
          "발표 정보를 불러오지 못했습니다. 개발 서버를 재시작한 뒤 npm run db:generate를 실행해 주세요.",
      },
      { status: 500 }
    );
  }
}

async function getPresentation(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: {
      course: true,
      presenter: { select: { id: true, name: true, studentId: true } },
    },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canAccessPresentation(
    presentation,
    session.user.id,
    session.user.role
  );
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hasPresentationPdf = await presentationPdfFileExists(
    presentation.presentationPdfPath
  );

  const myEvaluation = await findMyEvaluation(id, session.user.id);
  const hasSubmittedEvaluation = myEvaluation?.isDraft === false;

  const withProfessorFields = await mergeProfessorFields(presentation, id);
  const observerEvaluation =
    observerEvaluationFromPresentation(withProfessorFields);
  const leadEvaluation = leadEvaluationFromPresentation(withProfessorFields);

  const isLead =
    isLeadProfessor(session.user.role) &&
    presentation.course.professorId === session.user.id;

  const professorEvaluation = isLead
    ? leadEvaluation
    : isObserverProfessor(session.user.role)
      ? observerEvaluation
      : observerEvaluation;

  return NextResponse.json({
    ...withProfessorFields,
    myEvaluation,
    hasSubmittedEvaluation,
    hasEvaluated: hasSubmittedEvaluation,
    isPresenter: presentation.presenterId === session.user.id,
    hasPresentationPdf,
    isAssignmentReady:
      Boolean(presentation.title?.trim()) &&
      Boolean(presentation.overview?.trim()),
    observerEvaluation,
    leadEvaluation,
    professorEvaluation,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    return await patchPresentation(request, { params });
  } catch (err) {
    console.error("PATCH /api/presentations/[id] failed:", err);
    return NextResponse.json(
      { error: "저장 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function patchPresentation(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    include: { course: true },
  });

  if (!presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const evaluationRole = body.evaluationRole;

  if (evaluationRole === "observer" && isObserverProfessor(session.user.role)) {
    const canEdit = await userCanAccessCourse(
      presentation.courseId,
      session.user.id,
      session.user.role
    );
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const assignmentReady =
      Boolean(presentation.title?.trim()) &&
      Boolean(presentation.overview?.trim());
    if (!assignmentReady) {
      return NextResponse.json(
        { error: "과제가 등록된 발표만 평가할 수 있습니다." },
        { status: 400 }
      );
    }
    const result = await saveProfessorEvaluation(id, "observer", body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const refreshed = await prisma.presentation.findUnique({ where: { id } });
    if (!refreshed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const withProfessorFields = await mergeProfessorFields(refreshed, id);
    return NextResponse.json({
      ...withProfessorFields,
      professorEvaluation: result.professorEvaluation,
    });
  }

  if (
    evaluationRole === "lead" &&
    canLeadProfessorEvaluate(
      session.user.role,
      presentation.course.professorId,
      session.user.id
    )
  ) {
    const assignmentReady =
      Boolean(presentation.title?.trim()) &&
      Boolean(presentation.overview?.trim());
    if (!assignmentReady) {
      return NextResponse.json(
        { error: "과제가 등록된 발표만 평가할 수 있습니다." },
        { status: 400 }
      );
    }
    const result = await saveProfessorEvaluation(id, "lead", body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const refreshed = await prisma.presentation.findUnique({ where: { id } });
    if (!refreshed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const withProfessorFields = await mergeProfessorFields(refreshed, id);
    return NextResponse.json({
      ...withProfessorFields,
      professorEvaluation: result.professorEvaluation,
    });
  }

  const parseScore = (value: unknown) =>
    value === null || value === "" || value === undefined ? null : Number(value);

  if (
    isLeadProfessor(session.user.role) &&
    presentation.course.professorId === session.user.id
  ) {
    const professorScore = parseScore(body.professorScore);
    const observerProfessorScore = parseScore(body.observerProfessorScore);
    const professorComment =
      body.professorComment !== undefined
        ? String(body.professorComment).trim() || null
        : undefined;
    const observerProfessorComment =
      body.observerProfessorComment !== undefined
        ? String(body.observerProfessorComment).trim() || null
        : undefined;

    for (const [label, score] of [
      ["담당 교수", professorScore],
      ["참관 교수", observerProfessorScore],
    ] as const) {
      if (score !== null && (score < 0 || score > 10)) {
        return NextResponse.json(
          { error: `${label} 점수는 0~10 사이여야 합니다.` },
          { status: 400 }
        );
      }
    }

    const updated = await updatePresentationProfessorFields(id, {
      professorScore,
      observerProfessorScore,
      professorComment,
      observerProfessorComment,
      status:
        typeof body.status === "string"
          ? (body.status as (typeof presentation)["status"])
          : undefined,
    });
    return NextResponse.json(updated);
  }

  if (
    !canManageOwnAssignment(session.user.role) ||
    presentation.presenterId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const title = String(body.title ?? "").trim();
  const overview = String(body.overview ?? "").trim();

  if (!title || !overview) {
    return NextResponse.json({ error: "제목과 개요를 모두 입력해주세요." }, { status: 400 });
  }

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      title,
      overview,
      status: "READY",
    },
  });

  return NextResponse.json(updated);
}
