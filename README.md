# Murang'a County Public Service Request System

Official public service request and municipal incident tracking portal for Murang'a County citizens and administrative officers.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui**, and **Supabase (PostgreSQL with Row Level Security, Auth, and Storage)**.

---

## 🌟 Key Features

### For Citizens (Applicant Portal)
- **Account Registration & Verification:** Secure multi-step signup with Kenyan National ID and phone verification, protected by Supabase Auth with custom-branded confirmation emails.
- **Service Request Reporting:** Submit municipal issues across 7 official categories:
  - 💡 Broken streetlights & dark walkways
  - 💧 Water supply & pipe leakages
  - 🗑️ Waste & garbage collection
  - 🚧 Roads and potholes
  - 🏥 Public Health & Sanitation
  - 🏫 Education & Public Facilities
  - 🏛️ Other municipal concerns
- **Photo Uploads:** Direct client-side image compression and upload to secure Supabase Storage buckets.
- **Real-Time Request Tracking:** Track submitted tickets with color-coded live progress badges (`Pending` &rarr; `In Progress` &rarr; `Resolved`).

### For Municipal Officers (Admin Portal)
- **Services Received Dashboard (`/admin`):** Centralized officer view with strict server-side role verification and PostgreSQL Row Level Security (RLS) isolation.
- **Live Key Performance Metrics (KPIs):** Instant calculation of Total Requests, Open Issues, Resolved Tickets, and County Resolution Rate.
- **Proportional Category Breakdown:** Accessible CSS progress bars and metrics across all 7 municipal categories.
- **Filter & Search Engine:** Instant keyword search across citizen names, phone numbers, ID numbers, locations, and status filters.
- **State Transition Machine:** One-click forward transitions (`Pending` &rarr; `In Progress` &rarr; `Resolved`) with automatic cache revalidation (`revalidatePath`).

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.4 (App Router & Server Actions)
- **Frontend & Styling:** React 19, Tailwind CSS v4, Lucide Icons, shadcn/ui
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth SSR, Supabase Storage)
- **Security:** PostgreSQL Row Level Security (RLS) policies enforcing citizen data isolation and officer authorization
- **Language:** TypeScript (strict mode)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/gerimelanic/public-service-request-system.git
cd public-service-request-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create a `.env.local` file in the project root (see `.env.example`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Database Schema Setup
Execute the complete database initialization script in your **Supabase Project &rarr; SQL Editor**:
- Run the schema from [`supabase/schema.sql`](./supabase/schema.sql).
- This sets up tables (`profiles`, `service_requests`), indexes, RLS security policies, and the `request-images` storage bucket.

### 5. Custom Email Templates (Optional)
To brand your confirmation and password reset emails to match the county theme:
- Follow the instructions in [`supabase/templates/README.md`](./supabase/templates/README.md).

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security Architecture

Row Level Security (RLS) is active across all tables in PostgreSQL:
- **Citizens:** Restricted by Postgres policies to only SELECT their own submitted rows (`auth.uid() = citizen_id`).
- **Officers/Admins:** Elevated policies allow verified admins to read and advance all county-wide requests.
- **Public:** Landing page and public portal brand assets are globally viewable.

---

## 📜 License

Created for Murang'a County Government Public Services. All rights reserved.
