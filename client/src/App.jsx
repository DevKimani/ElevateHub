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
                <Link to="/sign-up" className="btn-secondary">
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
        </Routes>
      </main>
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Welcome to <span className="text-yellow-300">ElevateHub</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Africa's Premier Freelance Marketplace
            </p>
            <p className="text-lg mb-10 text-primary-200 max-w-2xl mx-auto">
              Connect with talented freelancers or find your next opportunity. 
              Built for Africa, trusted by thousands.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <SignedOut>
                <Link to="/sign-up" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                  Get Started Free
                </Link>
                <Link to="/jobs" className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                  Browse Jobs
                </Link>
              </SignedOut>
              <SignedIn>
                <Link to="/dashboard" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                  Go to Dashboard
                </Link>
                <Link to="/jobs" className="bg-primary-500 hover:bg-primary-400 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                  Browse Jobs
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose ElevateHub?
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to succeed in the freelance economy
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">💼</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Find Quality Jobs</h3>
            <p className="text-gray-600 text-lg">
              Browse thousands of vetted freelance opportunities from clients across Africa
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">👥</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Hire Top Talent</h3>
            <p className="text-gray-600 text-lg">
              Connect with skilled freelancers ready to bring your projects to life
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-2xl transition-shadow transform hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">💳</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Local Payments</h3>
            <p className="text-gray-600 text-lg">
              Pay with M-Pesa, bank transfer, and other trusted African payment methods
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">1000+</p>
              <p className="text-primary-200 text-lg">Active Freelancers</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">500+</p>
              <p className="text-primary-200 text-lg">Jobs Posted</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">50+</p>
              <p className="text-primary-200 text-lg">Categories</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-bold mb-2">98%</p>
              <p className="text-primary-200 text-lg">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of freelancers and clients building the future of work in Africa
          </p>
          <SignedOut>
            <Link to="/sign-up" className="bg-white text-primary-600 hover:bg-gray-100 px-10 py-4 rounded-lg text-lg font-semibold inline-block transition-all transform hover:scale-105 shadow-lg">
              Create Free Account
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="bg-white text-primary-600 hover:bg-gray-100 px-10 py-4 rounded-lg text-lg font-semibold inline-block transition-all transform hover:scale-105 shadow-lg">
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>
    </div>
  );
}

export default App;