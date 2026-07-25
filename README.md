# 🏥 Pharmaxa Care
A high-performance, real-time Clinical & Pharmacy Management System engineered to eliminate administrative overhead, streamline patient logs, and eradicate manual spreadsheet tracking in healthcare facilities.
> **Production Status:** Core modules—including **Staff Attendance Engine**, **Master Data Management (Staff, Patient, Role, & Treatment Configurations)**, and **Custom Cut-Off Excel Export Engine**—are fully operational and integrated with a relational Supabase database architecture.

===

## 🚀 Business Impact & Metrics (Why This Matters)
- **1-Click Payroll & Attendance Preparation:** Converts manual, error-prone spreadsheets into an **instant 1-click process**, generating pre-formatted multi-sheet Excel workbooks with automated native formulas.
- **Smart Cut-Off Cycle (28th–27th):** Automatically aligns with clinical payroll and SOP cycles by defaulting views and exports to a custom reporting date range (28th of previous month to 27th of current month).
- **Streamlined Patient & Clinical Management:** Replaces paper and spreadsheet logs with structured relational records to accelerate daily clinic administration, audits, and treatment tracking.

===

## ✨ Key Features & Active Modules
### 1. 📅 Staff Attendance Engine & Smart Cut-Off
- **Custom Date Range Filtering:** Automatically presets and filters attendance records to match the clinical payroll window (28th past month – 27th current month).
- **Relational Multi-Staff Shifts:** Handles complex medical shift patterns (Pagi, Sore, Malam) dynamically mapped across distinct healthcare professional roles.
- **Automated Excel Export (`exceljs`):** Compiles filtered attendance records into downloadable multi-sheet Excel workbooks—dynamically generating **1 dedicated sheet per staff member** with native Excel summary formulas (`=SUM()`).

### 2. 📋 Patient Visit & Treatment Logging
- **Master Treatment Registry:** Centralized configuration for medical procedures, service costs, and clinical treatment categories.
- **Patient Visit Management (In Refactoring):** Comprehensive input form connecting patient records with specific assigned healthcare staff and clinical treatments/procedures.

### 3. 👥 Master Data Architecture (Staff, Patient, Role, & Treatment)
- **Comprehensive Master Registers:** Fully functional CRUD modules for **Patients**, **Staff**, **Roles**, and **Treatments/Procedures**.
- **Relational Role Schema:** Scalable relational model defining healthcare facility departments (e.g., Apoteker, Dokter, Asisten Apoteker, Perawat) to feed dynamic frontend forms.
- **Strict Type Safety:** Enterprise-grade TypeScript interfaces mapping all Supabase relational schema entities.

===

## 🛠️ Technical Implementation Highlights
- **Framework:** Next.js 14/15 (App Router) utilizing Server Components for optimal server-side data fetching paired with interactive Client Component states.
- **Forms & Validation:** Built using **React Hook Form** paired with **Zod Schema validation**, ensuring type-safe, resilient client-side controls for complex clinical data entry.
- **Database & Persistence:** **Supabase (PostgreSQL)** leveraging deep relational schemas, Foreign Key constraints (`attendance_staff_id_fkey`), and automated primary key UUID generations.
- **UI & Component Architecture:** Styled with **Tailwind CSS** and **Shadcn UI**, featuring generic, highly reusable UI modules like programmatic modal shells (`FormDialogShell`, `ConfirmDeleteDialog`) and strict generic type-safe inputs (`InputCombobox<T>`).

===

## 📦 Tech Stack
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI (Radix UI)
- **Forms & Validation:** React Hook Form, `@hookform/resolvers`, Zod
- **Data Engineering & Export:** Supabase JS Client, ExcelJS, File-Saver, Date-fns
- **Icons & Styling:** Lucide React, Tailwind Merge, CLSX

===

## 🛣️ Production & Feature Roadmap
- [x] Multi-sheet automated Excel reporting engine (1 sheet per staff member).
- [x] Custom payroll cut-off cycle integration (28th previous month – 27th current month).
- [x] Master Staff, Master Role, Master Patient, and Master Treatment modules.
- [ ] **In Progress:** Patient Visit & Treatment/Procedure Input Form Refactoring.
- [ ] **Planned:** Daily Financial Summary & Automated WhatsApp Export Engine.
- [ ] **Planned:** Role-Based Access Control (RBAC) & Authorization Middleware.
- [ ] **Planned:** Clinic POS (Point of Sale) & Drug Procurement / Inventory System.

===

## 🌐 Live Demo & Deployment

The application is deployed and updated live. You can explore the active relational tables, test the form validations, and evaluate the 1-click Excel export functionality:

🔗 **Live Production URL:** [https://pharmaxacare.vercel.app//](https://pharmaxacare.vercel.app/)