import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

const Navbar = () => {
    return (
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
    );
};

export default Navbar;
