// Shapes a user row for API responses. Never includes the password hash.
export function publicUser(u) {
  const profile =
    u.role === 'company'
      ? { company: u.company_name, designation: u.designation, industry: u.industry, size: u.company_size }
      : u.role === 'volunteer' || u.volunteer_area
        ? { area: u.volunteer_area, days: u.volunteer_days ?? [], boat: u.volunteer_boat }
        : { city: u.city, interests: u.interests }
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    verified: u.email_verified,
    profileComplete: u.profile_complete,
    volunteerStatus: u.role === 'volunteer' ? 'approved' : (u.volunteer_status ?? null),
    // a public user becomes an adopter once they have paid for at least one mangrove
    adopted: Number(u.adopted ?? 0),
    profile: {
      bio: u.bio,
      photo: u.photo,
      notify: { surveys: u.notify_surveys, trips: u.notify_trips, news: u.notify_news },
      ...profile,
    },
    createdAt: u.created_at,
  }
}

// The user plus their latest volunteer application and how many mangroves they have paid for.
export async function loadUser(q, id) {
  const { rows } = await q(
    `SELECT u.*,
       v.status AS volunteer_status, v.area AS volunteer_area, v.days AS volunteer_days, v.boat AS volunteer_boat,
       (SELECT COALESCE(sum(quantity), 0) FROM adoptions a WHERE a.user_id = u.id AND a.status = 'paid') AS adopted
     FROM users u
     LEFT JOIN LATERAL (
       SELECT * FROM volunteer_applications WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
     ) v ON true
     WHERE u.id = $1`,
    [id],
  )
  return rows[0] ? publicUser(rows[0]) : null
}

export async function findByEmail(q, email) {
  const { rows } = await q('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()])
  return rows[0] ?? null
}
