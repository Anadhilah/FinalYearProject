# InternshipConnect

InternshipConnect is a role-based internship and placement management platform designed for universities, students, recruiters, faculty coordinators, department coordinators, supervisors, and administrators.

The project solves a common problem in internship programmes: the lifecycle is fragmented across emails, spreadsheets, messages, and manual approvals. InternshipConnect brings that process into a single structured system with authentication, role-aware dashboards, application workflows, task tracking, communication, and reporting.

## Project Objectives

The platform is built to:

- support internship discovery and application tracking from student to recruiter;
- enforce role-based access through protected routes and Supabase RLS;
- give academic coordinators visibility into student placement and department workflows;
- let recruiters manage internships, applicants, supervisors, and communication;
- allow supervisors to assign and review student tasks and weekly progress;
- provide real-time messaging and meetings for coordination;
- support mobile-first usage through a downloadable PWA experience;
- keep all critical records in a versioned Supabase/PostgreSQL backend.

## Product Scope

InternshipConnect is intended for the operational lifecycle of internships, not for general HR payroll or full university administration. The project focuses on:

- student onboarding and profile creation;
- internship browsing and applications;
- department review and coordinator approval gates;
- recruiter onboarding and internship management;
- company supervisor assignments and task management;
- weekly reports, summaries, and faculty feedback;
- communication channels between stakeholders;
- mobile and installed-app access for field and on-the-go use.

## Core Features

### Student experience

- sign up and complete a profile;
- upload and manage CV content;
- browse active internship opportunities;
- apply to internships with details and supporting information;
- view application status and department review status;
- receive assigned tasks and submit progress updates;
- participate in conversations and meetings;
- review reports and internship progress history.

### Recruiter experience

- register and verify company information;
- create and manage internships;
- review and approve or reject applicant flows;
- assign company supervisors to accepted placements;
- monitor student progress and communication;
- create or manage meetings and coordination conversations.

### Supervisor experience

- activate invited supervisor accounts;
- view assigned students and internships;
- assign tasks and monitor task completion;
- review weekly reports and summary updates;
- send feedback and communicate with faculty or students.

### Faculty and department coordination

- view student allocations and scope-based assignments;
- review application routing and department approvals;
- manage summaries and feedback loops;
- access direct student or supervisor communication;
- maintain institutional and department-level visibility.

### Administrative experience

- manage users and recruiter approvals;
- review platform-level requests and coordination flows;
- oversee recruiter, internship, and user records from a central dashboard.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui and Radix UI primitives
- Framer Motion
- TanStack React Query
- Lucide React icons
- Vitest + Testing Library
- Vite PWA plugin

### Backend and infrastructure

- Supabase Auth
- PostgreSQL via Supabase
- Row Level Security (RLS)
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions
- Netlify hosting for the frontend

### Third-party integrations

- Agora RTC for video/voice meeting token generation
- Email delivery through Supabase Edge Functions
- Public or signed file URLs for uploaded student and recruiter documents

## System Architecture

The application is a role-driven single-page frontend connected to a Supabase PostgreSQL backend.

```text
Browser / Mobile Device
        |
        v
React + Vite + React Router
        |
        +-- Pages and layouts for public, student, recruiter, supervisor,
        |   faculty coordinator, department coordinator, and admin flows
        +-- Contexts: AuthContext, MessagesContext, CallContext
        +-- Services: Supabase API, chat, auth, file uploads, Agora
        |
        v
Supabase
        +-- Auth
        +-- PostgreSQL database
        +-- RLS policies
        +-- Storage buckets
        +-- Realtime messages
        +-- Edge Functions
```

### Frontend responsibilities

The main app is organized around role-specific pages and protected layouts in [src/pages](src/pages) and [src/components/layouts](src/components/layouts). Shared business logic is centralized in service modules such as:

- [src/services/supabase-api.ts](src/services/supabase-api.ts)
- [src/services/chat.ts](src/services/chat.ts)
- [src/services/auth.ts](src/services/auth.ts)
- [src/services/agora.ts](src/services/agora.ts)

The routing and auth gate structure is defined in:

- [src/App.tsx](src/App.tsx)
- [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)
- [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)

### PWA and mobile architecture

