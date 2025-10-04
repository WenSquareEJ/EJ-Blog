'use client';

import { useState } from 'react';
import { showBadgeEarnedToast, showErrorToast, showInfoToast } from '@/components/Toast';

export default function CheckBadgeProgressButton() {
  const [isChecking, setIsChecking] = useState(false);

  async function handleClick() {
    if (isChecking) return;

    setIsChecking(true);
    try {
      const response = await fetch('/api/badges/check-and-award', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      const payload = await response.json().catch(() => ({ awarded: [] }));
      const awarded = Array.isArray(payload?.awarded) ? payload.awarded : [];

      if (awarded.length === 0) {
        showInfoToast('No new badges yet. Keep going!');
      } else {
        for (const badge of awarded) {
          const name = typeof badge?.badgeName === 'string' ? badge.badgeName : 'Badge';
          showBadgeEarnedToast(name);
        }
      }
    } catch (error) {
      console.error('[badges/check-button] Failed to check badge progress', error);
      showErrorToast('Could not check badges. Please try again later.');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <button
      type="button"
      className="btn-mc"
      onClick={handleClick}
      disabled={isChecking}
    >
      {isChecking ? 'Checking…' : 'Check progress'}
    </button>
  );
}
