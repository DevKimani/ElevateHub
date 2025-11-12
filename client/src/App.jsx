import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import SignUpPage from './pages/SignUp';
import SignInPage from './pages/SignIn';

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
                <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
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
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
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
        </Routes>
      </main>
    </div>
  );
}

// Home Page Component
function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary-600">ElevateHub</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Africa's Premier Freelance Marketplace
        </p>
        <div className="flex justify-center gap-4">
          <SignedOut>
            <Link to="/sign-up" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
          </SignedOut>
          <SignedIn>
            <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
              Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-20 grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="text-4xl mb-4">💼</div>
          <h3 className="text-xl font-bold mb-2">Find Jobs</h3>
          <p className="text-gray-600">
            Browse thousands of freelance opportunities across Africa
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-bold mb-2">Hire Talent</h3>
          <p className="text-gray-600">
            Connect with skilled freelancers ready to work
          </p>
        </div>
        <div className="card text-center">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-xl font-bold mb-2">Local Payments</h3>
          <p className="text-gray-600">
            Pay with M-Pesa and other local payment methods
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;