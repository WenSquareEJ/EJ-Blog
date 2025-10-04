'use client';

import { useState } from 'react';

interface SelfAwardDevButtonProps {
  badgeId: string | null;
  badgeName: string | null;
}

export function SelfAwardDevButton({ badgeId, badgeName }: SelfAwardDevButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (!badgeId) {
      setStatus('error');
      setMessage('No badge available to award.');
      return;
    }

    setStatus('loading');
    setMessage(null);

    try {
      const response = await fetch('/api/badges/dev-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id: badgeId }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        setMessage(payload?.error ?? 'Failed to award badge.');
        return;
      }

      setStatus('success');
      setMessage(`Awarded ${badgeName ?? 'badge'} to your account.`);
    } catch (error) {
      console.error('[SelfAwardDevButton] failed', error);
      setStatus('error');
      setMessage('Something went wrong. Check console for details.');
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        className="btn-mc-secondary"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Awarding…' : 'Award test badge to me'}
      </button>
      {message && (
        <p
          className={`text-xs ${status === 'error' ? 'text-red-600' : 'text-emerald-600'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

