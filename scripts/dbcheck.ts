import { db } from '../src/lib/db'
async function main() {
  const r = await db.regulation.count()
  const p = await db.policy.count()
  const a = await db.auditLog.count()
  const ri = await db.riskItem.count()
  const m = await db.complianceMetric.count()
  const c = await db.chatMessage.count()
  console.log({ regulations: r, policies: p, auditLogs: a, riskItems: ri, metrics: m, chats: c })
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
