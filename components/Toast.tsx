'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { pushToast, subscribeToasts, type ToastPayload } from './toastStore';

type ActiveToast = ToastPayload & { expiresAt: number };

export default function ToastViewport() {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToasts((toast) => {
      setToasts((prev) => {
        const expiresAt = Date.now() + toast.duration;
        return [...prev, { ...toast, expiresAt }];
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;

    const now = Date.now();
    const nextExpiry = Math.min(...toasts.map((toast) => toast.expiresAt));
    const timeout = window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.expiresAt > Date.now()));
    }, Math.max(0, nextExpiry - now));

    return () => window.clearTimeout(timeout);
  }, [toasts]);

  const portalTarget = useMemo(() => (typeof document === 'undefined' ? null : document.body), []);

  if (!isMounted || !portalTarget) {
    return null;
  }

  return createPortal(
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} role="status" className="toast-card">
          <span className="toast-emoji" aria-hidden>
            {toast.emoji}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>,
    portalTarget,
  );
}

export function showBadgeEarnedToast(badgeName: string) {
  pushToast({
    emoji: '🪙',
    message: `You earned: ${badgeName}`,
  });
}

export function showInfoToast(message: string) {
  pushToast({
    emoji: '✨',
    message,
    duration: 2500,
  });
}

export function showErrorToast(message: string) {
  pushToast({
    emoji: '⚠️',
    message,
    duration: 4500,
  });
}
