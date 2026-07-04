import type { Course, OrderResult } from '@myedspace/types';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, buttonClasses } from '../components/Button';
import { TextField } from '../components/TextField';
import { ApiError, apiFetch } from '../lib/api';

function formatPrice(pence: number) {
  return `£${(pence / 100).toFixed(0)}`;
}

export function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parentEmail, setParentEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    if (!courseId) return;
    apiFetch<Course>(`/courses/${courseId}`)
      .then(setCourse)
      .catch(() => setError('Course not found.'));
  }, [courseId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<OrderResult>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          courseId,
          parentEmail,
          studentEmail,
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvc,
        }),
      });
      setOrder(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (order) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <div className="rounded-chunky-lg border-2 border-brand-950 bg-white p-8 shadow-sticker">
          <h1 className="text-2xl font-black tracking-tight text-brand-950">Purchase complete!</h1>
          <p className="mt-2 text-brand-950/70">
            Share this invitation link with your child so they can set up their account for{' '}
            <strong className="text-brand-950">{order.course.subject}</strong>.
          </p>
          <div className="mt-6 rounded-chunky border-2 border-brand-950/15 bg-brand-50 p-4 text-sm break-all text-brand-950/80">
            {window.location.origin}
            {order.invitationPath}
          </div>
          <Link to={order.invitationPath} className={`mt-6 ${buttonClasses('primary')}`}>
            Continue to student onboarding →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-black tracking-tight text-brand-950">Checkout</h1>
      {course && (
        <p className="mt-1 text-brand-950/70">
          {course.subject} ({course.yearRange}) — {formatPrice(course.price)}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField
          id="parentEmail"
          label="Your email (parent)"
          type="email"
          required
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
        />
        <TextField
          id="studentEmail"
          label="Student's email (invitation will be sent here)"
          type="email"
          required
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
        />

        <fieldset className="rounded-chunky border-2 border-brand-950/15 p-4">
          <legend className="px-1 text-sm font-bold text-brand-950">Payment details</legend>
          <p className="mb-3 text-xs text-brand-950/50">
            This is a mock checkout — no real payment is processed.
          </p>
          <div className="space-y-3">
            <TextField
              id="cardNumber"
              label="Card number"
              type="text"
              required
              minLength={12}
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
            <div className="flex gap-3">
              <div className="w-1/2">
                <TextField
                  id="cardExpiry"
                  label="MM/YY"
                  type="text"
                  required
                  minLength={3}
                  maxLength={7}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                />
              </div>
              <div className="w-1/2">
                <TextField
                  id="cardCvc"
                  label="CVC"
                  type="text"
                  required
                  minLength={3}
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Processing…' : 'Confirm purchase'}
        </Button>
      </form>
    </div>
  );
}
