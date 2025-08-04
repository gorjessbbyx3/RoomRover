import { useState } from 'react';

const steps = [
  'Welcome to RoomRover! This quick tour will help you get started.',
  'Use the navigation bar to access bookings, tasks, and your dashboard.',
  'Check your notifications for important updates.',
  'You can switch between light and dark mode anytime.',
  'Need help? Access support from your profile menu.',
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  if (step >= steps.length) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg max-w-sm w-full">
        <div className="mb-4">{steps[step]}</div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setStep(s => s + 1)}>
          {step === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
