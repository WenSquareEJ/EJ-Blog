'use client';

import { useState } from 'react';

interface AwardBadgeButtonProps {
  badgeId: string;
  badgeName: string;
}

export function AwardBadgeButton({ badgeId, badgeName }: AwardBadgeButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('Please enter a user email.');
        setSubmitting(false);
        return;
      }

      const resolveResponse = await fetch('/api/badges/resolve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!resolveResponse.ok) {
        const payload = await resolveResponse.json().catch(() => ({}));
        setError(payload?.error ?? 'Could not find a user with that email.');
        setSubmitting(false);
        return;
      }

      const { user_id: userId } = (await resolveResponse.json()) as {
        user_id: string;
      };

      const awardResponse = await fetch('/api/badges/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, badge_id: badgeId }),
      });

      if (!awardResponse.ok) {
        const payload = await awardResponse.json().catch(() => ({}));
        setError(payload?.error ?? 'Failed to award badge.');
        setSubmitting(false);
        return;
      }

      setMessage(`Awarded ${badgeName} to ${trimmedEmail}.`);
      setSubmitting(false);
      setEmail('');
    } catch (err) {
      console.error('[BadgeAwardButton] failed', err);
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  function closeDialog() {
    setDialogOpen(false);
    setSubmitting(false);
    setError(null);
    setMessage(null);
  }

  return (
    <>
      <button
        type="button"
        className="btn-mc-secondary px-2 py-1 text-xs"
        onClick={() => setDialogOpen(true)}
      >
        Award
      </button>
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              closeDialog();
            }
          }}
        >
          <div className="card-block w-full max-w-sm space-y-4">
            <header className="space-y-1">
              <h2 className="font-semibold text-lg">Award badge</h2>
              <p className="text-sm text-mc-stone">
                Enter the email of the user who should receive <span className="font-medium">{badgeName}</span>.
              </p>
            </header>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wide text-mc-stone/80">
                  User email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded border border-mc-stone/30 px-3 py-2 text-sm"
                  placeholder="player@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn-mc"
                  onClick={closeDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-mc-secondary"
                  disabled={submitting}
                >
                  {submitting ? 'Awarding…' : 'Award badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
