import type { AuthResult, EnrollmentInfo } from '@myedspace/types';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useAuth } from '../lib/AuthContext';
import { ApiError, apiFetch } from '../lib/api';

export function OnboardingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [enrollment, setEnrollment] = useState<EnrollmentInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch<EnrollmentInfo>(`/enrollments/${token}`)
      .then(setEnrollment)
      .catch((err) =>
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? 'This invitation link is invalid.'
            : 'Could not load this invitation.',
        ),
      );
  }, [token]);

  async function activate(body: Record<string, string>) {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await apiFetch<AuthResult>(`/enrollments/${token}/activate`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      login(result.accessToken);
      navigate('/lms');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Activation failed.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    activate({ fullName, password, confirmPassword });
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-950">{loadError}</h1>
        <Link to="/" className="mt-4 inline-block font-bold text-brand-700 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  if (!enrollment) {
    return <p className="mx-auto max-w-md px-6 py-16 text-center text-brand-950/60">Loading…</p>;
  }

  if (enrollment.status === 'ACTIVATED') {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-brand-950">
          This invitation has already been used.
        </h1>
        <Link to="/login" className="mt-4 inline-block font-bold text-brand-700 hover:underline">
          Log in instead →
        </Link>
      </div>
    );
  }

  if (enrollment.studentAlreadyActive) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="rounded-chunky-lg border-2 border-brand-950 bg-white p-8 shadow-sticker">
          <h1 className="text-xl font-extrabold tracking-tight text-brand-950">Welcome back!</h1>
          <p className="mt-2 text-brand-950/70">
            Add <strong className="text-brand-950">{enrollment.course.subject}</strong> to your
            existing MyEdSpace account ({enrollment.studentEmail}).
          </p>
          {submitError && <p className="mt-3 text-sm font-medium text-red-600">{submitError}</p>}
          <Button
            type="button"
            onClick={() => activate({})}
            disabled={submitting}
            className="mt-6 w-full"
          >
            {submitting ? 'Adding course…' : 'Add course to my account'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-black tracking-tight text-brand-950">Set up your account</h1>
      <p className="mt-2 text-brand-950/70">
        You've been invited to join{' '}
        <strong className="text-brand-950">{enrollment.course.subject}</strong> (
        {enrollment.studentEmail}).
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField
          id="fullName"
          label="Full name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {submitError && <p className="text-sm font-medium text-red-600">{submitError}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Activating…' : 'Activate account'}
        </Button>
      </form>
    </div>
  );
}
