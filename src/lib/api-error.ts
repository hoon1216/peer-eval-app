import { Prisma } from "@prisma/client";

export function apiErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2022") {
      return "데이터베이스 스키마가 최신이 아닙니다. 관리자에게 문의하세요.";
    }
    if (err.code === "P2002") {
      return "이미 등록된 정보와 충돌합니다.";
    }
  }

  if (err instanceof Error) {
    const message = err.message;
    if (message.includes("Vercel Blob:")) {
      if (message.includes("No blob credentials")) {
        return "PDF 저장 설정이 완료되지 않았습니다. Vercel Storage에서 BLOB_READ_WRITE_TOKEN을 추가한 뒤 Redeploy 해주세요.";
      }
      if (message.includes("No read-write token")) {
        return "PDF 저장에 BLOB_READ_WRITE_TOKEN이 필요합니다. Vercel Storage에서 토큰을 추가한 뒤 Redeploy 해주세요.";
      }
      return message.replace(/^Vercel Blob:\s*/, "PDF 저장 오류: ");
    }
    return message;
  }

  return "제출에 실패했습니다.";
}
