/**
 * npm run seed:demo
 * Verifies the labelled sample Scam Radar dataset ("నమూనా డేటా / Sample data")
 * and prints a summary for local or Supabase seeding.
 */
import { RADAR_DEMO_SEED } from '../src/data/radarDemoSeed';
import { REGISTRY_SEED } from '../src/data/registrySeed';

console.log('--- Nijama? Mosama? Demo Seed Verification ---');
console.log(`Registry seed entries (Section 6 only): ${REGISTRY_SEED.length}`);
for (const entry of REGISTRY_SEED) {
  console.log(
    `  - ${entry.id}: ${entry.nameEn} [status=${entry.status}] (${entry.teamVerificationNote})`,
  );
}

console.log(`\nLabelled Sample Radar clusters ("నమూనా డేటా / Sample data"): ${RADAR_DEMO_SEED.length}`);
for (const cluster of RADAR_DEMO_SEED) {
  if (!cluster.isSample) {
    throw new Error(`Demo item ${cluster.id} must be marked isSample: true`);
  }
  console.log(
    `  - ${cluster.districtEn} (${cluster.districtCode}): ${cluster.registrableDomain} [${cluster.count} sample reports]`,
  );
}
console.log('\nSeed check complete. Server memory store loads these automatically at startup.');
