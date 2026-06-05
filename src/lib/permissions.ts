import type { Role } from "@prisma/client";
import { findObserverSlotForUser } from "@/lib/observer-courses";
import { prisma } from "@/lib/prisma";

export const ROLE_LABELS: Record<Role, string> = {
  PROFESSOR: "담당교수",
  OBSERVER_PROFESSOR: "참관교수",
  STUDENT: "학생",
};

/** 로그인 폼에서 선택하는 역할 키 */
export type LoginRoleKey = "PROFESSOR" | "STUDENT" | "OBSERVER";

export function loginRoleToDbRole(loginRole: string): Role | null {
  switch (loginRole) {
    case "PROFESSOR":
      return "PROFESSOR";
    case "STUDENT":
      return "STUDENT";
    case "OBSERVER":
      return "OBSERVER_PROFESSOR";
    default:
      return null;
  }
}

export function isLeadProfessor(role: string): role is "PROFESSOR" {
  return role === "PROFESSOR";
}

export function isObserverProfessor(role: string): role is "OBSERVER_PROFESSOR" {
  return role === "OBSERVER_PROFESSOR";
}

export function isStudent(role: string): role is "STUDENT" {
  return role === "STUDENT";
}

/** 평가 생성·삭제, 편집 화면, 학생·참관교수 관리 */
export function canManageCourse(role: string) {
  return isLeadProfessor(role);
}

/** 평가 결과·엑셀·PDF 조회 (담당·참관) */
export function canViewCourseResults(role: string) {
  return isLeadProfessor(role) || isObserverProfessor(role);
}

/** 동료(과제) 평가 */
export function canPeerEvaluate(role: string) {
  return isStudent(role);
}

/** 참관 교수 점수·코멘트 입력 */
export function canObserverEvaluate(role: string) {
  return isObserverProfessor(role);
}

/** 담당 교수 과제 평가 입력 */
export function canLeadProfessorEvaluate(
  role: string,
  courseProfessorId: string,
  userId: string
) {
  return isLeadProfessor(role) && courseProfessorId === userId;
}

/** 본인 과제 등록·발표자료 */
export function canManageOwnAssignment(role: string) {
  return isStudent(role);
}

export async function userCanAccessCourse(
  courseId: string,
  userId: string,
  role: string
) {
  if (isLeadProfessor(role)) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, professorId: userId },
    });
    return !!course;
  }

  if (isObserverProfessor(role)) {
    const slot = await findObserverSlotForUser(courseId, userId);
    return !!slot;
  }

  if (isStudent(role)) {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId, studentId: userId },
    });
    return !!enrollment;
  }

  return false;
}

export async function getCourseForUser(
  courseId: string,
  userId: string,
  role: string
) {
  if (isLeadProfessor(role)) {
    return prisma.course.findFirst({
      where: { id: courseId, professorId: userId },
    });
  }
  if (isObserverProfessor(role)) {
    const slot = await findObserverSlotForUser(courseId, userId);
    if (!slot) return null;
    return prisma.course.findUnique({ where: { id: courseId } });
  }
  if (isStudent(role)) {
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: { courseId, studentId: userId },
      include: { course: true },
    });
    return enrollment?.course ?? null;
  }
  return null;
}

export async function canAccessPresentation(
  presentation: { courseId: string; presenterId: string; course: { professorId: string } },
  userId: string,
  role: string
) {
  if (isLeadProfessor(role) && presentation.course.professorId === userId) {
    return true;
  }
  if (isStudent(role)) {
    const enrolled = await prisma.courseEnrollment.findFirst({
      where: { courseId: presentation.courseId, studentId: userId },
    });
    return !!enrolled;
  }
  if (isObserverProfessor(role)) {
    return userCanAccessCourse(presentation.courseId, userId, role);
  }
  return false;
}
