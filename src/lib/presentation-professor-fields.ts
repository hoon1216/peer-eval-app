import { prisma } from "@/lib/prisma";
import { Prisma, type Presentation, type PresentationStatus } from "@prisma/client";

export type ProfessorFieldValues = {
  observerProfessorScore: number | null;
  observerProfessorComment: string | null;
  observerProfessorReason: string | null;
  observerProfessorSuggestions: string | null;
  observerEvaluationIsDraft: boolean;
  professorScore: number | null;
  professorComment: string | null;
  professorReason: string | null;
  professorSuggestions: string | null;
  professorEvaluationIsDraft: boolean;
};

type ProfessorFieldUpdate = Partial<ProfessorFieldValues> & {
  status?: PresentationStatus;
};

const PROFESSOR_FIELD_COLUMNS = `
  observerProfessorScore, observerProfessorComment,
  observerProfessorReason, observerProfessorSuggestions,
  observerEvaluationIsDraft,
  professorScore, professorComment,
  professorReason, professorSuggestions,
  professorEvaluationIsDraft
` as const;

function shouldUseRawPresentationSql(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("observerProfessor") ||
    msg.includes("professorComment") ||
    msg.includes("professorReason") ||
    msg.includes("professorSuggestions") ||
    msg.includes("professorEvaluationIsDraft") ||
    msg.includes("observerEvaluationIsDraft")
  );
}

function readSqliteBool(
  value: number | boolean | bigint | null | undefined,
  defaultValue: boolean
) {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "boolean") return value;
  return Number(value) === 1;
}

function rowToProfessorFields(
  row:
    | {
        observerProfessorScore: number | null;
        observerProfessorComment: string | null;
        observerProfessorReason: string | null;
        observerProfessorSuggestions: string | null;
        observerEvaluationIsDraft: number | boolean | null;
        professorScore: number | null;
        professorComment: string | null;
        professorReason: string | null;
        professorSuggestions: string | null;
        professorEvaluationIsDraft: number | boolean | null;
      }
    | undefined
): ProfessorFieldValues {
  return {
    observerProfessorScore: row?.observerProfessorScore ?? null,
    observerProfessorComment: row?.observerProfessorComment ?? null,
    observerProfessorReason: row?.observerProfessorReason ?? null,
    observerProfessorSuggestions: row?.observerProfessorSuggestions ?? null,
    observerEvaluationIsDraft: readSqliteBool(
      row?.observerEvaluationIsDraft,
      true
    ),
    professorScore: row?.professorScore ?? null,
    professorComment: row?.professorComment ?? null,
    professorReason: row?.professorReason ?? null,
    professorSuggestions: row?.professorSuggestions ?? null,
    professorEvaluationIsDraft: readSqliteBool(
      row?.professorEvaluationIsDraft,
      true
    ),
  };
}

export async function getProfessorFields(
  presentationId: string
): Promise<ProfessorFieldValues> {
  const rows = await prisma.$queryRaw<
    {
      observerProfessorScore: number | null;
      observerProfessorComment: string | null;
      observerProfessorReason: string | null;
      observerProfessorSuggestions: string | null;
      observerEvaluationIsDraft: number | boolean | null;
      professorScore: number | null;
      professorComment: string | null;
      professorReason: string | null;
      professorSuggestions: string | null;
      professorEvaluationIsDraft: number | boolean | null;
    }[]
  >`
    SELECT ${Prisma.raw(PROFESSOR_FIELD_COLUMNS)}
    FROM Presentation
    WHERE id = ${presentationId}
    LIMIT 1
  `;

  return rowToProfessorFields(rows[0]);
}

export async function updatePresentationProfessorFields(
  presentationId: string,
  fields: ProfessorFieldUpdate
): Promise<Presentation> {
  try {
    return await prisma.presentation.update({
      where: { id: presentationId },
      data: fields,
    });
  } catch (err) {
    if (!shouldUseRawPresentationSql(err)) throw err;
  }

  const setters: Array<() => Promise<unknown>> = [];

  if (fields.observerProfessorScore !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET observerProfessorScore = ${fields.observerProfessorScore},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.observerProfessorComment !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET observerProfessorComment = ${fields.observerProfessorComment},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.observerProfessorReason !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET observerProfessorReason = ${fields.observerProfessorReason},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.observerProfessorSuggestions !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET observerProfessorSuggestions = ${fields.observerProfessorSuggestions},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.observerEvaluationIsDraft !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET observerEvaluationIsDraft = ${fields.observerEvaluationIsDraft ? 1 : 0},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.professorScore !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET professorScore = ${fields.professorScore},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.professorComment !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET professorComment = ${fields.professorComment},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.professorReason !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET professorReason = ${fields.professorReason},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.professorSuggestions !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET professorSuggestions = ${fields.professorSuggestions},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.professorEvaluationIsDraft !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET professorEvaluationIsDraft = ${fields.professorEvaluationIsDraft ? 1 : 0},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }
  if (fields.status !== undefined) {
    setters.push(() =>
      prisma.$executeRaw`
        UPDATE Presentation SET status = ${fields.status},
        updatedAt = datetime('now') WHERE id = ${presentationId}
      `
    );
  }

  for (const run of setters) {
    await run();
  }

  const presentation = await prisma.presentation.findUnique({
    where: { id: presentationId },
  });
  if (!presentation) {
    throw new Error(`Presentation not found: ${presentationId}`);
  }

  const professorFields = await getProfessorFields(presentationId);
  return { ...presentation, ...professorFields };
}

export async function mergeProfessorFields<T extends Record<string, unknown>>(
  presentation: T,
  presentationId: string
): Promise<T & ProfessorFieldValues> {
  const professorFields = await getProfessorFields(presentationId);
  return { ...presentation, ...professorFields };
}

export async function mergeProfessorFieldsBatch<T extends { id: string }>(
  presentations: T[]
): Promise<(T & ProfessorFieldValues)[]> {
  if (presentations.length === 0) return [];

  const rows = await prisma.$queryRaw<
    (ProfessorFieldValues & { id: string })[]
  >`
    SELECT id, ${Prisma.raw(PROFESSOR_FIELD_COLUMNS)}
    FROM Presentation
    WHERE id IN (${Prisma.join(presentations.map((p) => p.id))})
  `;

  const byId = new Map(rows.map((r) => [r.id, rowToProfessorFields(r)]));
  return presentations.map((p) => ({
    ...p,
    ...(byId.get(p.id) ?? rowToProfessorFields(undefined)),
  }));
}
