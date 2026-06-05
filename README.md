# Peer Eval App

대학 수업 **발표 피어 평가 · 성적 관리 · 피드백 PDF 배포** 웹 앱입니다.

## 주요 기능

| 단계 | 설명 |
|------|------|
| **발표 준비** | 발표 학생이 제목·개요 제출 → 평가 폼에 자동 반영 |
| **피어 평가** | 수강생이 공감도(10점), 평가 이유, 개선점·아이디어 제출 |
| **성적 관리** | 피어 평균 50% + 교수 평가 50% = 최종 점수 |
| **PDF 배포** | 2·3항 정성 피드백을 PDF로 취합·다운로드 |

## 로컬 실행 (Next.js)

```bash
cd peer-eval-app
npm install
npm run db:push
npm run db:seed
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 데모 계정 (seed 후)

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 교수 | prof@example.com | professor123 |
| 학생 | student1@example.com | student123 |

## 사용 흐름

1. **교수**: 회원가입 → 강의 생성 → 학생 등록 → 발표자 지정
2. **발표 학생**: 대시보드에서「개요 작성」→ 제목·개요 제출
3. **수강생**:「평가하기」→ 공감도·이유·개선점 제출
4. **교수**: 성적 관리 테이블에서 피어 평균 확인 + 교수 점수 입력
5. **PDF**: 발표자·교수 모두 피드백 PDF 다운로드 가능

## 데이터 전체 삭제 (회원·평가·업로드 PDF)

로컬 SQLite + `uploads/` 폴더를 비웁니다.

```bash
npm run db:reset
```

데모 계정·강의를 다시 넣으려면:

```bash
npm run db:reset:seed
```

**프로덕션 DB**를 비울 때는 로컬 `.env`가 아니라 배포 환경의 `DATABASE_URL`을 가리킨 뒤 같은 명령을 실행하세요. 되돌릴 수 없으니 반드시 백업 후 진행하세요.

## 클라우드 배포 (Vercel)

1. [Neon](https://neon.tech) 또는 Supabase에서 PostgreSQL 생성
2. `prisma/schema.prisma`의 provider를 `postgresql`로 변경
3. Vercel 환경 변수 설정:
   - `DATABASE_URL`
   - `AUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` (배포 URL)
4. 프로덕션 DB 스키마 반영: `npx prisma db push` (또는 `migrate deploy`)
5. **기존 데이터 삭제(최초 배포·재시작 시)**: 배포 환경 `DATABASE_URL`로 `npm run db:reset` 실행
6. Vercel에 GitHub 연동 후 배포 (`postinstall`에서 `prisma generate` 실행)

> PDF 파일은 서버 `uploads/`에 저장됩니다. Vercel 서버리스에서는 디스크가 영구 저장되지 않으므로, 프로덕션에서는 [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) 등 외부 스토리지 연동을 권장합니다.

## 기술 스택

- Next.js 16 · TypeScript · Tailwind CSS
- Prisma · SQLite (로컬) / PostgreSQL (프로덕션)
- NextAuth.js (이메일·비밀번호 로그인)
- @react-pdf/renderer (피드백 PDF)
