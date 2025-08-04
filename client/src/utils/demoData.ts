// Demo data seeding for onboarding/testing
export const demoUsers = [
  { id: 'demo-1', name: 'Demo User', email: 'demo@roomrover.com', role: 'guest' },
  { id: 'demo-2', name: 'Demo Host', email: 'host@roomrover.com', role: 'host' },
];

export const demoBookings = [
  { id: 'b1', userId: 'demo-1', room: '101', status: 'confirmed', date: '2025-08-03' },
];

export const demoTasks = [
  { id: 't1', assignedTo: 'demo-2', description: 'Clean room 101', status: 'pending' },
];
