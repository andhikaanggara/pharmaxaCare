# 🏥 Pharmaxa Care

A high-performance, real-time Clinical & Pharmacy Management System engineered to eliminate administrative overhead, streamline patient logs, and eradicate manual spreadsheet tracking in healthcare facilities.

> **Production Status:** Core modules—including **Staff Attendance Engine**, **Patient Visit Logging**, and **Master Data Management (Staff, Patient, & Role Configurations)**—are fully operational and integrated with a relational Supabase database architecture.

---

## 🚀 Business Impact & Metrics (Why This Matters)

- **1-Click Payroll & Attendance Preparation:** Converts manual, error-prone spreadsheets into an **instant 1-click process**, generating pre-formatted multi-sheet Excel workbooks with automated formulas.
- **Smart Cut-Off Cycle:** Automatically aligns with clinical SOPs by defaulting views and exports to custom reporting cycles (e.g., 28th past month – 27th current month).
- **Streamlined Patient Tracking:** Replaces manual paper/spreadsheet patient logs with structured relational records to accelerate daily clinic administration and audits.

---

## ✨ Key Features & Active Modules

### 1. 📅 Staff Attendance & Shift Engine

- **Relational Multi-Staff Shifts:** Handles complex medical shift patterns (Pagi, Sore, Malam) mapped dynamically across distinct healthcare professional roles.
- **Dynamic Relational Aggregation:** Converts row-based PostgreSQL entries into streamlined shift data for multi-role medical staff configurations.
- **Automated Excel Export (`exceljs`):** Compiles live attendance records into downloadable multi-sheet Excel workbooks—dynamically generating **1 dedicated sheet per staff member** with native Excel summary formulas (`=SUM()`).

### 2. 📋 Patient Visit & Master Log

- **Centralized Visit Records:** Tracks daily patient arrivals, assigned medical staff, visit timestamps, and service categories.
- **Master Patient Management:** Structured registry for patient demographic data, medical record indexing, and visit histories.

### 3. 👥 Master Staff & Dynamic Role Management

- **Staff Directory:** Tracks clinical personnel, employment statuses, and dynamic role assignments under strict TypeScript typings.
- **Relational Role Schema:** Scalable relational model defining healthcare facility departments (e.g., Apoteker, Dokter, Asisten Apoteker, Perawat) to feed dynamic frontend forms.

---

## 🛠️ Technical Implementation Highlights

- **Framework:** Next.js 14/15 (App Router) utilizing Server Components for data fetching paired with interactive Client Component states.
- **Forms & Validation:** Built using **React Hook Form** paired with **Zod Schema validation**, ensuring type-safe, resilient client-side controls.
- **Database & Persistence:** **Supabase (PostgreSQL)** leveraging deep relational schemas, Foreign Key constraints (`attendance_staff_id_fkey`), and automated primary key UUID generations.
- **UI & Component Architecture:** Styled with **Tailwind CSS** and **Shadcn UI**, featuring generic, highly reusable UI modules like programmatic modal shells (`FormDialogShell`, `ConfirmDeleteDialog`) and strict generic type-safe inputs (`InputCombobox<T>`).

---

## 📦 Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI (Radix UI)
- **Forms & Validation:** React Hook Form, `@hookform/resolvers`, Zod
- **Data Engineering & Export:** Supabase JS Client, ExcelJS, File-Saver, Date-fns
- **Icons & Styling:** Lucide React, Tailwind Merge, CLSX

---

## 🛣️ Production & Feature Roadmap

- [x] Multi-sheet automated Excel reporting engine (1 sheet per staff).
- [x] Master Staff, Role Configuration, and Attendance management modules.
- [x] Patient Visit & Master Log entry system.
- [ ] **In Progress:** Patient Treatment & Procedure Recording Module (_Pencatatan Tindakan Pasien_).
- [ ] **Planned:** Daily Financial Summary & Automated WhatsApp Export Engine.
- [ ] **Planned:** Role-Based Access Control (RBAC) & Authorization Middleware.
- [ ] **Planned:** Clinic POS (Point of Sale) & Drug Procurement / Inventory System.

---

## 🌐 Live Demo & Deployment

The application is deployed and updated live. You can explore the active relational tables, test the form validations, and evaluate the 1-click Excel export functionality:

🔗 **Live Production URL:** [https://rahayu-medika.vercel.app/](https://rahayu-medika.vercel.app/)
