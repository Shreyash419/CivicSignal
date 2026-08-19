import { ensureFirestoreSeeded } from '../db/firestore';

async function runSeed() {
  console.log('Starting seed process for CivicSignal...');
  await ensureFirestoreSeeded();
  console.log('Seed completed successfully!');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
