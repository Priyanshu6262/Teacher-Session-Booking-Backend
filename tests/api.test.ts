import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Teacher } from '../src/models/Teacher.js';
import { Session } from '../src/models/Session.js';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/teacher_booking_test';

describe('Teacher Session Booking Platform - Complete API Test Suite', () => {
  beforeAll(async () => {
    // Connect to isolated test database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(TEST_DB_URI);
  });

  beforeEach(async () => {
    // Clear all test collections before each test run
    await User.deleteMany({});
    await Teacher.deleteMany({});
    await Session.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup and disconnect
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  // ==========================================
  // Health & Error Handling Tests
  // ==========================================
  describe('Health Check & Global Middleware', () => {
    it('GET /health - should return 200 OK with server status and uptime', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.data.timestamp).toBeDefined();
    });

    it('GET /unknown-route - should return 404 with standardized error structure', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });

    it('POST /users - should return 400 INVALID_JSON on malformed JSON payload', async () => {
      const res = await request(app)
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('{"fullName": "Invalid JSON", ');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_JSON');
    });
  });

  // ==========================================
  // API 1: Create User (POST /users)
  // ==========================================
  describe('API 1 — Create User (POST /users)', () => {
    it('should create a user successfully and return 201 Created', async () => {
      const payload = {
        fullName: 'Rahul Sharma',
        email: 'rahul@example.com',
        phone: '9876543210',
      };

      const res = await request(app).post('/users').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.fullName).toBe('Rahul Sharma');
      expect(res.body.data.email).toBe('rahul@example.com');
      expect(res.body.data.phone).toBe('9876543210');
      expect(res.body.data.createdAt).toBeDefined();
    });

    it('should normalize email to lowercase and trim spaces', async () => {
      const payload = {
        fullName: '  Priya Patel  ',
        email: '  PRIYA@EXAMPLE.COM  ',
        phone: '9988776655',
      };

      const res = await request(app).post('/users').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('priya@example.com');
      expect(res.body.data.fullName).toBe('Priya Patel');
    });

    it('should return 409 Conflict when creating a user with duplicate email', async () => {
      await User.create({
        fullName: 'Original User',
        email: 'duplicate@example.com',
        phone: '1234567890',
      });

      const res = await request(app).post('/users').send({
        fullName: 'Duplicate User',
        email: 'DUPLICATE@example.com',
        phone: '0987654321',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 400 Bad Request when required fields are missing or invalid', async () => {
      const res = await request(app).post('/users').send({
        fullName: '',
        email: 'not-an-email',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // API 2: Create Session (POST /sessions)
  // ==========================================
  describe('API 2 — Create Session (POST /sessions)', () => {
    let teacher: any;

    beforeEach(async () => {
      teacher = await Teacher.create({
        fullName: 'Dr. Ananya Roy',
        email: 'ananya.roy@example.com',
        specialization: 'Quantum Physics',
        experience: 12,
      });
    });

    it('should create a session successfully with status AVAILABLE and return 201 Created', async () => {
      const payload = {
        teacherId: teacher._id.toString(),
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-01T11:00:00.000Z',
      };

      const res = await request(app).post('/sessions').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Session created successfully');
      expect(res.body.data.status).toBe('AVAILABLE');
      expect(res.body.data.userId).toBeNull();
      expect(res.body.data.completedAt).toBeNull();
      expect(res.body.data.teacherId).toBe(teacher._id.toString());
      expect(new Date(res.body.data.startTime).toISOString()).toBe('2026-11-01T10:00:00.000Z');
      expect(new Date(res.body.data.endTime).toISOString()).toBe('2026-11-01T11:00:00.000Z');
    });

    it('should return 404 Not Found when teacher does not exist', async () => {
      const nonExistentTeacherId = new mongoose.Types.ObjectId().toString();
      const payload = {
        teacherId: nonExistentTeacherId,
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-01T11:00:00.000Z',
      };

      const res = await request(app).post('/sessions').send(payload);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('TEACHER_NOT_FOUND');
    });

    it('should return 400 Bad Request when endTime <= startTime', async () => {
      const payload = {
        teacherId: teacher._id.toString(),
        startTime: '2026-11-01T11:00:00.000Z',
        endTime: '2026-11-01T10:00:00.000Z',
      };

      const res = await request(app).post('/sessions').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request when teacherId is invalid ObjectId', async () => {
      const payload = {
        teacherId: 'not-a-valid-objectid',
        startTime: '2026-11-01T10:00:00.000Z',
        endTime: '2026-11-01T11:00:00.000Z',
      };

      const res = await request(app).post('/sessions').send(payload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // API 3: Get Available Sessions (GET /sessions/available)
  // ==========================================
  describe('API 3 — Get Available Sessions (GET /sessions/available)', () => {
    let teacher: any;

    beforeEach(async () => {
      teacher = await Teacher.create({
        fullName: 'Prof. David Miller',
        email: 'david.miller@example.com',
        specialization: 'Distributed Systems',
        experience: 10,
      });

      // Session 1: Target date (2026-11-01 UTC), status AVAILABLE -> should be included
      await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-01T09:00:00.000Z'),
        endTime: new Date('2026-11-01T10:00:00.000Z'),
        status: 'AVAILABLE',
      });

      // Session 2: Target date (2026-11-01 UTC), status AVAILABLE -> should be included
      await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-01T14:00:00.000Z'),
        endTime: new Date('2026-11-01T15:00:00.000Z'),
        status: 'AVAILABLE',
      });

      // Session 3: Target date (2026-11-01 UTC), status BOOKED -> should NOT be included
      await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-01T16:00:00.000Z'),
        endTime: new Date('2026-11-01T17:00:00.000Z'),
        status: 'BOOKED',
      });

      // Session 4: Different date (2026-11-02 UTC), status AVAILABLE -> should NOT be included
      await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-02T10:00:00.000Z'),
        endTime: new Date('2026-11-02T11:00:00.000Z'),
        status: 'AVAILABLE',
      });
    });

    it('should return available sessions for the target UTC calendar day using aggregation pipeline', async () => {
      // 2026-11-01T12:00:00.000Z timestamp
      const timestamp = new Date('2026-11-01T12:00:00.000Z').getTime();

      const res = await request(app).get(`/sessions/available?dateTimestamp=${timestamp}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);

      // Verify populated teacher details via $lookup and $unwind
      const firstSession = res.body.data[0];
      expect(firstSession.status).toBe('AVAILABLE');
      expect(firstSession.teacher).toBeDefined();
      expect(firstSession.teacher.fullName).toBe('Prof. David Miller');
      expect(firstSession.teacher.email).toBe('david.miller@example.com');
      expect(firstSession.teacher.specialization).toBe('Distributed Systems');
      expect(firstSession.teacher.experience).toBe(10);
    });

    it('should return an empty array if no sessions are available for that day', async () => {
      // Date with no sessions: 2026-11-05
      const timestamp = new Date('2026-11-05T12:00:00.000Z').getTime();

      const res = await request(app).get(`/sessions/available?dateTimestamp=${timestamp}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('should return 400 Bad Request if dateTimestamp is missing or invalid', async () => {
      const res = await request(app).get('/sessions/available');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ==========================================
  // API 4: Book a Session (POST /sessions/:id/book)
  // ==========================================
  describe('API 4 — Book a Session (POST /sessions/:id/book)', () => {
    let teacher: any;
    let user: any;
    let availableSession: any;

    beforeEach(async () => {
      teacher = await Teacher.create({
        fullName: 'Sarah Jenkins',
        email: 'sarah.jenkins@example.com',
        specialization: 'Chemistry',
        experience: 7,
      });

      user = await User.create({
        fullName: 'Amit Kumar',
        email: 'amit@example.com',
        phone: '9876500000',
      });

      availableSession = await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-01T10:00:00.000Z'),
        endTime: new Date('2026-11-01T11:00:00.000Z'),
        status: 'AVAILABLE',
      });
    });

    it('should book an available session successfully and return 200 OK', async () => {
      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: user._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Session booked successfully');
      expect(res.body.data.status).toBe('BOOKED');
      expect(res.body.data.userId).toBe(user._id.toString());

      // Verify in database
      const dbSession = await Session.findById(availableSession._id);
      expect(dbSession?.status).toBe('BOOKED');
      expect(dbSession?.userId?.toString()).toBe(user._id.toString());
    });

    it('should return 409 Conflict if session is already booked', async () => {
      // Book the session first
      await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: user._id.toString() });

      // Attempt booking again
      const anotherUser = await User.create({
        fullName: 'Other User',
        email: 'other@example.com',
        phone: '1112223334',
      });

      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: anotherUser._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_ALREADY_BOOKED');
    });

    it('should return 404 Not Found if user does not exist', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/sessions/${availableSession._id}/book`)
        .send({ userId: nonExistentUserId });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 404 Not Found if session does not exist', async () => {
      const nonExistentSessionId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/sessions/${nonExistentSessionId}/book`)
        .send({ userId: user._id.toString() });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should prevent race conditions on concurrent booking attempts (Atomic Update)', async () => {
      // Create 5 different users attempting to book the SAME session concurrently
      const users = await Promise.all(
        [1, 2, 3, 4, 5].map((i) =>
          User.create({
            fullName: `Concurrent User ${i}`,
            email: `concurrent${i}@example.com`,
            phone: `900000000${i}`,
          })
        )
      );

      // Fire 5 booking requests simultaneously
      const responses = await Promise.all(
        users.map((u) =>
          request(app)
            .post(`/sessions/${availableSession._id}/book`)
            .send({ userId: u._id.toString() })
        )
      );

      // Exactly ONE request must succeed (200 OK)
      const successResponses = responses.filter((r) => r.status === 200);
      const conflictResponses = responses.filter((r) => r.status === 409);

      expect(successResponses.length).toBe(1);
      expect(conflictResponses.length).toBe(4);

      // Confirm DB session state
      const dbSession = await Session.findById(availableSession._id);
      expect(dbSession?.status).toBe('BOOKED');
    });
  });

  // ==========================================
  // API 5: Complete a Session (PATCH /sessions/:id/complete)
  // ==========================================
  describe('API 5 — Complete a Session (PATCH /sessions/:id/complete)', () => {
    let teacher: any;
    let user: any;
    let bookedSession: any;
    let availableSession: any;

    beforeEach(async () => {
      teacher = await Teacher.create({
        fullName: 'Vikram Malhotra',
        email: 'vikram.malhotra@example.com',
        specialization: 'DSA',
        experience: 5,
      });

      user = await User.create({
        fullName: 'Karan Johar',
        email: 'karan@example.com',
        phone: '8877665544',
      });

      bookedSession = await Session.create({
        teacherId: teacher._id,
        userId: user._id,
        startTime: new Date('2026-11-01T10:00:00.000Z'),
        endTime: new Date('2026-11-01T11:00:00.000Z'),
        status: 'BOOKED',
      });

      availableSession = await Session.create({
        teacherId: teacher._id,
        startTime: new Date('2026-11-01T14:00:00.000Z'),
        endTime: new Date('2026-11-01T15:00:00.000Z'),
        status: 'AVAILABLE',
      });
    });

    it('should complete a booked session and set completedAt to server timestamp', async () => {
      const res = await request(app).patch(`/sessions/${bookedSession._id}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Session completed successfully');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
      expect(new Date(res.body.data.completedAt).getTime()).toBeLessThanOrEqual(Date.now());

      const dbSession = await Session.findById(bookedSession._id);
      expect(dbSession?.status).toBe('COMPLETED');
      expect(dbSession?.completedAt).toBeDefined();
    });

    it('should reject repeated completion with 409 Conflict', async () => {
      // First completion
      await request(app).patch(`/sessions/${bookedSession._id}/complete`);

      // Second completion
      const res = await request(app).patch(`/sessions/${bookedSession._id}/complete`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_ALREADY_COMPLETED');
    });

    it('should reject completing an unbooked (AVAILABLE) session with 409 Conflict', async () => {
      const res = await request(app).patch(`/sessions/${availableSession._id}/complete`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_SESSION_STATUS');
    });

    it('should return 404 Not Found if session does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).patch(`/sessions/${nonExistentId}/complete`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  // ==========================================
  // API 6: User Session History (GET /users/:id/sessions)
  // ==========================================
  describe('API 6 — User Session History (GET /users/:id/sessions)', () => {
    let teacher: any;
    let user: any;

    beforeEach(async () => {
      teacher = await Teacher.create({
        fullName: 'Elena Rostova',
        email: 'elena.rostova@example.com',
        specialization: 'History',
        experience: 14,
      });

      user = await User.create({
        fullName: 'Siddharth Rao',
        email: 'siddharth@example.com',
        phone: '7766554433',
      });

      // Session 1: Future booked session (Upcoming)
      await Session.create({
        teacherId: teacher._id,
        userId: user._id,
        startTime: new Date(Date.now() + 86400000 * 2), // +2 days
        endTime: new Date(Date.now() + 86400000 * 2 + 3600000),
        status: 'BOOKED',
      });

      // Session 2: Another future booked session (Upcoming, earlier than session 1)
      await Session.create({
        teacherId: teacher._id,
        userId: user._id,
        startTime: new Date(Date.now() + 86400000 * 1), // +1 day
        endTime: new Date(Date.now() + 86400000 * 1 + 3600000),
        status: 'BOOKED',
      });

      // Session 3: Completed session in past
      await Session.create({
        teacherId: teacher._id,
        userId: user._id,
        startTime: new Date('2026-01-01T10:00:00.000Z'),
        endTime: new Date('2026-01-01T11:00:00.000Z'),
        status: 'COMPLETED',
        completedAt: new Date('2026-01-01T11:00:00.000Z'),
      });

      // Session 4: More recently completed session
      await Session.create({
        teacherId: teacher._id,
        userId: user._id,
        startTime: new Date('2026-02-01T10:00:00.000Z'),
        endTime: new Date('2026-02-01T11:00:00.000Z'),
        status: 'COMPLETED',
        completedAt: new Date('2026-02-01T11:00:00.000Z'),
      });
    });

    it('should return upcoming and completed sessions using MongoDB facet aggregation', async () => {
      const res = await request(app).get(`/users/${user._id}/sessions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upcomingSessions).toBeDefined();
      expect(res.body.data.completedSessions).toBeDefined();

      expect(res.body.data.upcomingSessions).toHaveLength(2);
      expect(res.body.data.completedSessions).toHaveLength(2);

      // Verify upcoming sessions sorted by startTime ASC
      const upcoming = res.body.data.upcomingSessions;
      expect(new Date(upcoming[0].startTime).getTime()).toBeLessThan(
        new Date(upcoming[1].startTime).getTime()
      );
      expect(upcoming[0].teacher.fullName).toBe('Elena Rostova');

      // Verify completed sessions sorted by completedAt DESC
      const completed = res.body.data.completedSessions;
      expect(new Date(completed[0].completedAt).getTime()).toBeGreaterThan(
        new Date(completed[1].completedAt).getTime()
      );
      expect(completed[0].teacher.fullName).toBe('Elena Rostova');
    });

    it('should return empty arrays for a user with no sessions', async () => {
      const freshUser = await User.create({
        fullName: 'Empty History User',
        email: 'empty@example.com',
        phone: '1231231234',
      });

      const res = await request(app).get(`/users/${freshUser._id}/sessions`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.upcomingSessions).toEqual([]);
      expect(res.body.data.completedSessions).toEqual([]);
    });

    it('should return 404 Not Found if user does not exist', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      const res = await request(app).get(`/users/${nonExistentUserId}/sessions`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should return 400 Bad Request for an invalid user ID format', async () => {
      const res = await request(app).get('/users/invalid-id-format/sessions');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
