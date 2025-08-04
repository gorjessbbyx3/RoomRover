import { useState } from 'react';

export function GlobalNotification() {
  const [message, setMessage] = useState<string | null>(null);
  // Expose setMessage globally for demo
  (window as any).notify = setMessage;
  if (!message) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50">
      {message}
      <button className="ml-2" onClick={() => setMessage(null)}>✕</button>
    </div>
  );
}
