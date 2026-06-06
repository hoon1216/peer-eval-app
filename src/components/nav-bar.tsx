"use client";

import { ROLE_LABELS } from "@/lib/role-permissions";
import { pillButtonClass } from "@/lib/pill-button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function NavBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [courseListHref, setCourseListHref] = useState("/dashboard");

  const presentationMatch = pathname.match(
    /^\/presentations\/([^/]+)\/(evaluate|observer-evaluate|professor-evaluate|prep)/
  );

  useEffect(() => {
    if (!presentationMatch) {
      setCourseListHref("/dashboard");
      return;
    }
    const presentationId = presentationMatch[1];
    fetch(`/api/presentations/${presentationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.courseId) {
          setCourseListHref(`/dashboard/courses/${data.courseId}`);
        } else {
          setCourseListHref("/dashboard");
        }
      })
      .catch(() => setCourseListHref("/dashboard"));
  }, [pathname, presentationMatch]);

  const listLabel = presentationMatch ? "과제목록" : "평가 목록";
  const listHref = presentationMatch ? courseListHref : "/dashboard";
  const onEvaluationListPage = pathname === "/dashboard";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          26 Product & Service Design Planning
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {session?.user ? (
            <>
              <span className="text-zinc-600">
                {session.user.name}
                {` (${ROLE_LABELS[session.user.role]})`}
              </span>
              {!onEvaluationListPage && (
                <Link href={listHref} className={pillButtonClass}>
                  {listLabel}
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={pillButtonClass}
              >
                로그아웃
              </button>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
