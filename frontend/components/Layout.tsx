import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  if (!user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="navbar">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary-600">
              멘토-멘티
            </Link>

            <div className="flex space-x-4">
              <Link
                href="/profile"
                className={`nav-link ${isActive("/profile") ? "active" : ""}`}
              >
                프로필
              </Link>

              {user.role === "mentee" && (
                <Link
                  href="/mentors"
                  className={`nav-link ${isActive("/mentors") ? "active" : ""}`}
                >
                  멘토 찾기
                </Link>
              )}

              <Link
                href="/requests"
                className={`nav-link ${isActive("/requests") ? "active" : ""}`}
              >
                요청 관리
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user.profile.name || user.email} (
              {user.role === "mentor" ? "멘토" : "멘티"})
            </span>
            <button onClick={logout} className="btn btn-secondary text-sm">
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-8">{children}</main>
    </div>
  );
}
