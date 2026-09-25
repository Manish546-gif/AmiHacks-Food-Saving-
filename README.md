# Surplus to Shelter

> **Saving food. Feeding communities. Reducing waste.**

Surplus-to-Shelter is a smart food rescue and distribution platform connecting **food donors, verified shelters/community kitchens, and volunteer drivers** through one coordinated workflow.

## Problem

Restaurants, caterers, messes, grocery stores, and other organizations often have edible surplus food but lack a fast, reliable redistribution channel.

Key challenges:
- Short expiry windows for prepared food
- Fragmented donation coordination
- Difficulty finding suitable nearby recipients
- Limited pickup/delivery visibility
- Lack of verification and accountability
- Manual receipts and impact reporting

## Solution

```text
Donor
  ↓
Post Surplus Food
  ↓
Smart Matching
  ↓
Verified Shelter Accepts
  ↓
Driver Assigned
  ↓
Pickup
  ↓
Delivery + OTP Verification
  ↓
Digital Receipt + Impact Record
```

## Key Features

### Donor
- Create food donation offers
- Specify type, quantity, ready time, expiry, and packaging
- Track donation status and history

### Shelter / Recipient
- View nearby available food
- Review quantity, type, expiry, and requirements
- Accept or reject offers
- Track incoming donations

### Driver
- Receive pickup assignments
- Navigate between donor and shelter
- Update pickup/delivery status
- Complete delivery using OTP verification

### Admin
- Verify donors and shelters
- Monitor donations and deliveries
- Manage users and drivers
- Intervene in failed matches
- Generate reports

### Trust & Impact
- Role-based authentication
- Verified participants
- OTP-based handover
- Donation and delivery logs
- Meals rescued and food diverted metrics
- Digital receipts and impact reporting

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ USERS                                                       │
│ Donor │ Shelter / NGO │ Volunteer Driver │ Admin           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ REACT + VITE                                                │
│ Donor Dashboard │ Shelter Dashboard │ Driver │ Admin Panel │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / JSON
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ NODE.JS + EXPRESS                                           │
│ Authentication • Users • Donations • Matching               │
│ Driver Assignment • Tracking • Notifications • Reports     │
└───────────────┬───────────────────┬─────────────────────────┘
                │                   │
                ▼                   ▼
┌────────────────────────┐   ┌────────────────────────────────┐
│ PostgreSQL             │   │ External Services              │
│ Users                  │   │ Google Maps API                │
│ Donations              │   │ Email / SMTP                   │
│ Shelters               │   │ SMS / Twilio                   │
│ Drivers                │   │ Firebase Notifications         │
│ Transactions / Logs    │   │ Cloud Storage                  │
└────────────────────────┘   └────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express.js |
| Database | PostgreSQL |
| Maps | Google Maps API |
| Notifications | Firebase Cloud Messaging |
| SMS / OTP | Twilio |
| Email | SMTP / SendGrid |
| Storage | AWS S3 / Cloudinary |
| Authentication | JWT + role-based authorization |
| API | REST / JSON over HTTPS |

## Suggested Project Structure

```text
surplus-to-shelter/
├── client/                 # React + Vite frontend
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── services/
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── services/
│       ├── middleware/
│       └── utils/
├── shared/                 # Shared types/utilities
├── docs/                   # Architecture/documentation
├── .env.example
└── README.md
```

## Donation Lifecycle

```text
POSTED → MATCHING → ACCEPTED → DRIVER_ASSIGNED
        → PICKUP_STARTED → PICKED_UP → IN_TRANSIT
        → DELIVERED → VERIFIED → COMPLETED
```

Failure states:

```text
REJECTED | EXPIRED | CANCELLED | DELIVERY_FAILED
```

## Matching Logic

A basic matching score can combine:

```text
Matching Score =
    Distance Score
  + Capacity Score
  + Expiry Urgency
  + Demand Score
  + Food Compatibility
  + Recipient Availability
```

The MVP can use deterministic rules. AI-based demand prediction and route optimization can be added later.

## Authentication

```text
Login / Registration
        ↓
JWT Authentication
        ↓
Role Verification
        ↓
Role-specific Dashboard
```

