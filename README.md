# AI Data Contract & Schema Drift Monitor

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/Backend-NestJS%2010-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **AI-assisted data contract monitoring that detects schema and data-quality drift, maps affected consumers, and proposes explainable migration plans with approval gates.**

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Key Product Features](#key-product-features)
4. [Public Access & Security Governance](#public-access--security-governance)
5. [Integrations: Real vs. Fallback Status](#integrations-real-vs-fallback-status)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Deployment Guide](#deployment-guide)
   - [Render (Backend API)](#render-backend-api)
   - [Vercel (Frontend Console)](#vercel-frontend-console)
8. [Local Development & Testing](#local-development--testing)
9. [Smoke Testing & Verification Guide](#smoke-testing--verification-guide)
10. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Overview

Modern data platforms suffer from silent schema breakage when upstream microservices alter payloads without coordinating with downstream analytics, machine learning, and business intelligence consumers.

The **AI Data Contract & Schema Drift Monitor** establishes enforceable contracts between data producers and consumers. It monitors schema snapshots, calculates semantic breaking changes, audits data-quality constraints, traces field-level blast radius across registered consumers, synthesizes AI migration plans with SQL DDL and TypeScript types, and enforces multi-signature human approval gates before contract evolution is promoted.

---

## Architecture

The system is decoupled into an enterprise **NestJS** backend service (hosted on Render) and a modern **Next.js 14** web console (hosted on Vercel), backed by dual-mode persistence and shared cloud integrations.

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer (Responsive 320px - 1440px)"]
        Browser["Desktop & Mobile Web Console\n(Next.js 14 App Router / React 18)"]
    end

    subgraph HostingFrontend["Vercel Edge Platform"]
        NextServer["Next.js SSR / Static Frontend\n(Vercel Deployment)"]
    end

    subgraph HostingBackend["Render Web Service"]
        NestApp["NestJS Backend Application\n(0.0.0.0:$PORT / Global Validation Pipe)"]
        
        subgraph CoreEngines["Core Domain Engines"]
            ContractMgr["Contract Registry & JSON Schema Draft-07"]
            DriftEngine["Drift Classifier (Breaking / Risky / Safe)"]
            QualityEngine["Data-Quality Rule Engine"]
            LineageEngine["Field-Level Lineage & Consumer Impact"]
            ApprovalEngine["Multi-Approval Governance Gates"]
            AuditEngine["Immutable Audit Trail"]
        end
        
        Guard["PublicAccessGuard & RolesGuard\n(PUBLIC_ACCESS_ENABLE Flag)"]
    end

    subgraph ExternalServices["External Shared Services & Persistence"]
        RailwayAI["Railway AI Platform\nPOST /api/v1/ai/chat\n(Fallback: Deterministic Synthesizer)"]
        RailwayNotify["Railway Notification Service\nPOST /v1/notifications\n(Fallback: Audit Dispatcher)"]
        RailwayRedis["Railway Redis\n(Fallback: In-Memory TTL Cache)"]
        MongoDB["MongoDB Cluster\n(Fallback: In-Memory ACID Store)"]
    end

    Browser -->|HTTPS| NextServer
    NextServer -->|REST API / Bearer JWT| NestApp
    NestApp --> Guard
    Guard --> CoreEngines
    NestApp -.->|Chat Completion| RailwayAI
    NestApp -.->|Alerts| RailwayNotify
    NestApp -.->|Cache / Dedup| RailwayRedis
    NestApp -->|Mongoose ODM| MongoDB
```

---

## Key Product Features

### 1. Data Contract Registry & JSON Schema Draft-07
- Full lifecycle management: create, edit, version, and inspect data contracts.
- Granular field specifications: field name, type (`string`, `number`, `integer`, `boolean`, `array`, `object`), nullability, description, and validation constraints (enums, ranges, regex).
- Schema strictness modes: `STRICT` (no unexpected fields allowed) vs `FLEXIBLE` (permits schema evolution).
- Compatibility rules: `BACKWARD`, `FORWARD`, `FULL`, or `NONE`.
- **JSON Schema Export & Import**: Native compatibility with Draft-07 JSON Schema specifications for seamless CI/CD pipeline integration.

### 2. Snapshot Ingestion & PII Sanitization
- Ingest schema snapshots and metadata without storing sensitive production data records.
- Deterministic SHA-256 fingerprinting ensures snapshot deduplication and idempotency.
- Built-in PII masking strips emails, tokens, and credit card numbers prior to telemetry processing.

### 3. Real-Time Drift Detection Engine
- Automated comparison between live ingested snapshots and active baseline contracts.
- Multi-tier classification:
  - **BREAKING**: Field removal, field type modification, or relaxing nullability on required fields.
  - **RISKY**: Introducing unexpected fields into a `STRICT` contract, or altering enum domains.
  - **NON_BREAKING**: Adding optional nullable fields in `FLEXIBLE` mode.
- Severity calculation: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
- Color-coded schema diff highlighting additions (`+`), removals (`-`), and modifications (`~`).

### 4. Data-Quality Check Scorecard
- Evaluates statistical data health alongside structural schema conformity:
  - **Null Rate Violations**: Detects when observed null percentage exceeds contract thresholds.
  - **Type Mismatch Rate**: Flags records where string-encoded numbers or malformed types occur.
  - **Value Range & Enum Violations**: Checks numeric bounds and categorical sets.
  - **Unexpected Fields**: Tallies unregistered attributes.

### 5. Field-Level Consumer Impact Topology
- Maps data contracts to downstream consuming applications and pipelines.
- Evaluates blast radius down to individual field usage.
- Categorizes impact:
  - **BLOCKING**: The consumer depends directly on fields that were deleted or had breaking type changes.
  - **DEGRADED**: The consumer reads fields subject to quality drift or strictness warnings.
  - **HEALTHY**: The consumer is unaffected by the upstream change.
- **Responsive Visualization**: Interactive node topology graph on desktop with an accessible, high-contrast card alternative on mobile screens (320px - 768px).
- *Strict Rule: Consumer relationships are never fabricated; only explicitly registered dependencies are evaluated.*

### 6. AI & Deterministic Migration Proposals
- Automatically generates semantically versioned migration proposals (e.g., `1.2.0` → `2.0.0`).
- Generates side-by-side contract diffs comparing the current baseline against the proposed contract.
- Provides production-ready migration artifacts:
  - **SQL DDL Migration Script** (`ALTER TABLE ... ADD/MODIFY/DROP COLUMN`)
  - **TypeScript Interface Definitions** for client consumers
  - **Phased Rollout Strategy** (Shadow Ingestion, Dual-Writing, Deprecation Window, Cutover)
- Leverages the Railway AI Platform with an instant deterministic synthesis engine fallback.

### 7. Human-in-the-Loop Approval Gates
- Strict governance preventing unreviewed schema evolution.
- Configurable approval thresholds (e.g., requiring 2 independent sign-offs from `ADMIN` and `DATA_OWNER`).
- Contract promotion and drift status resolution only occur once the approval gate is satisfied.

### 8. Immutable Audit Trail
- Cryptographically verifiable log of all platform events:
  - Contract revisions and schema modifications.
  - Drift detections and alert notifications.
  - Migration proposal generation.
  - Human sign-off approvals and rejections.

### 9. Interactive Demo Workspace & Simulations
- Ships with 3 pre-seeded production domain contracts:
  1. `orders_stream` (Tier-1 E-commerce Order Events)
  2. `user_identity` (Core Identity & Authentication Profile)
  3. `inventory_stock` (Warehouse Inventory & Stock Reservations)
- Four 1-click real-time simulations in the navigation banner:
  - 💥 **Simulate Breaking Drift**: Drops `total_amount` and mutates `status` type in `orders_stream`, causing critical alerts and blocking downstream BI consumers.
  - ⚠️ **Simulate Quality Drift**: Injects 28% null rate into `customer_id` violating data quality thresholds.
  - ⚡ **Simulate Risky Drift**: Adds unapproved attributes into strict-mode schema.
  - ✅ **Simulate Safe Evolution**: Adds backward-compatible optional `discount_code` field.
  - 🔄 **Reset Workspace**: Instantly restores contracts and baseline state.

---

## Public Access & Security Governance

The platform features enterprise-grade role-based access control (RBAC) backed by the `PUBLIC_ACCESS_ENABLE` feature flag.

| Mode | `PUBLIC_ACCESS_ENABLE` | Behavior |
| :--- | :--- | :--- |
| **Public Viewer Mode** | `true` | Unauthenticated public users can inspect public contracts, browse drift diffs, view consumer impact, and trigger demo simulations. Destructive operations (contract creation, updates, proposal generation, approvals) strictly require authentication. |
| **Strict Private Mode** | `false` *(Default)* | All API endpoints and dashboard tabs require a valid Bearer JWT token or internal Service API Key. |

### Pre-Configured Test Accounts (RBAC)

The application includes pre-configured personas for testing approval gates and governance:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full administrative control: approve migrations, publish contracts, delete entities, view audit logs. |
| **Data Owner** | `data_owner` | `owner123` | Domain authority: edit contracts, sign off on domain migration gates, review quality violations. |
| **Consumer Lead** | `consumer_lead` | `consumer123` | Consumer perspective: view impact topology, register consumers, request migration plans. |

---

## Integrations: Real vs. Fallback Status

To ensure zero external dependency lock-in and 100% test reliability in air-gapped or CI environments, every external integration implements a robust dual-mode adapter:

| Integration | Verified Endpoint / Protocol | Verified Credentials / Headers | Active Strategy / Fallback |
| :--- | :--- | :--- | :--- |
| **Railway AI Platform** | `POST /api/v1/ai/chat` | `x-api-key: <AI_PLATFORM_API_KEY>`<br>`Payload: { applicationId, tenantId, message, systemInstruction }` | Connects to live AI endpoint if reachable. Automatically falls back to deterministic rule-based migration generator if offline or unconfigured. |
| **Railway Notification Service** | `POST /v1/notifications` | `x-api-key: <NOTIFICATION_SERVICE_API_KEY>`<br>`Payload: { to, channel, subject, message }` | Dispatches email/push alerts to on-call engineers. Automatically falls back to internal audit trail logger if offline or unconfigured. |
| **Railway Redis** | `redis://<host>:<port>` | Standard Redis AUTH via `REDIS_URL` | Uses Redis for snapshot deduplication and query cache. Automatically falls back to in-memory TTL map store if Redis is unavailable. |
| **Database Persistence** | MongoDB Wire Protocol | Mongoose connection via `MONGODB_URI` | Connects to MongoDB when URI is provided. Automatically falls back to in-memory ACID collection store (no ephemeral local disk files used). |
| **Data Source Connectors** | Manual JSON Schema / Payload Ingestion | REST API `POST /api/v1/snapshots/ingest` | Real snapshot ingestion and demo simulation are fully active. Live streaming Kafka/CDC connectors require enterprise broker credentials. |

---

## Environment Variables Reference

Create a `.env` file in the root or set these variables in your deployment dashboard:

```bash
# ------------------------------------------------------------------------------
# Backend Runtime & Server
# ------------------------------------------------------------------------------
NODE_ENV=production                               # production | development | test
PORT=4000                                         # Backend listen port (Render injects $PORT)
API_PREFIX=api/v1                                 # Global API prefix
CORS_ORIGIN=*                                     # Allowed CORS origins (e.g., https://your-frontend.vercel.app)

# ------------------------------------------------------------------------------
# Security & Access Control
# ------------------------------------------------------------------------------
PUBLIC_ACCESS_ENABLE=false                        # "true" allows public read-only viewer mode; "false" enforces strict auth
JWT_SECRET=super-secure-secret-key-min-32-chars   # Secret for JWT signing
OPERATOR_ADMIN_PASSWORD=admin123                  # Initial password for operator admin
SERVICE_API_KEY=service-to-service-secret-key     # Header 'x-api-key' for backend services

# ------------------------------------------------------------------------------
# Persistence & Database Strategy
# ------------------------------------------------------------------------------
# If MONGODB_URI is provided, MongoDB is used. If omitted, in-memory repository is active.
MONGODB_URI=mongodb://user:pass@host:27017/data_contracts?authSource=admin

# ------------------------------------------------------------------------------
# Railway Redis Cache (Optional)
# ------------------------------------------------------------------------------
REDIS_URL=redis://localhost:6379

# ------------------------------------------------------------------------------
# Shared Railway AI Platform (Optional)
# ------------------------------------------------------------------------------
AI_PLATFORM_URL=https://ai-platform.onrender.com
AI_PLATFORM_API_KEY=your-ai-platform-api-key

# ------------------------------------------------------------------------------
# Shared Railway Notification Service (Optional)
# ------------------------------------------------------------------------------
NOTIFICATION_SERVICE_URL=https://notification-service.onrender.com
NOTIFICATION_SERVICE_API_KEY=your-notification-service-api-key
ALERT_EMAIL_RECIPIENT=data-platform-oncall@company.internal

# ------------------------------------------------------------------------------
# Frontend Environment Variables (Next.js)
# ------------------------------------------------------------------------------
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1
NEXT_PUBLIC_APP_NAME="AI Data Contract & Schema Drift Monitor"
NEXT_PUBLIC_DEFAULT_PUBLIC_ACCESS=false
```

---

## Deployment Guide

### Render (Backend API)

The backend is configured as an independently deployable NestJS service via [`render.yaml`](render.yaml).

1. Log into your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Blueprint** and select your repository (or **New +** → **Web Service**).
3. If setting up manually, apply the following exact verified settings:
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `false` (manual promotion)
4. Configure the Environment Variables listed in the table above:
   - Ensure `PORT` is bound automatically by Render (code binds to `0.0.0.0` and `process.env.PORT`).
   - Set `PUBLIC_ACCESS_ENABLE` to `true` if public viewer mode is desired.
   - Supply `MONGODB_URI`, `REDIS_URL`, `AI_PLATFORM_API_KEY`, and `NOTIFICATION_SERVICE_API_KEY` as available.

### Vercel (Frontend Console)

The frontend is an independently deployable Next.js 14 application configured via [`frontend/vercel.json`](frontend/vercel.json).

1. Log into your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project** and import your repository.
3. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL with prefix (e.g., `https://ai-data-contract-backend.onrender.com/api/v1`).
   - `NEXT_PUBLIC_APP_NAME`: `AI Data Contract & Schema Drift Monitor`
   - `NEXT_PUBLIC_DEFAULT_PUBLIC_ACCESS`: `true` or `false` (matching your backend setting).
5. Click **Deploy**.

---

## Local Development & Testing

### Prerequisites
- Node.js `v18.x` or `v20.x` or `v22.x`
- npm `v9+` or `v10+`

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/rishank-kesarwani/ai-data-contract-schema-drift-monitor.git
cd ai-data-contract-schema-drift-monitor

# Install dependencies for both backend and frontend
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### Running Locally

```bash
# Run backend development server (starts on http://localhost:4000)
npm run start:backend

# In a separate terminal, run frontend development server (starts on http://localhost:3000)
npm run start:frontend
```

Open [http://localhost:3000](http://localhost:3000) to view the console. Swagger OpenAPI documentation is available at [http://localhost:4000/docs](http://localhost:4000/docs).

### Running Tests & Linting

```bash
# Run all unit tests (NestJS + Next.js Jest suites)
npm run test

# Run code linter across backend and frontend
npm run lint

# Compile production builds for both backend and frontend
npm run build
```

---

## Smoke Testing & Verification Guide

Follow this smoke-test checklist to verify backend and frontend functionality end-to-end:

### 1. Health Probe
```bash
curl -s http://localhost:4000/health | jq .
# Expected Output: { "status": "UP", "timestamp": "...", "database": { "status": "UP" } }
```

### 2. Public Access Status
```bash
curl -s http://localhost:4000/api/v1/auth/status | jq .
# Returns public access mode status and operator login requirements
```

### 3. List Active Data Contracts
```bash
curl -s http://localhost:4000/api/v1/contracts | jq .
# Returns 3 pre-seeded domain contracts (orders_stream, user_identity, inventory_stock)
```

### 4. Trigger Breaking Drift Simulation
```bash
curl -s -X POST http://localhost:4000/api/v1/demo/scenario/BREAKING | jq .
# Returns a CRITICAL drift report with 2 breaking changes and affected consumers
```

### 5. Verify Unauthenticated Mutation Guard
```bash
curl -s -X POST http://localhost:4000/api/v1/proposals/generate \
  -H "Content-Type: application/json" \
  -d '{"contractId":"ct_orders_stream","driftReportId":"test"}' | jq .
# Expected Output: HTTP 403 Forbidden with message "Authentication required for mutation operations"
```

### 6. Authenticate as Admin
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r .accessToken)

echo "Received JWT: ${TOKEN:0:25}..."
```

### 7. Generate Migration Proposal (Authenticated)
```bash
curl -s -X POST http://localhost:4000/api/v1/proposals/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contractId":"ct_orders_stream"}' | jq .
# Returns migration proposal with SQL DDL, TypeScript types, and pending approval gate
```

### 8. Inspect Audit Trail
```bash
curl -s http://localhost:4000/api/v1/audit \
  -H "Authorization: Bearer $TOKEN" | jq .
# Returns immutable audit entries detailing simulated drift and proposal generation
```

---

## Troubleshooting & FAQ

#### Q1: Can I run the application without Docker or a running MongoDB instance?
**Yes.** The backend includes an automated in-memory repository layer. If `MONGODB_URI` is omitted or cannot be reached, the server logs a notice and operates cleanly in memory. Durable contracts and audit records are preserved for the lifespan of the process without writing to ephemeral disk files.

#### Q2: What happens if the Railway AI Platform service is offline?
The backend's `AIPlatformAdapter` executes an automated fallback to its deterministic migration synthesis engine. It calculates breaking schema changes, formats ANSI SQL DDL scripts, generates TypeScript interface code, and structures the migration plan without crashing or stalling the review workflow.

#### Q3: Why does `POST /api/v1/proposals/generate` return 403 Forbidden?
When `PUBLIC_ACCESS_ENABLE=true`, public read-only viewing and demo simulations are allowed, but contract modifications and migration proposals are strictly guarded. You must provide a valid Bearer JWT token in the `Authorization` header. You can log in via the UI modal or use the credentials `admin` / `admin123`.

#### Q4: How does responsive design behave on mobile devices (320px - 768px)?
All views are mobile-optimized. In particular:
- The navigation bar collapses into a slide-over mobile drawer.
- The interactive consumer impact topology graph automatically switches to a high-contrast card list showing field-level dependencies and blocking alerts.
- Schema comparison diffs support horizontal touch scrolling and monospace formatting without clipping.
- Tables collapse into scannable stacked cards.

---

## License

Distributed under the MIT License.
