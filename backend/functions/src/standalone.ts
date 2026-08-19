import { app } from './app';
import { ensureFirestoreSeeded } from './db/firestore';

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 CivicSignal Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Complaints API: http://localhost:${PORT}/api/complaints`);
  console.log(`📊 Governance Overview: http://localhost:${PORT}/api/governance/overview`);
  
  // Background seed check if firestore is connected
  ensureFirestoreSeeded().catch((err) => {
    console.log('Background seed check finished:', err?.message || 'ok');
  });
});
