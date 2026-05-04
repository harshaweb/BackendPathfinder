/**
 * Script to seed test users for Mock Interviews
 * Run with: npm run seed:users
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

import { db } from '../src/config/firebase';

const testUsers = [
  {
    uid: 'test-user-1',
    email: 'alice@example.com',
    first_name: 'Alice',
    last_name: 'Johnson',
    display_name: 'Alice Johnson',
    headline: 'Senior Frontend Developer',
    bio: 'Passionate about React and TypeScript. Love helping others prepare for technical interviews.',
    current_role: 'Senior Frontend Developer at TechCorp',
    location: 'San Francisco, CA',
    experience_level: 'Senior',
    skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'System Design'],
    target_role: 'Staff Engineer',
    timezone: 'PST',
    is_available_for_interview: true,
    email_verified: true,
    profile_completion_percentage: 85,
    invite_eligible: true,
    invite_eligibility_missing: [],
    availability: [
      { weekday: 1, start_time: '18:00', end_time: '20:00' },
      { weekday: 3, start_time: '18:00', end_time: '20:00' },
      { weekday: 5, start_time: '10:00', end_time: '12:00' },
    ],
    interview_focus: ['Frontend', 'System Design', 'Behavioral'],
    preferred_interview_type: 'both',
    years_experience: 7,
    is_public: 'public',
    show_skills_publicly: true,
    show_progress_publicly: true,
    allow_direct_messages: 'everyone',
    who_can_invite_me: 'everyone',
    connected_accounts: {},
    notification_preferences: {
      email: { interview_invites: true, session_reminders: true },
      in_app: { interview_invite: true, reminder: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'test-user-2',
    email: 'bob@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    display_name: 'Bob Smith',
    headline: 'Full Stack Engineer',
    bio: 'Building scalable web applications. Experienced in both frontend and backend development.',
    current_role: 'Full Stack Engineer at StartupXYZ',
    location: 'New York, NY',
    experience_level: 'Mid',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'AWS'],
    target_role: 'Senior Full Stack Engineer',
    timezone: 'EST',
    is_available_for_interview: true,
    email_verified: true,
    profile_completion_percentage: 75,
    invite_eligible: true,
    invite_eligibility_missing: [],
    availability: [
      { weekday: 2, start_time: '19:00', end_time: '21:00' },
      { weekday: 4, start_time: '19:00', end_time: '21:00' },
      { weekday: 6, start_time: '14:00', end_time: '16:00' },
    ],
    interview_focus: ['Backend', 'Databases', 'API Design'],
    preferred_interview_type: 'peer',
    years_experience: 4,
    is_public: 'public',
    show_skills_publicly: true,
    show_progress_publicly: true,
    allow_direct_messages: 'everyone',
    who_can_invite_me: 'everyone',
    connected_accounts: {},
    notification_preferences: {
      email: { interview_invites: true, session_reminders: true },
      in_app: { interview_invite: true, reminder: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'test-user-3',
    email: 'carol@example.com',
    first_name: 'Carol',
    last_name: 'Williams',
    display_name: 'Carol Williams',
    headline: 'Backend Engineer',
    bio: 'Specializing in distributed systems and microservices architecture.',
    current_role: 'Backend Engineer at CloudCo',
    location: 'Seattle, WA',
    experience_level: 'Senior',
    skills: ['Java', 'Spring Boot', 'Kubernetes', 'Microservices', 'Redis'],
    target_role: 'Principal Engineer',
    timezone: 'PST',
    is_available_for_interview: true,
    email_verified: true,
    profile_completion_percentage: 90,
    invite_eligible: true,
    invite_eligibility_missing: [],
    availability: [
      { weekday: 1, start_time: '17:00', end_time: '19:00' },
      { weekday: 3, start_time: '17:00', end_time: '19:00' },
      { weekday: 5, start_time: '09:00', end_time: '11:00' },
    ],
    interview_focus: ['Backend', 'System Design', 'Scalability'],
    preferred_interview_type: 'mentor',
    years_experience: 9,
    is_public: 'public',
    show_skills_publicly: true,
    show_progress_publicly: true,
    allow_direct_messages: 'everyone',
    who_can_invite_me: 'everyone',
    connected_accounts: {},
    notification_preferences: {
      email: { interview_invites: true, session_reminders: true },
      in_app: { interview_invite: true, reminder: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'test-user-4',
    email: 'david@example.com',
    first_name: 'David',
    last_name: 'Chen',
    display_name: 'David Chen',
    headline: 'Mobile Developer',
    bio: 'iOS and Android development expert. Love building beautiful mobile experiences.',
    current_role: 'Mobile Developer at AppStudio',
    location: 'Austin, TX',
    experience_level: 'Mid',
    skills: ['Swift', 'Kotlin', 'React Native', 'iOS', 'Android'],
    target_role: 'Senior Mobile Developer',
    timezone: 'CST',
    is_available_for_interview: true,
    email_verified: true,
    profile_completion_percentage: 70,
    invite_eligible: true,
    invite_eligibility_missing: [],
    availability: [
      { weekday: 2, start_time: '18:00', end_time: '20:00' },
      { weekday: 4, start_time: '18:00', end_time: '20:00' },
      { weekday: 0, start_time: '10:00', end_time: '12:00' },
    ],
    interview_focus: ['Mobile', 'UI/UX', 'Performance'],
    preferred_interview_type: 'both',
    years_experience: 5,
    is_public: 'public',
    show_skills_publicly: true,
    show_progress_publicly: true,
    allow_direct_messages: 'everyone',
    who_can_invite_me: 'everyone',
    connected_accounts: {},
    notification_preferences: {
      email: { interview_invites: true, session_reminders: true },
      in_app: { interview_invite: true, reminder: true },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedUsers() {
  console.log('🌱 Seeding test users...');
  
  try {
    const batch = db.batch();
    
    for (const user of testUsers) {
      const userRef = db.collection('users').doc(user.uid);
      batch.set(userRef, user);
      console.log(`✅ Added user: ${user.display_name} (${user.email})`);
    }
    
    await batch.commit();
    console.log('\n✨ Successfully seeded', testUsers.length, 'test users!');
    console.log('\n📝 Test user credentials:');
    testUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.display_name})`);
    });
    console.log('\n💡 Note: These are test users for development. You can now see them on the Mock Interviews page!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedUsers();
