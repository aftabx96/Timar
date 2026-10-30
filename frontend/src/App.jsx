import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './lib/auth'
import DevInbox from './components/DevInbox'
import { Spinner } from './components/ui'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import { ArticlePage, DrivePage, Journal } from './pages/Journal'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Shown for the moment it takes to restore the session from the cookie.
function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-ink-3">
      <Spinner className="h-6 w-6" />
    </div>
  )
}

// Signed in users only. Sends people without a finished profile to setup first.
function RequireAuth({ children, needsProfile = true }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (needsProfile && !user.profileComplete) return <Navigate to="/setup" replace />
  return children
}

// Keeps signed in users away from the login and signup screens.
function GuestOnly({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <Loading />
  if (user) return <Navigate to={user.profileComplete ? '/dashboard' : '/setup'} replace />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/journal/drives/:id" element={<DrivePage />} />
        <Route path="/journal/:slug" element={<ArticlePage />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/setup" element={<RequireAuth needsProfile={false}><ProfileSetup /></RequireAuth>} />
        <Route path="/dashboard/*" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevInbox />
    </>
  )
}
