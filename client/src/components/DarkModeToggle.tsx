import { useEffect, useState } from 'react';

export function DarkModeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      aria-label="Toggle dark mode"
      className="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-800 p-2 rounded"
      onClick={() => setDark(d => !d)}
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}