The app is configured as a progressive web app so it can be installed on supported mobile devices and desktops. This is implemented through the Vite PWA plugin in [vite.config.ts](vite.config.ts) and related metadata in [index.html](index.html).

Key mobile/PWA features include:

- standalone app display mode;
- install prompt support for browsers that support beforeinstallprompt;
- install route guidance at `/install`;
- splash screen for standalone/mobile app mode;
- mobile viewport meta tags and Apple-capable app metadata;
- app icons and manifest metadata for installability.

## User Roles and Access Model

The system uses a `Role` enum in the database with the following major actors:

| Role | Main responsibility |
| --- | --- |
| `STUDENT` | profile management, applications, tasks, reports, communication |
| `RECRUITER` | internship management, applicant review, company supervision |
| `SUPERVISOR` | task assignment and monitoring of assigned student placements |
| `FACULTY_COORDINATOR` | faculty-based placement oversight and feedback |
| `DEPARTMENT_COORDINATOR` | department-level approvals and student routing |
| `ADMIN` | platform management and system-level control |

## Core Business Workflows

### 1. Registration and onboarding

1. A user signs up from the frontend.
2. Supabase Auth creates the identity.
3. The application creates or reconciles the matching `User` record.
4. The role-specific onboarding flow captures profile or organisational details.
5. Approval or activation rules are enforced according to role requirements.

### 2. Internship lifecycle

1. Recruiters create internships.
2. Students browse and apply to open opportunities.
3. Applications move through department review if required.
4. Recruiters review applicants and update status.
5. Accepted interns proceed into the placement workflow.

### 3. Task-based supervision

1. A recruiter assigns a supervisor to an accepted internship.
2. The supervisor creates tasks for the student.
3. The student updates progress and marks tasks complete.
4. The supervisor reviews updates and creates summaries for faculty.
5. The faculty coordinator provides feedback and closes the loop.

### 4. Messaging and meetings

- users can start or join conversations with approved participants;
- messages are stored in the database;
- Supabase Realtime pushes new messages when enabled;
- meetings are tracked with participant and scheduling metadata;
- Agora tokens are generated for real-time calling flows.

### 5. Department and institutional coordination

The project includes academic scope data such as institutions, faculties, departments, and staff assignments to support routing, oversight, and approvals for department-based workflows.

## Database Design

The canonical database schema is in [supabase/schema.sql](supabase/schema.sql). The backend uses PostgreSQL with text-based IDs, camelCase columns, enums, relational references, timestamps, and RLS rules.

### Major schema domains

#### User and access

- `User`: application profile tied to Supabase Auth
- `Role`: system role enum
- `RecruiterStatus`: recruiter verification or approval state

#### Internship and placement

- `Internship`: internship opportunity and metadata
- `Application`: student internship application record
- `StudentInstitutionAffiliation`: academic affiliation to institution/faculty/department
- `CoordinatorAssignment`: assigned coordinator scope for academic oversight

#### Communication and collaboration

- `Conversation`: chat container record
- `ConversationParticipant`: participants in a conversation
- `Message`: message payload and metadata
- `Meeting`: meeting records for student/recruiter coordination

#### Supervision and reporting

- `SupervisorTask`: task assignments and updates
- `WeeklyLogbookReport`: student report weeks and progress evidence
- `SupervisorSummary`: summary sent from supervisors to faculty coordinators

#### Invitations and onboarding

- `SupervisorInvitation`
- `CoordinatorInvitation`
- `DepartmentCoordinatorRequest`

### Key relationships

```text
User (student) --< Application >-- Internship
User (recruiter) --< Internship
Internship --< SupervisorTask --< User (student)
Internship --< WeeklyLogbookReport --< User (student)
User (supervisor) --< SupervisorSummary --< User (faculty-coordinator)
Conversation --< ConversationParticipant --< User
Conversation --< Message --< User
```

### Database design principles

- text IDs are used consistently across the project;
- direct ownership, scope, and assignment are enforced in data relationships;
- role and workflow state are stored as enums or status columns;
- RLS is treated as a real security layer, not just a frontend convenience;
- database changes are tracked in incremental migrations under [supabase/migrations](supabase/migrations).

## Security and Access Control

Security is implemented in both the frontend and the database:

### Frontend access controls

