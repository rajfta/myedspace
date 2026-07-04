import type { Course } from '@myedspace/types';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/Button';
import { apiFetch } from '../lib/api';

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(0)}`;
}

export function ProductPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Course[]>('/courses')
      .then(setCourses)
      .catch(() => setError('Could not load courses. Please try again shortly.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="relative overflow-hidden bg-brand-600 pt-16 pb-24">
        <div className="bg-grid-dots absolute inset-0 text-white/10" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-accent-300 uppercase">
            Live online lessons
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Give your child a head start
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Choose a course and get instant access to set up your child's account.
          </p>
        </div>
      </div>

      <div className="relative mx-auto -mt-12 max-w-5xl px-6 pb-16">
        {loading && <p className="text-center text-brand-950/60">Loading courses…</p>}
        {error && <p className="text-center font-medium text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-chunky-lg border-2 border-brand-950 bg-white p-6 shadow-sticker"
            >
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-brand-950">
                  {course.subject}
                </h2>
                <p className="mt-1 text-sm font-medium text-brand-950/60">{course.yearRange}</p>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-2xl font-black text-brand-950">
                  {formatPrice(course.price)}
                </span>
                <Link to={`/checkout/${course.id}`} className={buttonClasses('primary')}>
                  Buy course
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
