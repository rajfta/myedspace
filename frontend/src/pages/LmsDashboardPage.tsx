import type { Dashboard } from '@myedspace/types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function LmsDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Dashboard>('/me')
      .then(setDashboard)
      .catch(() => setError('Could not load your dashboard.'));
  }, []);

  if (error) {
    return <p className="mx-auto max-w-3xl px-6 py-12 font-medium text-red-600">{error}</p>;
  }

  if (!dashboard) {
    return <p className="mx-auto max-w-3xl px-6 py-12 text-brand-950/60">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-black tracking-tight text-brand-950">
        Welcome back, {dashboard.fullName}
      </h1>
      <p className="mt-1 text-brand-950/70">Here are the courses you're enrolled in.</p>

      {dashboard.courses.length === 0 && (
        <p className="mt-8 text-brand-950/60">You're not enrolled in any courses yet.</p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {dashboard.courses.map((course) => (
          <Link
            key={course.id}
            to={`/lms/courses/${course.id}`}
            className="rounded-chunky-lg border-2 border-brand-950 bg-white p-6 shadow-sticker-sm transition-all hover:-translate-y-0.5 hover:shadow-sticker"
          >
            <h2 className="text-lg font-extrabold tracking-tight text-brand-950">
              {course.subject}
            </h2>
            <p className="mt-1 text-sm font-medium text-brand-950/60">{course.yearRange}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
