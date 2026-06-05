import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  deletePresentationPdf,
  savePresentationPdf,
} from "@/lib/presentation-pdf-storage";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
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

  if (presentation.presenterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (presentation.status === "CLOSED") {
    return NextResponse.json({ error: "마감된 발표는 수정할 수 없습니다." }, { status: 400 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const overview = String(formData.get("overview") ?? "").trim();
  const removePdf = formData.get("removePdf") === "true";
  const pdfEntry = formData.get("pdf");

  if (!title || !overview) {
    return NextResponse.json(
      { error: "제목과 개요를 모두 입력해주세요." },
      { status: 400 }
    );
  }

  let presentationPdfPath = presentation.presentationPdfPath;

  if (removePdf) {
    await deletePresentationPdf(presentationPdfPath);
    presentationPdfPath = null;
  }

  if (pdfEntry && pdfEntry instanceof File && pdfEntry.size > 0) {
    if (pdfEntry.type !== "application/pdf") {
      return NextResponse.json(
        { error: "발표 PDF는 PDF 파일만 첨부할 수 있습니다." },
        { status: 400 }
      );
    }
    if (pdfEntry.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF 파일은 15MB 이하만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await pdfEntry.arrayBuffer());
    if (presentationPdfPath) {
      await deletePresentationPdf(presentationPdfPath);
    }
    presentationPdfPath = await savePresentationPdf(presentation.id, buffer);
  }

  const updated = await prisma.presentation.update({
    where: { id },
    data: {
      title,
      overview,
      presentationPdfPath,
      status: "READY",
    },
  });

  return NextResponse.json({
    ...updated,
    hasPresentationPdf: Boolean(updated.presentationPdfPath),
  });
}
