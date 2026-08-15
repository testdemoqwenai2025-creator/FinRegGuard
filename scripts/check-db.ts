import { db } from '../src/lib/db'

async function main() {
  const [regulations, policies, risks] = await Promise.all([
    db.regulation.count(),
    db.policy.count(),
    db.riskItem.count(),
  ])
  console.log('Regulations:', regulations)
  console.log('Policies:', policies)
  console.log('RiskItems:', risks)
  console.log('KnowledgeChunks:', await db.knowledgeChunk.count())
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
