# 🚀 ElevateHub - African Freelance Marketplace

Africa's Premier Freelance Marketplace built with the MERN stack.

## ✨ Features

- ✅ User Authentication (Clerk)
- ✅ Dual User Roles (Freelancer & Client)
- ✅ Profile Management
- ✅ Role-based Dashboards
- 🔄 Job Posting (Coming Soon)
- 🔄 Job Browsing (Coming Soon)
- 🔄 Application System (Coming Soon)

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Clerk Authentication
- React Router v6

**Backend:**
- Node.js
- Express.js
- MongoDB
- Mongoose
- Clerk SDK

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Clerk account

### Installation

1. Clone the repository
```bash
git clone https://github.com/DevKimani/ElevateHub.git
cd ElevateHub
```

2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

3. Set up environment variables
```bash
# Server (.env)
MONGODB_URI=your_mongodb_uri
CLERK_SECRET_KEY=your_clerk_secret
CLERK_PUBLISHABLE_KEY=your_clerk_publishable
CLIENT_URL=http://localhost:5173

# Client (.env.local)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable
VITE_API_URL=http://localhost:5000/api
```

4. Run the application
```bash
# Backend (Terminal 1)
cd server
npm run dev

# Frontend (Terminal 2)
cd client
npm run dev
```

Visit `http://localhost:5173`

## 📄 License

MIT License

## 👤 Author

Kimani Mirii