Roles:
- **Donor:** create and track donations
- **Shelter:** discover and accept donations
- **Driver:** manage pickup and delivery
- **Admin:** manage and monitor the platform

## Real-Time Updates

Real-time events may include:
- New donation alerts
- Shelter acceptance
- Driver assignment
- Pickup confirmation
- Delivery updates
- OTP verification
- Admin alerts

Possible implementation:

```text
Backend Event → WebSocket / Firebase → Relevant User → Dashboard / Notification
```

## Maps & Routing

Google Maps services can support:
- Donor and shelter geocoding
- Distance calculation
- Route visualization
- Driver navigation
- Estimated travel time

Matching should prioritize recipients that can realistically receive the food before its expiry window.

## Core Database Entities

```text
User
 ├── Donor
 ├── Shelter
 ├── Driver
 └── Admin

Donation
 ├── Food Details
 ├── Quantity
 ├── Location
 ├── Ready Time
 ├── Expiry Time
 └── Status

Match
 ├── Donation
 ├── Shelter
 ├── Score
 └── Decision

Delivery
 ├── Donation
 ├── Driver
 ├── Pickup
 ├── Delivery
 ├── OTP
 └── Status

ImpactRecord
 ├── Donation
 ├── Food Rescued
 ├── Meals Delivered
 └── Environmental Estimate
```

## Environment Variables

Create `.env` inside the backend directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
SMTP_USER=your_email
SMTP_PASS=your_email_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
FIREBASE_SERVICE_ACCOUNT=path/to/service-account.json
AWS_S3_BUCKET=your_bucket
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

**Never commit real credentials or service-account files to Git.**

## Local Development

### 1. Clone

```bash
git clone https://github.com/your-username/surplus-to-shelter.git
cd surplus-to-shelter
```

### 2. Backend

```bash
cd server
npm install
npm run dev
```

### 3. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

## Example API Structure

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/users/me

POST   /api/donations
GET    /api/donations
GET    /api/donations/:id
PATCH  /api/donations/:id

GET    /api/matches/:donationId
POST   /api/matches/:id/accept
POST   /api/matches/:id/reject

POST   /api/deliveries/assign
PATCH  /api/deliveries/:id/status
POST   /api/deliveries/:id/verify

GET    /api/impact
GET    /api/reports
```

## Security

- Use HTTPS in production
- Hash passwords securely
- Store secrets only in environment variables
- Enforce role-based authorization on protected endpoints
- Validate and sanitize API input
- Rate-limit authentication and OTP endpoints
- Restrict admin APIs
- Maintain audit logs
- Avoid exposing unnecessary personal information

## MVP Scope

Prioritize these features for the first working version:

1. Authentication
2. Donor food posting
3. Shelter offer feed
4. Location-based matching
5. Shelter acceptance
6. Driver assignment
7. Pickup and delivery status
8. OTP verification
9. Basic notifications
10. Donation history and impact dashboard

This keeps the MVP achievable while demonstrating the complete real-world workflow.

## Future Scope

### AI Matching
- Demand prediction
- Shelter requirement prediction
- Donation prioritization
- Acceptance probability

### Optimized Routing
- Multi-stop routing
- Traffic-aware delivery planning
- Expiry-aware route optimization

### Cold-Chain Support
- Temperature tracking
- Controlled storage and transport
- Temperature alerts

### Mobile Applications
Build dedicated React Native applications for donors, shelters, and drivers.

### Partnerships
Expand integrations with:
- NGOs
- CSR teams
- Municipal bodies
- Restaurants
- Grocery chains
- Educational institutions
- Community kitchens

### Additional Use Cases
- School meal programs
- Disaster relief
- Community kitchens
- Large-event food recovery
- Emergency food distribution

## Impact Vision

```text
SURPLUS FOOD
     ↓
FAST MATCHING
     ↓
VERIFIED RECIPIENT
     ↓
EFFICIENT DELIVERY
     ↓
MEASURABLE IMPACT
```

The long-term vision is a scalable ecosystem where edible food is redirected to communities in need instead of becoming avoidable waste.

## License

This project can be released under the **MIT License** unless a different license is required by the project or organization.

## Tagline

> **Saving food. Feeding communities. Reducing waste.**
