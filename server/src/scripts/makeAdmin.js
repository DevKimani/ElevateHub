// server/src/scripts/makeAdmin.js
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Make a user an admin
 * Usage: node src/scripts/makeAdmin.js <email>
 */
async function makeAdmin() {
  try {
    // Get email from command line argument
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Please provide an email address');
      console.log('Usage: node src/scripts/makeAdmin.js <email>');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Current role: ${user.role}`);

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log('✅ Updated user role to admin in database');

    // Update Clerk metadata
    try {
      await clerkClient.users.updateUserMetadata(user.clerkId, {
        publicMetadata: {
          role: 'admin',
          mongoId: user._id.toString()
        }
      });
      console.log('✅ Updated Clerk metadata');
    } catch (clerkError) {
      console.error('⚠️ Warning: Could not update Clerk metadata:', clerkError.message);
      console.log('You may need to update Clerk metadata manually or sign out/in again');
    }

    console.log('\n🎉 SUCCESS! User is now an admin!');
    console.log(`\nUser Details:`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- MongoDB ID: ${user._id}`);
    console.log(`- Clerk ID: ${user.clerkId}`);

    console.log('\n📝 Next Steps:');
    console.log('1. Sign out and sign back in for changes to take effect');
    console.log('2. Visit /admin/dashboard to access admin panel');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

makeAdmin();