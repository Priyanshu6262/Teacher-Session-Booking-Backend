import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Teacher } from '../models/Teacher.js';

export const sampleTeachers = [
  {
    fullName: 'Dr. Ananya Roy',
    email: 'ananya.roy@example.com',
    specialization: 'Quantum Physics & Mathematics',
    experience: 12,
  },
  {
    fullName: 'Prof. David Miller',
    email: 'david.miller@example.com',
    specialization: 'Computer Science & Distributed Systems',
    experience: 9,
  },
  {
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    specialization: 'Organic Chemistry & Biochemistry',
    experience: 7,
  },
  {
    fullName: 'Vikram Malhotra',
    email: 'vikram.malhotra@example.com',
    specialization: 'Data Structures & Algorithms',
    experience: 5,
  },
  {
    fullName: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    specialization: 'World History & International Relations',
    experience: 14,
  },
];

export const seedTeachers = async (): Promise<void> => {
  try {
    console.log('🌱 Starting teacher database seeding...');
    await connectDatabase();

    const seededTeachers = [];

    for (const teacherData of sampleTeachers) {
      const teacher = await Teacher.findOneAndUpdate(
        { email: teacherData.email.toLowerCase() },
        { $set: teacherData },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      seededTeachers.push(teacher);
      console.log(` ✅ Seeded: ${teacher.fullName} (${teacher.specialization}) [ID: ${teacher._id}]`);
    }

    console.log(`\n🎉 Successfully seeded ${seededTeachers.length} teachers!`);
    console.log('\nYou can copy any Teacher ID above to use in POST /sessions:');
    seededTeachers.forEach((t) => {
      console.log(` - ${t.fullName}: "${t._id}"`);
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

// Execute seeding script
seedTeachers()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Unhandled seed error:', err);
    process.exit(1);
  });
