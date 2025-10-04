export type ToastOptions = {
  id?: string;
  message: string;
  emoji?: string;
  duration?: number;
};

type ToastListener = (toast: Required<Omit<ToastOptions, 'duration'>> & { duration: number }) => void;

const listeners = new Set<ToastListener>();
let counter = 0;

export function subscribeToasts(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function pushToast(options: ToastOptions) {
  const id = options.id ?? `toast-${Date.now()}-${counter++}`;
  const duration = Number.isFinite(options.duration) ? Number(options.duration) : 3500;
  const payload = {
    id,
    emoji: options.emoji ?? '🪙',
    message: options.message,
    duration,
  } as const;

  listeners.forEach((listener) => listener(payload));
}

export type ToastPayload = Parameters<ToastListener>[0];
