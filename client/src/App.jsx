import { Routes, Route } from 'react-router-dom';
import { SignedIn } from '@clerk/clerk-react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import SignUpPage from './pages/SignUp';
import SignInPage from './pages/SignIn';
import PostJob from './pages/PostJob';
import BrowseJobs from './pages/BrowseJobs';
import JobDetail from './pages/JobDetail';
import ApplyJob from './pages/ApplyJob';  // ← ADD THIS IMPORT
import MyJobs from './pages/MyJobs';
import MyApplications from './pages/MyApplications';
import JobApplications from './pages/JobApplications';
import Messages from './pages/Messages';
import Chat from './pages/Chat';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        
        {/* Job routes */}
        <Route path="/jobs" element={<BrowseJobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        
        {/* ✅ ADD THIS ROUTE - Must come BEFORE /jobs/:jobId/applications */}
        <Route path="/jobs/:id/apply" element={
          <SignedIn>
            <ApplyJob />
          </SignedIn>
        } />
        
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
        
        {/* Messages routes */}
        <Route path="/messages" element={
          <SignedIn>
            <Messages />
          </SignedIn>
        } />
        <Route path="/messages/:jobId/:otherUserId" element={
          <SignedIn>
            <Chat />
          </SignedIn>
        } />
      </Routes>
    </MainLayout>
  );
}

export default App;