The app restricts route access through [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) and checks auth state in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx).

### Database access controls

Supabase RLS policies enforce who can read, write, update, or delete records. This matters because multiple roles can share the same tables but should only see their own permitted scope.

Examples:

- students only read their own applications and progress;
- recruiters only manage their own internships and applicants;
- supervisors only access assigned internship contexts;
- coordinators only see records within their institution, department, or assigned student scope;
- admins can manage platform-level records.

### File and storage protection

Uploaded documents and CVs are accessed through Supabase Storage with appropriate public or signed URL behavior. See [supabase/migrations/20240103_storage_upload_policies.sql](supabase/migrations/20240103_storage_upload_policies.sql) for storage policy handling.

## PWA and Mobile Experience

This app is not only a desktop dashboard. It is intended to work as a mobile-first installed web app.

### PWA configuration

The project sets up PWA metadata in [vite.config.ts](vite.config.ts), including:

- `display: "standalone"`
- app manifest metadata
- icons for mobile install
- screenshots for narrow and wide layouts
- service worker registration for caching and app updates

### Mobile install behavior

The install page is implemented in [src/pages/Install.tsx](src/pages/Install.tsx).

It supports:

- browser install prompt detection;
- manual installation guidance for iOS and Android/Chrome;
- app detection when already installed;
- standalone-mode styling and splash screen behavior.

The document head in [index.html](index.html) additionally includes mobile app metadata such as:

- viewport configuration;
- theme color;
- Apple mobile app capability and status bar configuration;
- standalone splash-screen support.

This is a key product requirement because internship coordinators, recruiters, and students may need to access the app quickly on phones and tablets.

## Project Structure

```text
internship-connect-ui/
├── public/
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── test/
│   └── types/
├── supabase/
│   ├── functions/
│   ├── migrations/
│   ├── deno.json
│   └── schema.sql
├── .env.example (if added by environment setup)
├── index.html
├── netlify.toml
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20+
- npm
- a Supabase project
- a valid Supabase URL and anon key
- optional Agora credentials and deployed Supabase Edge Functions

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Environment Variables

The frontend expects these values to be available at runtime:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_SITE_URL=https://your-domain.example
```

Do not expose service-role secrets, DB passwords, or private provider credentials in the browser.

## Supabase Setup

### Apply schema and migrations

The project has a canonical schema in [supabase/schema.sql](supabase/schema.sql). For a fresh environment, apply the schema first, then run migrations in order under [supabase/migrations](supabase/migrations).

### Edge functions

The project includes functions for:

- `agora-token`
- `create-faculty-coordinator`
- `invite-faculty-coordinator`
- `create-company-supervisor`
- `send-email`

These should be deployed through the Supabase project configuration and configured with the necessary secret values.

### Realtime requirements

If live message delivery is needed, the `Message` table must be enabled in the Supabase Realtime publication. The app is written with a polling fallback so it can remain functional even when realtime is unavailable.

## Testing and Validation

Available scripts:

```bash
npm run test
npm run test:watch
npm run lint
npm run build
```

The repository already includes tests for project logic and key flows. Recommended future validation includes:

- role-based permission tests;
- internship status transition tests;
- task completion and summary review tests;
- coordinator scope and access tests;
- application review workflow tests;
- message permission tests.

## Deployment

The frontend is designed for Netlify deployment via [netlify.toml](netlify.toml). The configuration includes SPA fallback routing and a production build pipeline using Vite. Supabase migrations and Edge Functions must be deployed separately from the frontend application.

## Important Project Notes

- The app is heavily role-driven and depends on correct Supabase permissions.
- The frontend should never be treated as the sole security layer.
- Database migrations are part of the project source of truth and should be applied in sequence.
- The PWA install flow is a core product feature, especially for mobile users.
- The project is intended for internship coordination, not as a general-purpose ERP or university management system.

## Contribution Guidance

1. keep data access centralized in service layers;
2. respect RLS and role-based scoping in all database changes;
3. add migrations for schema updates rather than editing deployed DB state manually;
4. maintain accessible, mobile-friendly UI patterns;
5. validate lint, tests, and production build before merging updates.

## License

No explicit license is currently declared in this repository. If this project is to be distributed externally or reused beyond the owning organisation, an explicit license should be added.

