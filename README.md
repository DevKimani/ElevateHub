🚀 ElevateHub - African Freelance Marketplace
Africa's Premier Freelance Marketplace built with the MERN stack. Connect talented African freelancers with clients worldwide.

🌍 Live Demo

Frontend: https://elevatehubportal.vercel.app
Backend API: https://elevatehub-server.onrender.com/api


✨ Features
Authentication & Users

✅ Secure authentication with Clerk
✅ Dual user roles (Freelancer & Client)
✅ Profile management with skills, bio, location
✅ Role-based dashboards

Jobs & Applications

✅ Job posting with budget, deadline, categories
✅ Job browsing with search and filters
✅ Application system with proposals
✅ Application status tracking (pending, accepted, rejected)
✅ View applications for posted jobs

Work Submission & Review

✅ Freelancer submits completed work
✅ Client reviews submission
✅ Approve or request revisions
✅ Revision history tracking

Communication

✅ Real-time chat with Socket.IO
✅ Online status indicators
✅ Typing indicators
✅ Message notifications

Payments (Escrow System)

✅ Escrow wallet for secure payments
✅ Client deposits funds when accepting freelancer
✅ Release payment upon job completion
✅ Transaction history
🔄 M-Pesa integration (Coming Soon)

🛠️ Tech Stack
Frontend
TechnologyPurposeReact 18UI LibraryViteBuild ToolTailwind CSSStylingClerkAuthenticationReact Router v6NavigationSocket.IO ClientReal-time CommunicationAxiosHTTP ClientLucide ReactIcons
Backend
TechnologyPurposeNode.jsRuntimeExpress.jsWeb FrameworkMongoDBDatabaseMongooseODMClerk SDKAuth VerificationSocket.IOReal-time Communication

📁 Project Structure
ElevateHub/
├── client/                          # Frontend React application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── JobSubmission.jsx    # Work submission UI
│   │   │   └── PaymentModal.jsx     # Payment UI
│   │   ├── context/                 # React context providers
│   │   │   └── SocketContext.jsx    # Socket.IO provider
│   │   ├── pages/                   # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── BrowseJobs.jsx
│   │   │   ├── JobDetail.jsx
│   │   │   ├── PostJob.jsx
│   │   │   ├── MyJobs.jsx
│   │   │   ├── MyApplications.jsx
│   │   │   ├── JobApplications.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── CompleteProfile.jsx
│   │   ├── services/                # API service functions
│   │   │   ├── api.js
│   │   │   ├── userService.js
│   │   │   ├── jobService.js
│   │   │   ├── applicationService.js
│   │   │   ├── messageService.js
│   │   │   └── transactionService.js
│   │   └── App.jsx                  # Main app with routes
│   ├── .env                         # Environment variables
│   └── package.json
│
├── server/                          # Backend Node.js application
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js              # Clerk authentication
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Job.js
│   │   │   ├── Application.js
│   │   │   ├── Message.js
│   │   │   └── Transaction.js
│   │   ├── controllers/
│   │   │   ├── userController.js
│   │   │   ├── jobController.js
│   │   │   ├── applicationController.js
│   │   │   ├── messageController.js
│   │   │   └── transactionController.js
│   │   ├── routes/
│   │   │   ├── userRoutes.js
│   │   │   ├── jobRoutes.js
│   │   │   ├── applicationRoutes.js
│   │   │   ├── messageRoutes.js
│   │   │   └── transactionRoutes.js
│   │   └── server.js                # Main server file
│   ├── .env                         # Environment variables
│   └── package.json
│
└── README.md


🚀 Getting Started
Prerequisites

Node.js v18+
MongoDB Atlas account
Clerk account

Installation

Clone the repository

bash   git clone https://github.com/DevKimani/ElevateHub.git
   cd ElevateHub

Install backend dependencies

bash   cd server
   npm install

Install frontend dependencies

bash   cd ../client
   npm install


💼 User Flows
Complete Job Flow
1. Client posts job
         ↓
2. Freelancer browses and applies
         ↓
3. Client reviews applications
         ↓
4. Client accepts freelancer
         ↓
5. Client creates escrow (funds held)
         ↓
6. Job status: "in_progress"
         ↓
7. Freelancer works on project
         ↓
8. Freelancer submits work
         ↓
9. Client reviews submission
         ↓
10. Client approves OR requests revision
         ↓
11. If approved: Client releases payment
         ↓
12. Job status: "completed"
Escrow Payment Flow
1. Client accepts application
         ↓
2. Modal prompts: "Create Escrow?"
         ↓
3. Client confirms → Funds held securely
         ↓
4. Work completed and approved
         ↓
5. Client clicks "Release Payment"
         ↓
6. Funds transferred to freelancer