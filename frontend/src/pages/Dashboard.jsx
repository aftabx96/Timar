import { useAuth } from '../lib/auth'
import SponsorDashboard from './dashboards/SponsorDashboard'
import VolunteerDashboard from './dashboards/VolunteerDashboard'
import CompanyDashboard from './dashboards/CompanyDashboard'
import AdminDashboard from './dashboards/AdminDashboard'

// Picks the dashboard for the signed in role (SRS SI-3: land on the area that matches the role).
export default function Dashboard() {
  const { user } = useAuth()
  // Volunteer applicants stay visitors until approved (VLM), but they asked for the field view.
  if (user.role === 'visitor' && user.volunteerStatus === 'pending') return <VolunteerDashboard />
  switch (user.role) {
    case 'volunteer':
      return <VolunteerDashboard />
    case 'company':
      return <CompanyDashboard />
    case 'admin':
    case 'coordinator':
      return <AdminDashboard />
    default:
      return <SponsorDashboard />
  }
}
