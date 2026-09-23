# InternshipConnect

InternshipConnect is a role-based internship management platform for universities, students, recruiters, company supervisors, faculty coordinators, department coordinators, and administrators.

The platform manages the complete internship lifecycle:

1. User registration, email verification, onboarding, and role activation.
2. Student profiles, CVs, internship discovery, and applications.
3. Department-level application review and coordinator support.
4. Recruiter internship management and applicant review.
5. Company supervisor assignment and task-based student progress tracking.
6. Faculty coordinator oversight of assigned students, placements, supervisor summaries, and feedback.
7. Department coordinator oversight of students, organisations, applications, and fallback summary visibility.
8. Real-time messaging, meetings, file uploads, and protected role-specific dashboards.

This repository contains the frontend application and the Supabase database schema, migrations, policies, and Edge Functions required by the system.

## Table Of Contents

- [Product Scope](#product-scope)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Application Routes](#application-routes)
- [Core Workflows](#core-workflows)
- [Database Design](#database-design)
- [Security And Access Control](#security-and-access-control)
- [Project Structure](#project-structure)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Testing And Validation](#testing-and-validation)
- [Deployment](#deployment)
- [Operational Notes And Limitations](#operational-notes-and-limitations)

## Product Scope

### Problem

Internship programmes involve several participants and hand-offs. Students submit applications and weekly evidence, recruiters review applicants and workplace reports, supervisors monitor students at the organisation, and university coordinators oversee academic and departmental progress.

Without a shared system, these activities are commonly spread across email, spreadsheets, messaging applications, and documents. That makes it difficult to track responsibility, approval status, placement progress, and report history.

### Solution

InternshipConnect provides one authenticated web application with role-specific dashboards and database-backed workflows. The system uses Supabase for authentication, PostgreSQL data, row-level security, real-time messaging, storage, and Edge Functions.

### Scope Boundaries

The system currently focuses on:

- Internship discovery and placement management.
- Application and coordinator review.
- Persistent task assignment, completion, and student progress updates.
- Faculty and department coordination.
- User and organisation communication.
- Meetings and shared report access.

The application is not intended to replace a university student information system, payroll system, HR system, or full document management platform.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui and Radix UI primitives
- Lucide React icons
- TanStack React Query
- React Hook Form and Zod where form validation is required
- Vitest and Testing Library
- Vite PWA plugin

### Backend And Infrastructure

- Supabase Auth for authentication and sessions.
- Supabase PostgreSQL for application data.
- PostgreSQL Row Level Security (RLS) for authorization at the data layer.
- Supabase Storage for CVs, documents, and uploaded attachments.
- Supabase Realtime for message updates.
- Supabase Edge Functions for server-side operations such as Agora token generation and coordinator email workflows.
- Netlify for static frontend hosting and SPA redirects.

### Integrations

- Agora RTC for video or voice call token generation.
- Email delivery through the Supabase `send-email` Edge Function.
- Optional public or signed URLs for uploaded files.

## System Architecture

The application is a client-rendered single-page application.

```text
Browser
	|
	v
React + React Router + ProtectedRoute
	|
	+-- Contexts: AuthContext, MessagesContext, CallContext
	+-- Pages: role-specific workflows
	+-- Services: supabase-api.ts, chat.ts, auth.ts, agora.ts
	|
	v
Supabase
	+-- Auth
	+-- PostgreSQL tables and RLS policies
	+-- Storage bucket
	+-- Realtime publication
	+-- Edge Functions
```

### Frontend Data Access

Most application data access is centralized in [src/services/supabase-api.ts](src/services/supabase-api.ts). The compatibility layer in [src/services/auth.ts](src/services/auth.ts) preserves older page-level API signatures while routing requests to Supabase functions.

Messaging is implemented separately in [src/services/chat.ts](src/services/chat.ts) and exposed globally through [src/contexts/MessagesContext.tsx](src/contexts/MessagesContext.tsx).

### Authentication And Routing

[src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) loads the authenticated Supabase user and application profile. [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) restricts routes by role. The main route map is in [src/App.tsx](src/App.tsx).

## User Roles

The database `Role` enum supports the following roles:

| Role | Primary responsibility |
| --- | --- |
| Student | Maintain a profile, browse internships, apply, manage assigned tasks, communicate, and attend meetings. |
| Recruiter | Manage organisation information and internships, review applicants, assign company supervisors, and communicate with students. |
| Supervisor | Monitor assigned internships, review student work, provide supervisor feedback, manage tasks, and communicate. |
| Faculty Coordinator | Monitor faculty-level placement activity, receive supervisor summaries, provide feedback, and communicate with supervisors. |
| Department Coordinator | Review department applications, manage department students and organisations, assign faculty coordinators, and view routed summaries. |
| Admin | Manage users, recruiters, internships, coordinators, supervisors, and platform-level requests. |

## Functional Requirements

### Authentication And Accounts

- Users must be able to register with a supported role.
- The system must create or reconcile an application profile linked to the Supabase Auth user.
- Users must be able to log in, log out, and change their password.
- Email verification and account activation must be supported where the role workflow requires it.
- Protected routes must reject users who are not authenticated or do not have the required role.
- Recruiter, supervisor, faculty coordinator, and department coordinator activation flows must preserve the account status and invitation rules defined by the database.

### Student Requirements

- Students must be able to complete onboarding information including university, department or major, and CV information.
- Students must be able to update their profile.
- Students must be able to browse active internships and view internship details.
- Students must be able to apply to internships.
- Applications may contain cover letters, CV references, skills, question answers, dates, and department coordinator support information.
- Students must be able to view application status.
- Students must be able to view assigned tasks and send progress updates.
- Students must be able to mark assigned tasks complete.
- Students must be able to invite or associate a university supervisor where enabled by the workflow.
- Students must be able to communicate through conversations and messages.
- Students must be able to view meetings and shared approved reports.

### Recruiter Requirements

- Recruiters must be able to complete organisation onboarding and submit verification information.
- Recruiters must be able to manage company profile information.
- Recruiters must be able to create, update, and delete their own internships.
- Recruiters must be able to view applicants for their internships.
- Recruiters must be able to review applications and update permitted application statuses.
- Recruiters must be able to assign active company supervisors to accepted internship applications.
- Recruiters must be able to communicate with students.
- Recruiters must be able to create or manage meetings with students.

### Supervisor Requirements

- Supervisors must be able to activate an invited supervisor account.
- Supervisors must see only internships assigned to them.
- Supervisors must be able to view assigned students.
- Supervisors must be able to review weekly reports.
- Supervisors must be able to approve reports or request changes with a supervisor comment.
- Supervisors must be able to assign or manage student tasks where supported by the page workflow.
- Supervisors must be able to communicate with participants.

### Faculty Coordinator Requirements

- Faculty coordinators must see a real-data overview of scoped students, active internships, unplaced students, pending applications, open tasks, and student updates.
- Faculty coordinators must be able to view departments in their assigned scope.
- Faculty coordinators must be able to view assigned students as cards.
- Each assigned-student card must provide a details and management action.
- Student details must show real profile, department, assignment, placement, supervisor, and report information.
- Faculty coordinators must be able to start a real conversation with an assigned student.
- Faculty coordinators must be able to receive period-based summaries generated from supervisor tasks.
- Faculty coordinators must be able to send persistent feedback to company supervisors.
- Faculty coordinators and company supervisors must be able to open direct conversations.
- Faculty coordinators must be able to refresh displayed data.

### Department Coordinator Requirements

- Department coordinators must be able to view department-level overview information.
- Department coordinators must be able to review applications requiring department approval.
- Department coordinators must be able to view students and their placements.
- Department coordinators must be able to view organisations hosting students.
- Department coordinators must be able to assign faculty coordinators to eligible students.
- Department coordinators must be able to assign supervisors where supported by the workflow.
- Department coordinators must be able to view task-based summaries for their routed students, including students without a faculty assignment.
- Department coordinators must be able to communicate with faculty coordinators, students, and other permitted participants.

### Administrator Requirements

- Administrators must be able to view platform statistics and recent activity.
- Administrators must be able to manage users.
- Administrators must be able to manage recruiter verification.
- Administrators must be able to manage internships.
- Administrators must be able to manage supervisor records.
- Administrators must be able to review coordinator requests and invitations.

### Communication Requirements

- Users must be able to participate in conversations they belong to.
- Messages must be stored in the database rather than only in browser state.
- Conversation lists must show real participants and message history.
- New messages should be reflected through Supabase Realtime when the table is enabled for realtime.
- The application must retain a polling fallback for message freshness.

### File And Report Requirements

- Uploaded files must be stored in Supabase Storage.
- Sensitive files should use signed URLs where appropriate.
- Weekly reports must preserve the student, internship, week, content, review status, reviewer, comments, and timestamps.
- Report review transitions must follow the defined multi-stage status workflow.

## Non-Functional Requirements

### Security

- All protected application routes must require authentication.
- Role authorization must be enforced both in the frontend route guard and in Supabase RLS policies.
- Users must only read or modify records permitted by their role, ownership, assignment, or scope.
- Users must not be able to submit records on behalf of another student.
- Recruiters must only manage their own internships, applicants, and related reports.
- Supervisors must only access assigned internships and related reports.
- Coordinator access must respect institution, faculty, department, and direct student assignments.
- Secrets must not be committed to the repository. Frontend environment variables must contain only public Supabase client configuration.
- Uploaded file access must use the appropriate public or signed URL policy.

### Availability And Reliability

- The frontend should fail with a useful error state when a Supabase request fails.
- Pages that load remote data should expose loading and empty states.
- Realtime messaging should degrade gracefully to polling when realtime delivery is unavailable.
- Database migrations should be additive and safe to rerun where possible.
- Critical database operations should validate status transitions and ownership server-side through RLS and query conditions.

### Performance

- Initial page loads should avoid unnecessary broad queries where a scoped query is available.
- Frequently reused data access should remain in service functions rather than being duplicated across pages.
- Large lists should be prepared for pagination or incremental loading as data volume grows.
- Production builds should be optimized through Vite bundling and PWA asset generation.

### Usability And Accessibility

- Role dashboards should use terminology appropriate to the responsible user.
- Forms must expose validation and actionable error messages.
- Interactive controls must have visible labels or accessible icon semantics.
- Layouts must work on desktop and mobile widths.
- Loading, empty, success, and failure states must be visually distinguishable.
- Destructive or irreversible operations should require an intentional user action.

### Maintainability

- Shared database access should remain centralized in service modules.
- Shared UI primitives should use the existing component library.
- New role-specific pages should be mounted under the appropriate protected layout.
- Database changes should be recorded as migrations and reflected in the schema documentation.
- Tests should cover business logic, critical API transformations, and high-risk workflows.

## Application Routes

### Public Routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing or entry page. |
| `/login` | Authentication. |
| `/register` | Account registration. |
| `/install` | PWA installation information. |
| `/change-password` | Authenticated password change. |
| `/supervisor/activate/:token` | Supervisor invitation activation. |
| `/coordinator/activate/:token` | Coordinator activation workflow. |

### Student Routes

| Route | Purpose |
| --- | --- |
| `/student` | Student overview. |
| `/student/profile` | Student profile and onboarding data. |
| `/student/internships` | Browse internships. |
| `/student/internships/:id` | Internship details. |
| `/student/internships/:id/apply` | Internship application. |
| `/student/applications` | Student applications. |
| `/student/tasks` | Assigned tasks and progress updates. |
| `/student/messages` | Student conversations. |
| `/student/meetings` | Student meetings. |

### Recruiter Routes

| Route | Purpose |
| --- | --- |
| `/recruiter` | Recruiter overview. |
| `/recruiter/profile` | Organisation profile. |
| `/recruiter/post` | Create an internship. |
| `/recruiter/manage` | Manage internships. |
| `/recruiter/applicants` | Review applicants. |
| `/recruiter/messages` | Recruiter conversations. |
| `/recruiter/meetings` | Recruiter meetings. |

### Supervisor Routes

| Route | Purpose |
| --- | --- |
| `/supervisor` | Supervisor overview. |
| `/supervisor/students` | Assigned students. |
| `/supervisor/students/:studentId` | Student details. |
| `/supervisor/students/:studentId/tasks` | Student tasks. |
| `/supervisor/summaries` | Generate task-based summaries and send them to faculty coordinators. |
| `/supervisor/messages` | Supervisor conversations. |

### Faculty Coordinator Routes

| Route | Purpose |
| --- | --- |
| `/faculty-coordinator` | Faculty overview. |
| `/faculty-coordinator/departments` | Faculty-scoped departments. |
| `/faculty-coordinator/reports` | Receive supervisor summaries, send feedback, and message supervisors. |
| `/faculty-coordinator/messages` | Faculty coordinator conversations. |
| `/faculty-coordinator/students` | Assigned student cards. |
| `/faculty-coordinator/students/:studentId` | Student details and management actions. |
| `/faculty-coordinator/placements` | Assigned-student placement table. |

### Department Coordinator Routes

| Route | Purpose |
| --- | --- |
| `/department-coordinator` | Department overview. |
| `/department-coordinator/internship-approval` | Department application review. |
| `/department-coordinator/students` | Department students. |
| `/department-coordinator/faculty-coordinators` | Faculty coordinator assignments. |
| `/department-coordinator/organisations` | Hosting organisations. |
| `/department-coordinator/summaries` | View summaries for routed students, including fallback visibility. |
| `/department-coordinator/placements` | Department placement view. |

## Core Workflows

### Registration And Onboarding

1. A user registers through the frontend.
2. Supabase Auth creates the authentication identity.
3. The database trigger or profile service creates or reconciles the matching `User` record.
4. The user verifies email when required.
5. Role-specific onboarding collects profile, organisation, or coordinator information.
6. Protected routing uses the profile role and approval state to determine access.

### Internship Application

1. A student browses active internships.
2. The student opens internship details and submits an application.
3. The application stores the student, internship, optional department coordinator, supporting documents, and application metadata.
4. If department review is required, the application enters the department review workflow.
5. After department approval, the application can continue to organisation review.
6. Recruiters update the application through permitted statuses.

### Task-Based Progress Reporting

1. A recruiter assigns an active company supervisor to an accepted internship.
2. The supervisor assigns tasks to the student with a due date and priority.
3. The student views tasks from the Tasks tab, sends progress updates, and marks work complete.
4. The supervisor reviews task completion and student updates.
5. The supervisor generates a summary for this week, this month, or last month.
6. The summary is sent to the assigned faculty coordinator.
7. The faculty coordinator sends feedback and can open a direct conversation with the supervisor.
8. Department coordinators can view summaries for their routed students when no faculty assignment exists.

### Faculty Coordinator Assignment

1. A department or administrative workflow creates a `CoordinatorAssignment` record.
2. The assignment may define institution, faculty, department, or a direct `studentId`.
3. The assignment becomes visible to the faculty coordinator when its status is active and the scope matches.
4. Faculty pages query affiliations and assignments to calculate the visible student set.
5. Faculty coordinators can inspect assigned students, communicate, review eligible reports, and forward completed reports.

### Messaging

1. A user starts or opens a conversation with another permitted user.
2. A `Conversation` record and two `ConversationParticipant` records are created if no shared conversation exists.
3. Messages are stored in `Message`.
4. The `MessagesContext` loads conversations, tracks unread messages, and maintains the selected conversation.
5. Supabase Realtime delivers new messages when configured; polling provides a fallback.

### Meetings

Meetings associate students and recruiters through the `Meeting` table. The application stores the title, scheduled time, type, status, participants, and timestamps. Agora token generation is handled by the `agora-token` Edge Function when calling functionality is used.

## Database Design

The canonical schema is [supabase/schema.sql](supabase/schema.sql). The database uses text primary keys, camelCase column names, PostgreSQL enums, foreign keys, timestamps, and RLS policies.

### Enumerations

#### `Role`

`STUDENT`, `RECRUITER`, `ADMIN`, `SUPERVISOR`, `FACULTY_COORDINATOR`, `DEPARTMENT_COORDINATOR`.

#### `RecruiterStatus`

`PENDING`, `APPROVED`, `REJECTED`.

#### `InternshipStatus`

`ACTIVE`, `CLOSED`, `DRAFT`.

#### `ApplicationStatus`

`pending`, `accepted`, `rejected`, `reviewing`.

### Main Tables

| Table | Purpose | Important relationships |
| --- | --- | --- |
| `User` | Application profile linked to Supabase Auth. Stores role, identity, CV, university, major, organisation fields, and approval state. | Referenced by most user-owned records. |
| `Institution` | University or institution record. | Parent of faculties, departments, and affiliations. |
| `FacultySchool` | Faculty or school within an institution. | Belongs to `Institution`; parent of departments. |
| `Department` | Academic department. | Belongs to an institution and optionally a faculty. |
| `StudentInstitutionAffiliation` | Connects a student to an institution, faculty, and department. | References `User`, `Institution`, `FacultySchool`, and `Department`. |
| `Internship` | Internship opportunity posted by a recruiter. | References recruiter and optional company supervisor. |
| `Application` | Student application for an internship. | References student, internship, and optional department coordinator. |
| `SupervisorTask` | Persistent task assignment, completion, priority, and student update. | References student, supervisor, and internship. |
| `SupervisorSummary` | Period-based supervisor summary and faculty feedback. | References student, supervisor, faculty coordinator, and internship. |
| `CoordinatorAssignment` | Institution, faculty, department, or direct student coordinator assignment. | References coordinator, assigning user, student scope, and academic scope. |
| `Conversation` | Chat container and last activity timestamp. | Has many participants and messages. |
| `ConversationParticipant` | User membership in a conversation. | References conversation and user. |
| `Message` | Individual chat message. | References conversation and sender. |
| `Meeting` | Scheduled student-recruiter meeting. | References student and recruiter. |
| `SupervisorInvitation` | Invitation and activation record for a university or company supervisor. | References student, optional internship, and activation user. |
| `CoordinatorInvitation` | Invitation and activation record for coordinators. | References creator and activation user. |

### Key Relationships

```text
Institution
	-> FacultySchool
			-> Department
					-> StudentInstitutionAffiliation <- User (student)

User (recruiter)
	-> Internship
			-> Application <- User (student)
			-> SupervisorTask <- User (student)
			-> SupervisorSummary <- User (student)
			-> User (supervisor)

User (coordinator)
	-> CoordinatorAssignment

Conversation
	-> ConversationParticipant -> User
	-> Message -> User (sender)
```

### Important Columns

#### `User`

- `id`: text primary key, normally matching the Supabase Auth user ID.
- `role`: application role enum.
- `name`, `email`: identity fields.
- `cvUrl`: stored CV path or URL.
- `university`, `major`: student academic information.
- `company`, `industry`, and organisation fields: recruiter information.
- `isApproved`, `coordinatorStatus`, `recruiterStatus`: activation and approval state.

#### `Application`

- `studentId`, `internshipId`: required ownership and target references.
- `status`: organisation application state.
- `departmentCoordinatorId`: selected department coordinator where applicable.
- `departmentReviewStatus`, `departmentApprovalRequired`, and `coordinatorSupportRequested`: workflow fields added by migrations.
- `resumeUrl`, `coverLetterUrl`, `coverLetter`, and question-answer fields: submitted application data.

#### `SupervisorTask`

- `studentId`, `supervisorId`, `internshipId`: assignment ownership.
- `title`, `dueDate`, `priority`, `status`: task workflow fields.
- `studentUpdate`, `studentUpdatedAt`: progress communication from the student.
- `completedAt`: completion timestamp.

#### `SupervisorSummary`

- `periodStart`, `periodEnd`, `title`, `summary`: generated reporting content.
- `facultyCoordinatorId`: recipient assignment.
- `facultyFeedback`, `facultyFeedbackAt`: response from the faculty coordinator.

## Security And Access Control

### Frontend Authorization

Routes are wrapped with [ProtectedRoute.tsx](src/components/ProtectedRoute.tsx), which checks authentication and the normalized application role before rendering a portal.

### Database Authorization

Frontend checks are not the security boundary. Supabase RLS policies enforce access on the database tables. Examples include:

- Students read and create their own applications and update their assigned tasks.
- Recruiters read and update applications and internships associated with their own internships.
- Supervisors read and update tasks and summaries associated with internships assigned to them.
- Coordinators read data within institution, faculty, department, or direct student scope.
- Conversation participants read only conversations and messages to which they belong.
- Administrators manage platform records according to admin policies.

The scope helper functions in the schema and coordinator migrations avoid recursive RLS checks when resolving the current user's role and affiliations.

### Storage Security

File upload and retrieval are implemented through [src/services/supabase-api.ts](src/services/supabase-api.ts). Private files should be accessed through signed URLs. Storage policies are defined in [supabase/migrations/20240103_storage_upload_policies.sql](supabase/migrations/20240103_storage_upload_policies.sql).

### Realtime Security

Message subscriptions run through Supabase Realtime. Database read policies still determine which records a participant can retrieve; realtime is not intended to bypass RLS.

## Project Structure

```text
internship-connect-ui/
├── public/                         Static files and robots.txt
├── src/
│   ├── api/                        API compatibility and tests
│   ├── components/                 Shared UI, layouts, chat, and guards
│   ├── contexts/                   Auth, messages, and call state
│   ├── data/                       Small application data modules
│   ├── hooks/                      Reusable React hooks
│   ├── lib/                        Supabase config, navigation, status helpers
│   ├── pages/                      Public and role-specific pages
│   ├── services/                   Supabase, chat, auth, upload, and Agora logic
│   ├── test/                       Test setup and examples
│   └── types/                      Shared TypeScript types
├── supabase/
│   ├── functions/                  Supabase Edge Functions
│   ├── migrations/                 Incremental database changes
│   ├── deno.json                   Edge Function configuration
│   └── schema.sql                  Canonical schema and baseline policies
├── package.json                    Scripts and dependencies
├── vite.config.ts                  Vite configuration
├── vitest.config.ts                Test configuration
├── tailwind.config.ts              Tailwind configuration
└── netlify.toml                    Netlify build and SPA redirects
```

## Local Development

### Prerequisites

- Node.js 20 or later. Netlify is configured to use Node 20.
- npm.
- A Supabase project.
- Supabase project URL and anonymous key.
- Optional Agora credentials and deployed Edge Function for calling.

### Install

```sh
git clone <repository-url>
cd internship-connect-ui
npm install
```

### Configure Environment

Create a `.env.local` file in `internship-connect-ui` and add the variables described in [Environment Variables](#environment-variables).

### Start Development

```sh
npm run dev
```

Vite will print the local URL, normally `http://localhost:5173`.

### Production Build

```sh
npm run build
```

### Preview Production Build

```sh
npm run preview
```

## Environment Variables

The frontend reads these values through `import.meta.env`:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anonymous client key. |
| `VITE_SITE_URL` | Recommended | Deployed site URL used for share links and email callbacks. |

Example:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_SITE_URL=https://your-domain.example
```

Do not place service-role keys, database passwords, private Agora secrets, or email provider credentials in frontend environment variables. Those belong in Supabase project or Edge Function secrets.

## Supabase Setup

### Baseline Schema

The baseline schema is in [supabase/schema.sql](supabase/schema.sql). It creates or updates the core enums, tables, RLS policies, helper functions, grants, and signup trigger.

Apply it in the Supabase SQL editor for a new or compatible project.

### Migrations

The migration directory contains incremental changes for:

- Profile RLS and signup reconciliation.
- Realtime messages.
- Storage upload policies.
- Supervisor role, task assignment, and task completion.
- Department coordinator registration and application review.
- Institution, faculty, department, and affiliation access.
- Student-to-faculty-coordinator and supervisor assignments.
- Selected department coordinator support.
- Faculty coordinator invitations and activation behavior.
- Temporary faculty passwords and approved coordinator scopes.
- Period-based supervisor summaries and faculty feedback.

Apply migrations in filename order. Do not apply only a late migration to a database that has not received the earlier schema or helper functions it depends on.

The task and summary migrations are [supabase/migrations/20240201_supervisor_tasks.sql](supabase/migrations/20240201_supervisor_tasks.sql) and [supabase/migrations/20240202_supervisor_summaries.sql](supabase/migrations/20240202_supervisor_summaries.sql).

### Edge Functions

The repository includes these Supabase Edge Function areas:

| Function | Purpose |
| --- | --- |
| `agora-token` | Generates call tokens for Agora sessions. |
| `create-faculty-coordinator` | Creates or provisions faculty coordinator accounts. |
| `invite-faculty-coordinator` | Sends or manages faculty coordinator invitations. |
| `send-email` | Sends application email notifications through the configured provider. |

Deploy functions using the Supabase CLI or the project deployment workflow. Configure provider secrets in Supabase rather than in the browser.

### Realtime

The `Message` table must be enabled for the Supabase Realtime publication for live message events. The application also polls conversations as a fallback.

## Testing And Validation

Available package scripts:

```sh
npm run test       # Run Vitest once
npm run test:watch # Run Vitest in watch mode
npm run lint       # Run ESLint
npm run build      # Create the production Vite build
```

Existing tests cover examples such as:

- API behavior.
- Chat window interactions.
- Registration logic.
- Role navigation.

Recommended additions for future changes:

- RLS integration tests for every role and table.
- Application status transition tests.
- Task ownership, completion, summary delivery, and feedback tests.
- Faculty scope filtering tests for institution, faculty, department, and direct student assignments.
- CV reuse and application-specific CV replacement tests.
- Message permission and conversation creation tests.

Before opening a pull request, run:

```sh
npm run lint
npm run test
npm run build
```

## Deployment

Netlify is configured in [netlify.toml](netlify.toml):

- Build command: `npm run build`.
- Publish directory: `dist`.
- Node version: 20.
- SPA fallback: all unmatched paths redirect to `index.html`.
- Auth callback paths under `/auth/*` redirect to `index.html` for React Router handling.

Configure the required `VITE_*` variables in the Netlify site settings. Deploy Supabase migrations and Edge Functions separately from the frontend build.

## Operational Notes And Limitations

- The frontend is a Vite single-page application; direct navigation to nested routes requires the configured SPA fallback.
- Supabase RLS policies are essential. A successful frontend build does not prove that the deployed database policies are correct.
- Existing databases may differ from the repository schema because the project has evolved through migrations. Inspect live enum and table definitions before applying corrective SQL.
- Some older pages and service functions may retain compatibility fields or fallback labels for legacy workflows.
- The current production bundle reports a large-chunk warning from Vite. Code splitting can be introduced later if startup performance becomes a concern.
- File URL visibility depends on the storage policy and whether the caller requests a public or signed URL.
- Realtime requires the relevant table to be included in the Supabase publication and may not work until that configuration is applied.
- The application should be tested with representative users for every role because RLS behavior depends on both the database role and the user's scope records.

## Contribution Guidelines

1. Keep role-specific changes inside the corresponding layout, page, service, and migration surfaces.
2. Do not bypass RLS with client-side assumptions.
3. Add a migration for database changes; do not rely on manual production edits.
4. Preserve existing public route and service contracts unless a migration plan is included.
5. Add loading, error, empty, and success states for remote workflows.
6. Avoid hard-coded production data in pages or dashboard metrics.
7. Run lint, tests, and the production build before submitting a change.

## License And Ownership

No license is declared in the current repository. Add an explicit license before distributing the project outside its owning organisation.

