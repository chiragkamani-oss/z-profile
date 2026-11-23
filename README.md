# Zprofile Node

Zymr's modern enterprise employee profile builder and talent management platform. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, and **Prisma ORM** connecting to the existing MySQL / WordPress database.

## Tech Stack

* **Runtime**: Node.js v20.x LTS
* **Framework**: Next.js 16 (App Router with Server Components & Server Actions)
* **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
* **ORM**: Prisma ORM v5 (connected to MySQL / MariaDB)
* **Auth**: NextAuth.js with JWT sessions and WordPress credentials verification
* **Validation**: Zod + React Hook Form
* **Linting & Code Quality**: ESLint + Prettier + Husky (pre-commit hooks)
* **Containerization**: Multi-stage hardened Dockerfile (`node:20-alpine`, non-root user)

## Getting Started

### 1. Prerequisites
* Node.js `>= 20.x`
* npm `>= 10.x`
* Existing MySQL / MariaDB instance running WordPress schema

### 2. Environment Setup
Copy the example environment file and configure your database credentials:
```bash
cp .env.example .env.local
```
Update `DATABASE_URL` with your database connection string:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
NEXTAUTH_SECRET="your-32-character-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quality & Security Commands

```bash
npm run build         # Production build with type-checking
npm run lint          # Run ESLint rules
npm run format        # Run Prettier code formatting
npm run format:check  # Check code format compliance
```

## Commit Convention

End all commit messages with:
```text
Authored-By: Zymr, Inc.
```
