import type { Course, LessonSummary } from '@myedspace/types';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export function CourseLessonsPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    apiFetch<Course>(`/courses/${courseId}`)
      .then(setCourse)
      .catch(() => {});
    apiFetch<LessonSummary[]>(`/courses/${courseId}/lessons`)
      .then(setLessons)
      .catch(() => setError('You do not have access to this course.'));
  }, [courseId]);

  if (error) {
    return <p className="mx-auto max-w-3xl px-6 py-12 font-medium text-red-600">{error}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/lms" className="text-sm font-bold text-brand-700 hover:underline">
        ← Back to my courses
      </Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-brand-950">
        {course?.subject ?? 'Lessons'}
      </h1>

      <div className="mt-8 divide-y-2 divide-brand-950/10 rounded-chunky-lg border-2 border-brand-950 bg-white shadow-sticker">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lms/lessons/${lesson.id}`}
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-brand-50"
          >
            <div>
              <h2 className="font-bold text-brand-950">{lesson.title}</h2>
              <p className="text-sm text-brand-950/60">{lesson.description}</p>
            </div>
            <span
              className={
                lesson.completed
                  ? 'rounded-full bg-accent-400 px-3 py-1 text-xs font-bold text-brand-950'
                  : 'rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700'
              }
            >
              {lesson.completed ? 'Completed' : 'Not started'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
