import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Service } from '../models/Service.js';
import { Client } from '../models/Client.js';
import { Appointment } from '../models/Appointment.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '../.env') });

const SAMPLE_SERVICES = [
  {
    name: 'Signature Architectural Haircut',
    category: 'Hair Studio',
    durationMinutes: 60,
    price: 95,
    isActive: true
  },
  {
    name: 'Botanical Scalp & Steam Ritual',
    category: 'Wellness & Spa',
    durationMinutes: 45,
    price: 120,
    isActive: true
  },
  {
    name: 'Comprehensive Skin Consultation',
    category: 'Clinical Care',
    durationMinutes: 30,
    price: 85,
    isActive: true
  },
  {
    name: 'Precision Balayage & Gloss',
    category: 'Color Atelier',
    durationMinutes: 120,
    price: 240,
    isActive: true
  },
  {
    name: 'Deep Myofascial Release Session',
    category: 'Wellness & Spa',
    durationMinutes: 60,
    price: 150,
    isActive: true
  },
  {
    name: 'Follow-Up Diagnostic Review',
    category: 'Clinical Care',
    durationMinutes: 30,
    price: 65,
    isActive: false
  }
];

const SAMPLE_CLIENTS = [
  {
    fullName: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (415) 555-0142',
    notes: 'Prefers quiet corner suite and warm chamomile tea.'
  },
  {
    fullName: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (415) 555-0198',
    notes: 'Morning appointments preferred before 11:00 AM.'
  },
  {
    fullName: 'Clara Takahashi',
    email: 'clara.takahashi@example.com',
    phone: '+1 (415) 555-0174',
    notes: 'Sensitive scalp; fragrance-free botanical formula only.'
  },
  {
    fullName: 'Julian Mercer',
    email: 'julian.mercer@example.com',
    phone: '+1 (415) 555-0123',
    notes: 'Monthly wellness membership holder.'
  },
  {
    fullName: 'Nadia Lindqvist',
    email: 'nadia.lindqvist@example.com',
    phone: '+1 (415) 555-0166',
    notes: 'Referred by Dr. Chen.'
  }
];

function atUtcOffset(daysOffset, hour, minute = 0) {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysOffset, hour, minute, 0, 0)
  );
}

async function seed() {
  try {
    await connectDB(process.env.MONGODB_URI);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      Appointment.deleteMany({}),
      Client.deleteMany({}),
      Service.deleteMany({})
    ]);

    const services = await Service.insertMany(SAMPLE_SERVICES);
    const clients = await Client.insertMany(SAMPLE_CLIENTS);

    const buildAppt = (clientIdx, serviceIdx, staffName, daysOffset, hour, minute, status, notes) => {
      const svc = services[serviceIdx];
      const start = atUtcOffset(daysOffset, hour, minute);
      const end = new Date(start.getTime() + svc.durationMinutes * 60000);
      return {
        client: clients[clientIdx]._id,
        service: svc._id,
        staffName,
        appointmentDate: start,
        endTime: end,
        status,
        notes
      };
    };

    const sampleAppointments = [
      buildAppt(0, 0, 'Dr. Aria Chen', 0, 9, 30, 'Completed', 'Completed morning check-in on schedule.'),
      buildAppt(1, 2, 'Dr. Aria Chen', 0, 11, 0, 'Scheduled', 'Initial skin evaluation & digital imaging.'),
      buildAppt(2, 1, 'Soren Lindqvist', 0, 13, 30, 'Scheduled', 'Requested lavender-free botanical infusion.'),
      buildAppt(3, 4, 'Marcus Cole', 0, 15, 0, 'Scheduled', 'Upper shoulder tension focus.'),
      buildAppt(4, 3, 'Soren Lindqvist', 1, 10, 0, 'Scheduled', 'Full color refresh session.'),
      buildAppt(0, 2, 'Dr. Aria Chen', -1, 14, 0, 'Completed', 'Routine follow-up cleared.'),
      buildAppt(2, 0, 'General Staff', -1, 16, 0, 'Cancelled', 'Rescheduled due to travel delay.'),
      buildAppt(1, 4, 'Marcus Cole', 2, 11, 30, 'Scheduled', 'Post-marathon recovery session.')
    ];

    await Appointment.insertMany(sampleAppointments);

    console.log(
      `[Seed] Inserted ${services.length} services, ${clients.length} clients, and ${sampleAppointments.length} appointments.`
    );
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Failed:', err.message);
    process.exit(1);
  }
}

seed();
