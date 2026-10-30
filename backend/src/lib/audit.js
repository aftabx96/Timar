// SU-7 and ADM: account events are written to the audit log.
export async function audit(q, { userId = null, action, meta = {}, ip = null }) {
  await q('INSERT INTO audit_log (user_id, action, meta, ip) VALUES ($1, $2, $3, $4)', [userId, action, JSON.stringify(meta), ip])
}
