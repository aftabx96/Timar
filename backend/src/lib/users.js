// Shapes a user row (plus profile and volunteer status) for API responses. Never includes the hash.
export function publicUser(u, profile, application) {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    verified: Boolean(u.email_verified_at),
    profileComplete: u.profile_complete,
    volunteerStatus: u.role === 'volunteer' ? 'approved' : (application?.status ?? null),
    // a public user becomes an adopter once they have paid for at least one mangrove
    adopted: Number(u.adopted ?? 0),
    profile: profile ? { bio: profile.bio, photo: profile.photo, notify: profile.notify, ...profile.details } : {},
    createdAt: u.created_at,
  }
}

export async function loadUser(q, id) {
  const { rows } = await q(
    `SELECT u.*, row_to_json(p) AS profile,
       (SELECT row_to_json(a) FROM volunteer_applications a WHERE a.user_id = u.id ORDER BY a.created_at DESC LIMIT 1) AS application,
       (SELECT COALESCE(sum(quantity), 0)::int FROM adoptions d WHERE d.user_id = u.id AND d.status = 'paid') AS adopted
     FROM users u LEFT JOIN profiles p ON p.user_id = u.id WHERE u.id = $1`,
    [id],
  )
  const r = rows[0]
  return r ? publicUser(r, r.profile, r.application) : null
}

export async function findByEmail(q, email) {
  const { rows } = await q('SELECT * FROM users WHERE lower(email) = lower($1)', [email.trim()])
  return rows[0] ?? null
}
