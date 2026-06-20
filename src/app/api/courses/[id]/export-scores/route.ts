import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import {
  buildExportColumnLayout,
  peerAverageFormula,
  rankFormula,
  weightedFinalFormula,
} from "@/lib/export-spreadsheet";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import {
  submittedLeadScore,
  submittedObserverScore,
} from "@/lib/professor-evaluation-display";
import { mergeProfessorFieldsBatch } from "@/lib/presentation-professor-fields";
import { sortPresentationsByPresenterName } from "@/lib/sort-presentations";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function collectEvaluators(
  presentations: {
    evaluations: {
      empathyScore: number;
      isDraft?: boolean;
      evaluator: { name: string };
    }[];
  }[]
) {
  const names = new Set<string>();
  for (const presentation of presentations) {
    for (const evaluation of submittedEvaluations(presentation.evaluations)) {
      names.add(evaluation.evaluator.name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, "ko"));
}

function peerScoreByEvaluator(
  evaluations: {
    empathyScore: number;
    isDraft?: boolean;
    evaluator: { name: string };
  }[]
) {
  const map = new Map<string, number>();
  for (const evaluation of submittedEvaluations(evaluations)) {
    map.set(evaluation.evaluator.name, evaluation.empathyScore);
  }
  return map;
}

export async function GET(_request: Request, { params }: Params) {
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
    include: {
      presenter: { select: { studentId: true, name: true } },
      evaluations: {
        select: {
          empathyScore: true,
          isDraft: true,
          evaluator: { select: { name: true } },
        },
      },
    },
  });

  const withProfessorFields = await mergeProfessorFieldsBatch(presentations);
  const sortedPresentations = sortPresentationsByPresenterName(
    withProfessorFields
  );
  const evaluators = collectEvaluators(sortedPresentations);
  const layout = buildExportColumnLayout(evaluators.length);
  const weights = {
    peer: course.weightPeer,
    observer: course.weightObserver,
    lead: course.weightLead,
  };

  const header = [
    "#",
    "학번",
    "이름",
    "평가 과제",
    ...evaluators,
    "동료평가",
    "참관 교수 평가",
    "담당 교수 평가",
    "평가결과",
    "순위",
  ];

  const firstDataRow = 2;
  const lastDataRow = sortedPresentations.length + 1;

  const lines = [
    header.map((cell) => csvCell(cell)).join(","),
    ...sortedPresentations.map((presentation, index) => {
      const excelRow = index + firstDataRow;
      const scores = peerScoreByEvaluator(presentation.evaluations);
      const observerScore = submittedObserverScore(presentation);
      const leadScore = submittedLeadScore(presentation);

      const values: (string | number)[] = [
        index + 1,
        presentation.presenter.studentId ?? "",
        presentation.presenter.name,
        presentation.title ?? "",
        ...evaluators.map((name) => scores.get(name) ?? ""),
        peerAverageFormula(excelRow, layout.firstPeerCol, layout.lastPeerCol),
        observerScore ?? "",
        leadScore ?? "",
        weightedFinalFormula(
          excelRow,
          layout.peerAvgCol,
          layout.observerCol,
          layout.leadCol,
          weights
        ),
        rankFormula(
          excelRow,
          layout.finalCol,
          firstDataRow,
          lastDataRow
        ),
      ];

      return values.map((value) => csvCell(value)).join(",");
    }),
  ];

  const bom = "\uFEFF";
  const filename = encodeURIComponent(`${course.name}_점수.csv`);

  return new NextResponse(bom + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
