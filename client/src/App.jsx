import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import SignUpPage from './pages/SignUp';
import SignInPage from './pages/SignIn';
import PostJob from './pages/PostJob';
import BrowseJobs from './pages/BrowseJobs';
import JobDetail from './pages/JobDetail';
import MyJobs from './pages/MyJobs';
import MyApplications from './pages/MyApplications';
import JobApplications from './pages/JobApplications';
import Messages from './pages/Messages';
import Chat from './pages/Chat';

function App() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                ElevateHub
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <SignedIn>
                <Link to="/jobs" className="text-gray-700 hover:text-primary-600">
                  Browse Jobs
                </Link>
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                {/*
                 * Navigation for unauthenticated users should direct each action to the
                 * appropriate page. The original implementation pointed both the
                 * "Sign In" and "Sign Up" buttons to the sign‑up route, which
                 * prevented users from reaching the sign‑in form. Update the
                 * "Sign In" link to target the `/sign-in` route while leaving
                 * the "Sign Up" link pointed at `/sign-up`.
                 */}
                <Link to="/sign-in" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/sign-up" className="btn-primary">
                  Sign Up
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/jobs" element={<BrowseJobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:jobId/applications" element={
            <SignedIn>
              <JobApplications />
            </SignedIn>
          } />
          <Route path="/complete-profile" element={
            <SignedIn>
              <CompleteProfile />
            </SignedIn>
          } />
          <Route path="/dashboard" element={
            <SignedIn>
              <Dashboard />
            </SignedIn>
          } />
          <Route path="/post-job" element={
            <SignedIn>
              <PostJob />
            </SignedIn>
          } />
          <Route path="/my-jobs" element={
            <SignedIn>
              <MyJobs />
            </SignedIn>
          } />
          <Route path="/my-applications" element={
            <SignedIn>
              <MyApplications />
            </SignedIn>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
