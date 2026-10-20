# Teacher Session Booking Backend API

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-brightgreen.svg)](https://mongoosejs.com/)
[![Security](https://img.shields.io/badge/Security-Helmet%20%7C%20CORS-orange.svg)](https://helmetjs.github.io/)
[![Validation](https://img.shields.io/badge/Validation-Zod-purple.svg)](https://zod.dev/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%26%20Supertest-yellow.svg)](https://vitest.dev/)

A production-grade, highly scalable RESTful API for a **Teacher Session Booking Platform** built with **Node.js, TypeScript (Strict Mode), Express.js, MongoDB, and Mongoose**.

---

## Table of Contents

1. [Architectural Overview & Highlights](#architectural-overview--highlights)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Database Seeding](#database-seeding)
7. [Running the Application](#running-the-application)
8. [API Documentation & Endpoints](#api-documentation--endpoints)
9. [Deep Dive: Mandatory MongoDB Aggregation Pipelines](#deep-dive-mandatory-mongodb-aggregation-pipelines)
10. [Concurrency Control & Race Condition Prevention](#concurrency-control--race-condition-prevention)
11. [Error Handling & Standardized Response Format](#error-handling--standardized-response-format)
12. [Postman Collection & Verification Guide](#postman-collection--verification-guide)
13. [Testing Suite](#testing-suite)
14. [Design Decisions & Assumptions](#design-decisions--assumptions)

---

## Architectural Overview & Highlights

- **Strict TypeScript**: Built from the ground up with strict type safety, zero `any` leaks in core logic, and explicit schema interfaces.
- **Layered Clean Architecture**: Modular separation of concerns across Routes, Controllers, Services, Models, and Middlewares.
- **Atomic Operations**: Session booking and completion operations execute atomically directly in MongoDB using conditional filters (`findOneAndUpdate`), guaranteeing zero race conditions during concurrent booking requests.
- **Native MongoDB Aggregations**: Complex read queries (Available Sessions by UTC date and User Session History) leverage multi-stage aggregation pipelines (`$match`, `$lookup`, `$unwind`, `$facet`, `$sort`, `$project`) avoiding in-memory JavaScript filtering.
- **Security-First**: Integrated with `helmet` for HTTP response security headers, strict CORS, request body payload limits (10kb), and production error masking (no leaked stack traces or DB internals).
- **Comprehensive Validation**: Declarative runtime schema validation powered by **Zod** across `body`, `query`, and `params`.
- **Graceful Lifecycle Management**: Server intercepts `SIGINT` and `SIGTERM` signals along with unhandled rejections to cleanly terminate HTTP listeners and close MongoDB connections without dropping active requests.

---

## Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **Node.js (v20+ / v22 LTS)** | High-performance asynchronous JavaScript runtime |
| **TypeScript (v5.7+)** | Static typing with strict mode enabled |
| **Express.js (v4.21+)** | Web application framework for routing and middleware orchestration |
| **MongoDB & Mongoose (v8.10+)** | Document database & Object Data Modeling (ODM) with schema validation and indexing |
| **Zod (v3.24+)** | Type-safe schema validation for HTTP requests and environment variables |
| **Helmet (v8.0+)** | Express security header middleware |
| **CORS** | Cross-Origin Resource Sharing control |
| **dotenv** | Environment configuration management |
| **Vitest & Supertest** | Automated unit, integration, and concurrency testing |

---

## Project Structure

```text
├── src/
│   ├── config/
│   │   ├── database.ts            # Mongoose connection & lifecycle methods
│   │   └── env.ts                 # Validated environment configuration with Zod
│   ├── controllers/
│   │   ├── session.controller.ts  # HTTP controllers for session routes
│   │   └── user.controller.ts     # HTTP controllers for user routes
│   ├── middlewares/
│   │   ├── error.middleware.ts    # Centralized global error handler
│   │   ├── notFound.middleware.ts # 404 handler for unmatched routes
│   │   └── validate.middleware.ts # Request validation middleware using Zod
│   ├── models/
│   │   ├── Session.ts             # Session Mongoose model, schemas & indexes
│   │   ├── Teacher.ts             # Teacher Mongoose model, schemas & indexes
│   │   └── User.ts                # User Mongoose model, schemas & indexes
│   ├── routes/
│   │   ├── session.routes.ts      # Express routes for session endpoints
│   │   └── user.routes.ts         # Express routes for user endpoints
│   ├── scripts/
│   │   └── seed.ts                # Idempotent teacher database seeding script
│   ├── services/
│   │   ├── session.service.ts     # Business logic & aggregation pipelines for sessions
│   │   └── user.service.ts        # Business logic & facet aggregation for user history
│   ├── utils/
│   │   └── AppError.ts            # Custom operational error class
│   ├── validators/
│   │   ├── session.validator.ts   # Zod validation schemas for sessions
│   │   └── user.validator.ts      # Zod validation schemas for users
│   ├── app.ts                     # Express application factory & middleware setup
│   └── server.ts                  # Server entry point, port binding & graceful shutdown
├── postman/
│   └── Teacher-Session-Booking.postman_collection.json # Ready-to-import Postman collection
├── tests/
│   └── api.test.ts                # Automated test suite (27 integration & concurrency tests)
├── .env.example                   # Environment configuration template
├── .gitignore                     # Git ignore rules
├── package.json                   # Project manifest & dependency configuration
├── tsconfig.json                  # Strict TypeScript configuration
└── README.md                      # Comprehensive project documentation
```

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher (verified on `v22.17.0`)
- **npm**: `v9.0.0` or higher (verified on `v10.9.2`)
- **MongoDB**: A running instance of MongoDB (Community Server locally or MongoDB Atlas URI)

---

## Installation & Setup

1. **Clone the repository and enter directory**:
   ```bash
   cd "Teacher Session Booking Backend Assignment"
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

   **Default `.env` settings**:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/teacher_booking
   ```

   > **Using MongoDB Atlas?**
   > Simply replace `MONGODB_URI` with your connection string:
   > `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/teacher_booking?retryWrites=true&w=majority`

---

## Database Seeding

The platform requires pre-existing Teachers to create and schedule sessions. An idempotent database seed script is included.

Run the seed script:
```bash
npm run seed
```

**Output Example**:
```text
🌱 Starting teacher database seeding...
✅ MongoDB Connected: 127.0.0.1/teacher_booking
 ✅ Seeded: Dr. Ananya Roy (Quantum Physics & Mathematics) [ID: 6ad69d28ec7fa096718ad48a]
 ✅ Seeded: Prof. David Miller (Computer Science & Distributed Systems) [ID: 6ad69d28ec7fa096718ad48b]
 ✅ Seeded: Sarah Jenkins (Organic Chemistry & Biochemistry) [ID: 6ad69d28ec7fa096718ad48c]
 ✅ Seeded: Vikram Malhotra (Data Structures & Algorithms) [ID: 6ad69d28ec7fa096718ad48d]
 ✅ Seeded: Elena Rostova (World History & International Relations) [ID: 6ad69d28ec7fa096718ad48e]

🎉 Successfully seeded 5 teachers!
🔌 MongoDB connection closed successfully.
```

*Note: The script uses `findOneAndUpdate` with `{ upsert: true }`, making it completely safe to execute repeatedly without duplicating records.*

---

## Running the Application

### Development Mode (with live reload via `tsx watch`):
```bash
npm run dev
```

### Production Build & Execution:
1. Compile TypeScript into JavaScript (`dist/`):
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

### Health Check Verification:
```bash
curl http://localhost:5000/health
```

---

## API Documentation & Endpoints

All responses follow a predictable JSON format.

### Summary Table

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server health, uptime, and timestamp |
| `POST` | `/users` | Create a new student/user (rejection on duplicate email) |
| `POST` | `/sessions` | Create a session with status `AVAILABLE` |
| `GET` | `/sessions/available?dateTimestamp=...` | Query available sessions for a UTC day (Aggregation) |
| `POST` | `/sessions/:id/book` | Atomically book an available session |
| `PATCH` | `/sessions/:id/complete` | Atomically mark a booked session as completed |
| `GET` | `/users/:id/sessions` | Retrieve upcoming & completed sessions for user (Aggregation) |

---

### API 1: Create User
`POST /users`

Creates a new user record. Emails are normalized (trimmed, lowercase) and unique.

- **Request Body**:
  ```json
  {
    "fullName": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210"
  }
  ```

- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "data": {
      "_id": "67b5e40a129d3c1a84f3e101",
      "fullName": "Rahul Sharma",
      "email": "rahul@example.com",
      "phone": "9876543210",
      "createdAt": "2026-10-20T04:15:00.000Z",
      "updatedAt": "2026-10-20T04:15:00.000Z"
    }
  }
  ```

- **Failure Response — Duplicate Email (`409 Conflict`)**:
  ```json
  {
    "success": false,
    "message": "A user with this email address already exists",
    "error": {
      "code": "EMAIL_ALREADY_EXISTS"
    }
  }
  ```

---

### API 2: Create Session
`POST /sessions`

Creates an open session for a teacher. Requires a valid teacher ID, valid ISO dates, and enforces `endTime > startTime`. Newly created sessions default to status `AVAILABLE`, `userId: null`, and `completedAt: null`.

- **Request Body**:
  ```json
  {
    "teacherId": "6ad69d28ec7fa096718ad48a",
    "startTime": "2026-11-01T10:00:00.000Z",
    "endTime": "2026-11-01T11:00:00.000Z"
  }
  ```

- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Session created successfully",
    "data": {
      "_id": "67b5e43c129d3c1a84f3e104",
      "teacherId": "6ad69d28ec7fa096718ad48a",
      "userId": null,
      "startTime": "2026-11-01T10:00:00.000Z",
      "endTime": "2026-11-01T11:00:00.000Z",
      "status": "AVAILABLE",
      "completedAt": null,
      "createdAt": "2026-10-20T04:16:00.000Z",
      "updatedAt": "2026-10-20T04:16:00.000Z"
    }
  }
  ```

- **Failure Responses**:
  - `404 Not Found`: Teacher does not exist (`TEACHER_NOT_FOUND`).
  - `400 Bad Request`: `endTime <= startTime` or malformed ObjectId (`VALIDATION_ERROR`).

---

### API 3: Get Available Sessions
`GET /sessions/available?dateTimestamp=1793520000000`

Calculates the start of day (`00:00:00.000Z`) and end of day (`23:59:59.999Z`) in **UTC** corresponding to the provided millisecond timestamp. Retrieves sessions with status `AVAILABLE` whose `startTime` falls within that UTC day, populated with teacher details.

- **Query Parameters**:
  - `dateTimestamp`: Unix timestamp in milliseconds (e.g., `1793520000000` for `2026-11-01T08:00:00.000Z`).

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Available sessions retrieved successfully",
    "data": [
      {
        "_id": "67b5e43c129d3c1a84f3e104",
        "teacherId": "6ad69d28ec7fa096718ad48a",
        "userId": null,
        "startTime": "2026-11-01T10:00:00.000Z",
        "endTime": "2026-11-01T11:00:00.000Z",
        "status": "AVAILABLE",
        "completedAt": null,
        "createdAt": "2026-10-20T04:16:00.000Z",
        "updatedAt": "2026-10-20T04:16:00.000Z",
        "teacher": {
          "_id": "6ad69d28ec7fa096718ad48a",
          "fullName": "Dr. Ananya Roy",
          "email": "ananya.roy@example.com",
          "specialization": "Quantum Physics & Mathematics",
          "experience": 12
        }
      }
    ]
  }
  ```

---

### API 4: Book a Session
`POST /sessions/:id/book`

Atomically transitions a session from `AVAILABLE` to `BOOKED` and assigns the `userId`. Uses atomic conditional matching (`findOneAndUpdate`) to guarantee that concurrent booking requests cannot double-book a slot.

- **Request Body**:
  ```json
  {
    "userId": "67b5e40a129d3c1a84f3e101"
  }
  ```

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Session booked successfully",
    "data": {
      "_id": "67b5e43c129d3c1a84f3e104",
      "teacherId": "6ad69d28ec7fa096718ad48a",
      "userId": "67b5e40a129d3c1a84f3e101",
      "startTime": "2026-11-01T10:00:00.000Z",
      "endTime": "2026-11-01T11:00:00.000Z",
      "status": "BOOKED",
      "completedAt": null,
      "createdAt": "2026-10-20T04:16:00.000Z",
      "updatedAt": "2026-10-20T04:17:00.000Z"
    }
  }
  ```

- **Failure Responses**:
  - `404 Not Found`: User not found (`USER_NOT_FOUND`) or Session not found (`SESSION_NOT_FOUND`).
  - `409 Conflict`: Session is already booked or not in `AVAILABLE` status (`SESSION_ALREADY_BOOKED`).

---

### API 5: Complete a Session
`PATCH /sessions/:id/complete`

Atomically transitions a session from `BOOKED` to `COMPLETED` and sets `completedAt` to the current server timestamp.

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Session completed successfully",
    "data": {
      "_id": "67b5e43c129d3c1a84f3e104",
      "teacherId": "6ad69d28ec7fa096718ad48a",
      "userId": "67b5e40a129d3c1a84f3e101",
      "startTime": "2026-11-01T10:00:00.000Z",
      "endTime": "2026-11-01T11:00:00.000Z",
      "status": "COMPLETED",
      "completedAt": "2026-10-20T04:18:22.123Z",
      "createdAt": "2026-10-20T04:16:00.000Z",
      "updatedAt": "2026-10-20T04:18:22.123Z"
    }
  }
  ```

- **Failure Responses**:
  - `404 Not Found`: Session does not exist (`SESSION_NOT_FOUND`).
  - `409 Conflict`: Session already completed (`SESSION_ALREADY_COMPLETED`) or session is not in `BOOKED` status (`INVALID_SESSION_STATUS`).

---

### API 6: User Session History
`GET /users/:id/sessions`

Retrieves a student's session history categorized into **upcoming** and **completed** sessions using MongoDB `$facet` aggregation.

- **Rules**:
  - `upcomingSessions`: Status `BOOKED` and `startTime >= now`. Sorted by `startTime` **ascending** (soonest first).
  - `completedSessions`: Status `COMPLETED`. Sorted by `completedAt` **descending** (most recently completed first).
  - Includes populated teacher details.
  - Returns both arrays (even if empty).

- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User session history retrieved successfully",
    "data": {
      "upcomingSessions": [
        {
          "_id": "67b5e43c129d3c1a84f3e104",
          "teacherId": "6ad69d28ec7fa096718ad48a",
          "userId": "67b5e40a129d3c1a84f3e101",
          "startTime": "2026-11-01T10:00:00.000Z",
          "endTime": "2026-11-01T11:00:00.000Z",
          "status": "BOOKED",
          "completedAt": null,
          "teacher": {
            "_id": "6ad69d28ec7fa096718ad48a",
            "fullName": "Dr. Ananya Roy",
            "email": "ananya.roy@example.com",
            "specialization": "Quantum Physics & Mathematics",
            "experience": 12
          }
        }
      ],
      "completedSessions": []
    }
  }
  ```

---

## Deep Dive: Mandatory MongoDB Aggregation Pipelines

Per specifications, endpoints 3 and 6 strictly avoid `find()` and execute full native MongoDB aggregation pipelines:

### 1. Available Sessions Aggregation (`GET /sessions/available`)
```typescript
const sessions = await Session.aggregate([
  // 1. Filter sessions strictly by status 'AVAILABLE' and UTC day boundaries
  {
    $match: {
      status: 'AVAILABLE',
      startTime: { $gte: startOfDay, $lte: endOfDay },
    },
  },
  // 2. Join teacher details from 'teachers' collection
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  // 3. Deconstruct teacher array into an object
  {
    $unwind: {
      path: '$teacher',
      preserveNullAndEmptyArrays: false,
    },
  },
  // 4. Chronological order
  {
    $sort: { startTime: 1 },
  },
  // 5. Project final clean document structure
  {
    $project: {
      _id: 1,
      teacherId: 1,
      userId: 1,
      startTime: 1,
      endTime: 1,
      status: 1,
      completedAt: 1,
      createdAt: 1,
      updatedAt: 1,
      teacher: {
        _id: '$teacher._id',
        fullName: '$teacher.fullName',
        email: '$teacher.email',
        specialization: '$teacher.specialization',
        experience: '$teacher.experience',
      },
    },
  },
]);
```

### 2. User Session History Aggregation (`GET /users/:id/sessions`)
```typescript
const [result] = await Session.aggregate([
  // 1. Match sessions belonging to user with status BOOKED or COMPLETED
  {
    $match: {
      userId: userObjectId,
      status: { $in: ['BOOKED', 'COMPLETED'] },
    },
  },
  // 2. Join teacher details
  {
    $lookup: {
      from: 'teachers',
      localField: 'teacherId',
      foreignField: '_id',
      as: 'teacher',
    },
  },
  // 3. Flatten teacher object
  {
    $unwind: {
      path: '$teacher',
      preserveNullAndEmptyArrays: true,
    },
  },
  // 4. Execute dual multi-faceted sub-pipelines in a single database roundtrip
  {
    $facet: {
      upcomingSessions: [
        {
          $match: {
            status: 'BOOKED',
            startTime: { $gte: now },
          },
        },
        { $sort: { startTime: 1 } },
        {
          $project: {
            _id: 1,
            teacherId: 1,
            userId: 1,
            startTime: 1,
            endTime: 1,
            status: 1,
            completedAt: 1,
            teacher: {
              _id: '$teacher._id',
              fullName: '$teacher.fullName',
              email: '$teacher.email',
              specialization: '$teacher.specialization',
              experience: '$teacher.experience',
            },
          },
        },
      ],
      completedSessions: [
        {
          $match: { status: 'COMPLETED' },
        },
        { $sort: { completedAt: -1 } },
        {
          $project: {
            _id: 1,
            teacherId: 1,
            userId: 1,
            startTime: 1,
            endTime: 1,
            status: 1,
            completedAt: 1,
            teacher: {
              _id: '$teacher._id',
              fullName: '$teacher.fullName',
              email: '$teacher.email',
              specialization: '$teacher.specialization',
              experience: '$teacher.experience',
            },
          },
        },
      ],
    },
  },
]);
```

---

## Concurrency Control & Race Condition Prevention

In naive backend designs, booking involves two steps:
1. `const session = await Session.findById(id)` -> check if available
2. `await Session.updateOne(...)`

Under high concurrency (e.g. 10 students clicking "Book" simultaneously), all 10 requests read status `AVAILABLE` and overwrite each other, leading to double-booking.

### Our Atomic Solution
We leverage MongoDB document-level write locks via conditional atomic queries:
```typescript
const bookedSession = await Session.findOneAndUpdate(
  {
    _id: sessionId,
    status: 'AVAILABLE', // Atomic predicate condition
  },
  {
    $set: {
      userId: new mongoose.Types.ObjectId(userId),
      status: 'BOOKED',
    },
  },
  {
    returnDocument: 'after',
    runValidators: true,
  }
);
```
- Only **one** thread or request can match `{ _id: sessionId, status: 'AVAILABLE' }`.
- All subsequent or parallel requests receive `null` from `findOneAndUpdate()`.
- Our service inspects the document, detects the conflict, and returns `409 Conflict` with `SESSION_ALREADY_BOOKED`.
- Tested and verified under parallel load in automated tests (`tests/api.test.ts`).

---

## Error Handling & Standardized Response Format

All API errors pass through the centralized `errorHandler` middleware in `src/middlewares/error.middleware.ts`.

### Standardized Format:
```json
{
  "success": false,
  "message": "Human readable error description",
  "error": {
    "code": "MACHINE_READABLE_CODE"
  }
}
```

### Supported Error Codes:
| Error Code | HTTP Status | Trigger Condition |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | `400` | Zod schema validation failure or invalid date ranges |
| `INVALID_ID` | `400` | Malformed 24-character hexadecimal MongoDB ObjectId |
| `INVALID_JSON` | `400` | Malformed JSON in request payload |
| `ROUTE_NOT_FOUND` | `404` | Non-existent API route or wrong HTTP method |
| `USER_NOT_FOUND` | `404` | User ObjectId does not exist in `users` collection |
| `TEACHER_NOT_FOUND` | `404` | Teacher ObjectId does not exist in `teachers` collection |
| `SESSION_NOT_FOUND` | `404` | Session ObjectId does not exist in `sessions` collection |
| `EMAIL_ALREADY_EXISTS` | `409` | Duplicate email address on User creation |
| `SESSION_ALREADY_BOOKED` | `409` | Attempt to book a session that is already booked or completed |
| `SESSION_ALREADY_COMPLETED`| `409` | Attempt to re-complete an already completed session |
| `INVALID_SESSION_STATUS` | `409` | Attempting state transition on unbooked session |
| `INTERNAL_SERVER_ERROR` | `500` | Unhandled runtime exception (masked in production) |

---

## Postman Collection & Verification Guide

An importable Postman collection is located in `postman/Teacher-Session-Booking.postman_collection.json`.

### How to Import:
1. Open Postman.
2. Click **Import** (top left).
3. Select or drag `postman/Teacher-Session-Booking.postman_collection.json`.
4. The collection is imported with pre-configured collection variables:
   - `baseUrl`: `http://localhost:5000`
   - `teacherId`: `6ad69d28ec7fa096718ad48a` (seeded teacher)
   - `userId`: populated automatically upon running `POST /users`
   - `sessionId`: populated automatically upon running `POST /sessions`

### Included Requests & Tests:
- **Health Check**:
  - `GET /health` (Verifies status 200, checks `data.status === 'UP'`)
- **Users**:
  - `POST /users` (Generates random email, saves `userId` variable)
  - `POST /users` (Duplicate email -> asserts 409 `EMAIL_ALREADY_EXISTS`)
  - `POST /users` (Validation error -> asserts 400 `VALIDATION_ERROR`)
  - `GET /users/:id/sessions` (User history -> asserts upcoming & completed arrays)
  - `GET /users/:id/sessions` (Non-existent -> asserts 404 `USER_NOT_FOUND`)
  - `GET /users/:id/sessions` (Invalid ID -> asserts 400 `VALIDATION_ERROR`)
- **Sessions**:
  - `POST /sessions` (Creates session, saves `sessionId` variable)
  - `POST /sessions` (Invalid dates: `endTime <= startTime` -> asserts 400 `VALIDATION_ERROR`)
  - `POST /sessions` (Non-existent teacher -> asserts 404 `TEACHER_NOT_FOUND`)
  - `GET /sessions/available` (Asserts 200 array with teacher details)
  - `GET /sessions/available` (Empty results for date -> asserts empty array)
  - `GET /sessions/available` (Missing timestamp -> asserts 400 `VALIDATION_ERROR`)
  - `POST /sessions/:id/book` (Books session -> asserts 200 `status: BOOKED`)
  - `POST /sessions/:id/book` (Already booked -> asserts 409 `SESSION_ALREADY_BOOKED`)
  - `POST /sessions/:id/book` (Non-existent session -> asserts 404 `SESSION_NOT_FOUND`)
  - `PATCH /sessions/:id/complete` (Completes session -> asserts 200 `status: COMPLETED`)
  - `PATCH /sessions/:id/complete` (Repeated completion -> asserts 409 `SESSION_ALREADY_COMPLETED`)
  - `PATCH /sessions/:id/complete` (Non-existent session -> asserts 404 `SESSION_NOT_FOUND`)

---

## Testing Suite

The project includes an automated test suite using **Vitest & Supertest**, executed against an isolated MongoDB test database (`teacher_booking_test`).

Run all tests:
```bash
npm test
```

### Test Coverage Summary:
- **27/27 Tests Passing** across 6 API modules, concurrency tests, and middleware:
  - User creation, email normalization, and duplicate email conflict (409).
  - Session creation, teacher verification (404), and inverted date ranges (400).
  - Available session aggregation with UTC day calculation and teacher `$lookup`.
  - Atomic booking and race-condition resistance (5 simultaneous bookings on same slot).
  - Session completion and prevention of repeated completion.
  - User session history dual-faceted aggregation ($facet, upcoming vs. completed sorting).
  - Global error middleware, malformed JSON bodies, and 404 route handling.

---

## Design Decisions & Assumptions

1. **UTC Calendar Boundaries**:
   `GET /sessions/available` expects a Unix millisecond timestamp representing any point in a target day. The backend extracts `targetDate.getUTCFullYear()`, `getUTCMonth()`, and `getUTCDate()`, establishing the window from `00:00:00.000Z` to `23:59:59.999Z` in UTC. This ensures consistent cross-timezone query results.
2. **Upcoming vs. Completed Definition**:
   In `GET /users/:id/sessions`:
   - `upcomingSessions`: Sessions with `status === 'BOOKED'` and `startTime >= new Date()`.
   - `completedSessions`: Sessions with `status === 'COMPLETED'`.
3. **Teacher Model & Seeding**:
   The assignment does not define a public teacher registration endpoint. Thus, teachers are populated via `npm run seed` using upsert logic on unique email addresses.
4. **Zero Unprotected Read-Then-Write**:
   State transitions (`AVAILABLE -> BOOKED`, `BOOKED -> COMPLETED`) are executed as single atomic database write commands with pre-condition criteria.
