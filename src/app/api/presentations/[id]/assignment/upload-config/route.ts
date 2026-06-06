import { auth } from "@/lib/auth";
import {
  formatPdfSizeLimitMb,
  MAX_PDF_BYTES,
  useBlobPdfStorage,
  VERCEL_FUNCTION_BODY_LIMIT_BYTES,
} from "@/lib/pdf-upload-limits";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const presentation = await prisma.presentation.findUnique({
    where: { id },
    select: { presenterId: true },
  });

  if (!presentation || presentation.presenterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const blobUpload = useBlobPdfStorage();

  return NextResponse.json({
    useBlobUpload: blobUpload,
    maxPdfBytes: MAX_PDF_BYTES,
    maxPdfMb: formatPdfSizeLimitMb(),
    directUploadLimitBytes: VERCEL_FUNCTION_BODY_LIMIT_BYTES,
    hint: blobUpload
      ? `PDF는 최대 ${formatPdfSizeLimitMb()}MB까지 첨부할 수 있습니다.`
      : `PDF는 최대 ${formatPdfSizeLimitMb()}MB까지 첨부할 수 있습니다. (대용량 파일은 Vercel Blob 설정이 필요합니다)`,
  });
}
