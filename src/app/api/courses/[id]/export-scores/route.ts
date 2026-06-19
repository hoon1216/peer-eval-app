import { auth } from "@/lib/auth";
import { canViewCourseResults, userCanAccessCourse } from "@/lib/permissions";
import { enrichPresentationsForResults } from "@/lib/course-results";
import { formatPeerEvaluationList } from "@/lib/export-evaluation-details";
import { submittedEvaluations } from "@/lib/evaluation-filters";
import { mergeProfessorFieldsBatch } from "@/lib/presentation-professor-fields";
import { sortPresentationsByPresenterName } from "@/lib/sort-presentations";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

function csvCell(value: string | number | null | undefined) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
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
          reason: true,
          suggestions: true,
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

  const rows = enrichPresentationsForResults(sortedPresentations, {
    weightPeer: course.weightPeer,
    weightObserver: course.weightObserver,
    weightLead: course.weightLead,
  });

  const header = [
    "#",
    "학번",
    "이름",
    "평가 과제",
    "동료평가",
    "동료평가 내역",
    "참관 교수 평가",
    "담당 교수 평가",
    "평가결과",
    "순위",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r, i) => {
      const submitted = submittedEvaluations(
        sortedPresentations[i].evaluations
      );
      const peerDetails = formatPeerEvaluationList(submitted);
      const values = [
        i + 1,
        r.presenter.studentId ?? "",
        r.presenter.name,
        r.title ?? "",
        r.peerAverage ?? "",
        peerDetails,
        r.observerProfessorScore ?? "",
        r.professorScore ?? "",
        r.finalGrade ?? "",
        r.rank ?? "",
      ];
      return values.map((v) => csvCell(v)).join(",");
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
