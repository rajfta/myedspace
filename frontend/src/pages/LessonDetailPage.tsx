import type { LessonDetail } from '@myedspace/types';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { apiFetch } from '../lib/api';

export function LessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!lessonId) return;
    apiFetch<LessonDetail>(`/lessons/${lessonId}`)
      .then(setLesson)
      .catch(() => setError('You do not have access to this lesson.'));
  }, [lessonId]);

  async function handleComplete() {
    if (!lessonId) return;
    setCompleting(true);
    try {
      await apiFetch(`/lessons/${lessonId}/complete`, { method: 'POST' });
      setLesson((prev) => (prev ? { ...prev, completed: true } : prev));
    } finally {
      setCompleting(false);
    }
  }

  if (error) {
    return <p className="mx-auto max-w-3xl px-6 py-12 font-medium text-red-600">{error}</p>;
  }

  if (!lesson) {
    return <p className="mx-auto max-w-3xl px-6 py-12 text-brand-950/60">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        to={`/lms/courses/${lesson.courseId}`}
        className="text-sm font-bold text-brand-700 hover:underline"
      >
        ← Back to lessons
      </Link>

      <h1 className="mt-2 text-2xl font-black tracking-tight text-brand-950">{lesson.title}</h1>
      <p className="mt-1 text-brand-950/60">{lesson.description}</p>

      <div className="mt-8 rounded-chunky-lg border-2 border-brand-950 bg-white p-6 leading-relaxed text-brand-950/80 shadow-sticker">
        {lesson.content}
      </div>

      <div className="mt-6">
        {lesson.completed ? (
          <span className="inline-flex items-center rounded-full bg-accent-400 px-4 py-2 text-sm font-bold text-brand-950">
            ✓ Lesson completed
          </span>
        ) : (
          <Button type="button" onClick={handleComplete} disabled={completing}>
            {completing ? 'Saving…' : 'Mark as complete'}
          </Button>
        )}
      </div>
    </div>
  );
}
