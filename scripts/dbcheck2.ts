import { db } from '../src/lib/db'
async function main() {
  const counts = {
    networkEntity: await db.networkEntity.count(),
    networkEdge: await db.networkEdge.count(),
    networkCluster: await db.networkCluster.count(),
    counterfactualScenario: await db.counterfactualScenario.count(),
    systemicRiskMetric: await db.systemicRiskMetric.count(),
    regulatorSubmission: await db.regulatorSubmission.count(),
    chainAnchor: await db.chainAnchor.count(),
  }
  console.log('v2.2 schema verified. Table counts:', counts)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
