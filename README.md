# Cloud-Edge Industrial Telemetry & Privacy-Preserving Analytics Platform (DammIÀ)

> **Full-Stack Distributed Architecture · Zero-Trust Security · Statistical k-Anonymity · Multi-LLM RAG with Deterministic Offline Fallback**  
> *Developed for the Damm Industrial Challenge at UAB THE HACK! 2026*

---

## Executive Summary & Engineering Scope

Built under a strict 24-hour hackathon constraint for **Grup Damm**, this project goes beyond a conventional web application. It is a **complete, end-to-end industrial software ecosystem** engineered to solve a critical operational problem: capturing real-time operational telemetry and workforce climate data across heterogeneous industrial environments (packaging lines, logistics hubs at ZAL, maintenance crews, and corporate offices) where most operators lack corporate credentials or workstation access.

From an engineering standpoint, the platform was architected from first principles focusing on **four core pillars**:
1. **Cryptographic & Mathematical Privacy by Design:** Enforcing one-person-one-vote integrity without storing user identities, IP addresses, or session footprints, backed by statistical k-anonymity ($k \ge 5$).
2. **Cloud-Edge Database High Availability (HA):** Operating on a distributed cloud database (**Turso libSQL**) with automated, zero-downtime failover to a local **SQLite** engine when factory WAN connectivity drops.
3. **Fault-Tolerant AI Orchestration:** Combining cloud LLMs (**Google Gemini 2.5 Flash** & **OpenAI GPT-4o-mini**) with strict SQL *Data Grounding* and a **100% offline deterministic semantic fallback engine** to prevent service degradation during API outages.
4. **Zero-Setup DevOps & Self-Healing Infrastructure:** Automated relational schema auditing, atomic hot-backups, and third-party webhook integrations (Microsoft Teams Adaptive Cards & Microsoft Entra ID SSO).

---

## System Architecture & Data Flow

The system is structured into four decoupled layers to guarantee isolation between identity verification and data persistence:

1. **Client Ingestion Layer (Phygital & Omnichannel):**
   * **Factory Floor Totems & Mobile Clients:** Dynamic QR endpoints serving an ultra-lightweight React/Vite bundle (`< 1s` load over degraded 4G/industrial Wi-Fi) with instant state-driven internationalization (`CA` | `ES`) and WCAG AA high-contrast UI.
   * **Corporate Office Clients:** Direct integration with Microsoft 365 SSO and interactive Adaptive Cards delivered via Microsoft Teams webhooks.
2. **Zero-Trust Security Gateway (`backend/verificacio.py`):**
   * Acts as a stateless verification barrier. It validates network origin via CIDR subnet matching (`10.20.0.0/16`) for plant devices or Entra ID tokens for office staff.
   * Issues ephemeral, 256-bit cryptographically secure tokens in volatile RAM protected by thread mutex locks (`threading.Lock`), completely unlinked from the user's network metadata.
3. **Application & Privacy Core (`backend/api.py`):**
   * Consumes and destroys one-time tokens atomically upon submission to prevent replay attacks.
   * Strips all HTTP headers/IPs, executes in-memory regular expression scrubbing to mask PII in free-text fields, and enforces statistical k-anonymity ($k \ge 5$) on all outgoing analytical queries.
4. **Hybrid Persistence & AI Layer (`backend/db.py` & `backend/ai_service.py`):**
   * Routes read/write operations to **Turso (libSQL Cloud)** over HTTP, automatically failing over to a local **SQLite** database (`damm_listen_final.db`) if external network connectivity fails.
   * Feeds aggregated SQL metrics into the AI orchestration layer (Gemini 2.5 / GPT-4o-mini) or falls back to a local rule-based analytical parser when running offline.

---

## Comprehensive Technology Stack & Tooling

### 1. Backend & Systems Engineering (`Python 3.10+`)
* **FastAPI & Uvicorn (ASGI):** High-throughput asynchronous REST API handling concurrent requests from factory terminals and administrative dashboards.
* **Pydantic (`models.py`):** Strict runtime data validation, schema serialization, and payload sanitization at the API boundary.
* **Concurrency & Thread Safety (`threading.Lock`):** Mutex synchronization protecting in-memory cryptographic token state tables against race conditions during shift-change traffic spikes.
* **Cryptographic Primitives (`secrets`, `ipaddress`):** OS-level CSPRNG entropy generation and CIDR bitmask subnet verification.

### 2. Hybrid Cloud-Edge Data Engineering (`SQL / libSQL`)
* **Turso (libSQL Cloud):** Distributed edge database queried over a custom HTTP pipeline (`db.py`) for low-latency read/write operations across multiple industrial plants.
* **SQLite3 (Local Edge Fallback):** Embedded relational engine (`damm_listen_final.db`) acting as an immediate local failover replica and offline persistence store.
* **Self-Healing Schema Management (`init_schema`):** Zero-setup initialization routine that audits relational integrity on boot and provisions tables (`segments`, `surveys`, `questions`, `options`, `responses`, `settings`) idempotently.
* **ACID Hot-Backup Pipeline (`scripts/backup_db.py`):** Automated snapshot utility generating timestamped local and cloud state backups (`backups/`) without locking active read/write transactions.

### 3. Frontend & Industrial UX Engineering (`TypeScript / React 18`)
* **React 18 + TypeScript + Vite:** Strictly typed component architecture bundled with Vite for near-instantaneous HMR and optimized production builds (`dist/`).
* **Tailwind CSS + PostCSS:** Custom design system implementing corporate color tokens (`#C8102E`), high-contrast WCAG AA typography for brightly lit factory floors, and oversized touch targets for gloved operators.
* **Native Internationalization (i18n):** Instantaneous state-driven language switching (`CA` | `ES`) across the entire employee ingestion flow without page reloads.
* **Executive PDF Reporting Engine:** Client-side document compilation generating print-ready executive summaries and AI action plans for Board & Safety Committees.

### 4. Multi-LLM AI & Deterministic NLP Pipeline
* **Google GenAI SDK (`gemini-2.5-flash`) & OpenAI API (`gpt-4o-mini`):** Decoupled provider architecture allowing hot-swapping between frontier models via configuration endpoints.
* **Empirical SQL RAG (Retrieval-Augmented Generation):** Dynamic context builder that serializes real-time SQL aggregations, shift breakdowns, and sanitized comments into structured system prompts.
* **Local Deterministic Semantic Engine:** Zero-dependency offline NLP analyzer built with keyword heuristics and statistical threshold rules to guarantee 100% service continuity when external cloud APIs are unreachable.

---

## Deep Dive: Cybersecurity, Access Control & Privacy Engineering

In an industrial labor environment, employees will not report safety hazards, thermal stress, or management friction if they suspect their identity can be traced. Rather than relying on legal disclaimers, **privacy is enforced mathematically and cryptographically in code**.

### 1. Contextual Zero-Trust Access Control (`backend/verificacio.py`)
Each deployment channel is bound to a specific cryptographic QR identifier (`qr-planta-prat`, `qr-logistica-zal`, `qr-comercials`, `qr-oficines`, `qr-managers`, `qr-demo-hackathon`). When a device scans a QR code, `/api/verificar/metode/{token}` inspects the security policy assigned to that segment:
* **Industrial Network Gating (IP Subnet Verification):** For factory floor QR codes, `/api/verificar/xarxa` extracts the client's network origin (supporting reverse-proxy `X-Forwarded-For` headers) and validates it against authorized industrial CIDR blocks (`PLANT_NETWORKS=10.20.0.0/16`) using Python's `ipaddress.ip_network` module. External requests are rejected at the gateway.
* **Corporate Identity Federation (Microsoft 365 / Entra ID SSO):** For office and management segments (`/api/verificar/m365`), the system validates corporate domain ownership and directory membership before issuing an access token, decoupling the authentication step from the subsequent voting payload.
* **Universal Demo Bypass (`DEMO_MODE`):** Controlled environment flag allowing external reviewers to test the full mobile flow via `qr-demo-hackathon` from any public network without compromising production rules.

### 2. Ephemeral One-Time Cryptographic Tokens (Anti-Replay & Ballot Stuffing)
Once a user passes network or SSO verification, the system prevents automated ballot stuffing while keeping the vote anonymous through a three-step lifecycle:
1. **High-Entropy Generation:** The server generates a 256-bit cryptographically secure random token via `secrets.token_urlsafe(32)`.
2. **Thread-Safe In-Memory State:** The token is stored exclusively in volatile RAM (`_tokens_actius`) protected by a mutex lock (`threading.Lock()`), mapped only to the target `segment_id` and a strict Time-To-Live (`TTL_SEGONS = 3600`). **No user email or IP is attached to the token.**
3. **Atomic Destruction (`consumir_token`):** When the user submits their survey to `POST /api/respondre`, the backend acquires the mutex lock, verifies the token's existence and TTL, and **deletes it from memory in a single atomic operation** before writing the survey answers. Any subsequent replay attempt returns `403 Forbidden`.

### 3. Strict Zero-Log Architecture
The relational schema for `responses` is intentionally minimal:
```sql
CREATE TABLE responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    survey_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    segment_id INTEGER NOT NULL,
    answer_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
There are **no columns** for `user_id`, `ip_address`, `session_id`, `mac_address`, or `user_agent`. Even in the event of a full database compromise, correlating a response back to an individual employee is impossible.

### 4. In-Memory Regex PII Sanitization (`netejar_pii`)
Employees frequently include identifying details in open-text fields inadvertently. Before any SQL `INSERT` is executed, the payload passes through an in-memory regular expression scrubber:
* **Email Pattern Matching:** `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` -> Replaced with `[CORREU PROTEGIT]`.
* **Phone Pattern Matching:** `\b(?:\+34|0034)?[\s.-]?[6789]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b` -> Replaced with `[TELÈFON PROTEGIT]`.
Raw unmasked text never touches the disk.

### 5. Statistical k-Anonymity Enforcement ($k \ge 5$)
To prevent deductive re-identification (e.g., filtering a survey down to a micro-segment where only 2 people work on the night shift), the analytics engine enforces **k-anonymity ($k = 5$)** at the API level (`/api/surveys/{id}/detail`):
* If total responses for a query or segment satisfy $N < 5$, the backend suppresses granular score distributions, hides open-text comments, and returns `"protegit_anonimat": true`.
* Data is only unlocked for HR visualization once the mathematical threshold of $N \ge 5$ independent submissions is reached.

---

## Deep Dive: Multi-LLM Architecture, Data Grounding & Offline Resilience

Industrial software cannot suffer from LLM hallucinations or crash when an external cloud provider experiences downtime. The AI subsystem (`backend/ai_service.py` & `backend/api.py`) implements a defensive architecture:

### 1. Dual Generative Workflows
* **Context-Aware Survey Architect (`/api/ai/generar-enquesta`):** Transforms high-level natural language objectives from HR (e.g., *"Evaluate thermal stress and lumbar fatigue in the Prat packaging night shift"*) into structured JSON survey schemas containing calibrated 1–5 Likert scales, multiple-choice diagnostics, and open-text prompts designed to be completed in under 60 seconds.
* **Climate Intelligence Copilot (`/api/copilot/chat`):** An analytical assistant for *People & Culture* that cross-references shift telemetry, detects weak signals (early indicators of absenteeism or turnover), and formulates actionable operational plans.

### 2. Strict Empirical Data Grounding (Zero Hallucinations)
Before invoking any LLM, the backend executes real-time SQL aggregations across `surveys`, `questions`, and `responses`. It constructs a deterministic data snapshot containing:
* Exact participation counts and segment ratios.
* Calculated arithmetic means per question and global eNPS scores.
* Sanitized, k-anonymity-verified employee comments.

This empirical snapshot is injected into the LLM system prompt under strict boundary instructions: **the model is forbidden from inventing metrics and must cite the injected SQL figures directly**.

### 3. Agnostic Multi-Model Routing & 100% Offline Deterministic Fallback
The AI layer is decoupled from any single vendor and designed for graceful degradation:
* **Dynamic Provider Routing:** Administrators can switch in real time between **Google Gemini (`gemini-2.5-flash`)** and **OpenAI (`gpt-4o-mini`)** via the `/api/ai/config` endpoint without restarting the server.
* **Graceful Degradation (Offline Fallback):** Every external API call is wrapped in fault-tolerant exception handlers. If the factory loses internet connectivity, API credentials are unconfigured, or rate limits (`HTTP 429`) are triggered, the system automatically routes the request to a **Local Deterministic Engine**.
* **Local Rule-Based Execution:** This internal fallback parses query intent (shift comparisons, thermal anomalies, participation gaps, ZAL logistics issues), executes direct statistical calculations over the local SQLite database, and returns a formatted analytical response with zero external network dependencies.

### 4. Mandatory Human-in-the-Loop (HITL) Governance
No AI-generated survey is ever deployed autonomously. Generated schemas are loaded into an interactive staging editor (`CreateSurvey.tsx`) where HR administrators can modify questions, adjust options, or discard items before committing the survey to production and generating QR codes.

---

## Hybrid Cloud-Edge Persistence & DevOps Automation

### Custom Turso HTTP Pipeline + Transparent SQLite Failover (`backend/db.py`)
Standard database drivers often struggle with connection pooling across edge environments or hang when network interfaces drop. I engineered a custom database abstraction layer (`TursoConnection` & `TursoCursor`) that communicates with **Turso (libSQL)** over its native `/v2/pipeline` HTTP API while mimicking Python's standard `sqlite3` interface (`execute`, `fetchone`, `fetchall`, `lastrowid`):
* **Automatic Type Marshalling:** Converts Python primitives (`int`, `float`, `None`, `str`) into Turso wire-format JSON payloads and reconstructs dictionary-accessible rows (`TursoRow`).
* **Instantaneous Edge Failover:** Every database call is wrapped in a fault-tolerant router. If the Turso cloud cluster times out or returns a network error, `get_connection()` automatically switches the execution context to the local `damm_listen_final.db` SQLite file, ensuring factory floor totems never fail to record a vote.

### Enterprise Webhook Integrations (`/api/integrations/teams/send`)
To reach office staff without forcing them to open external portals, the backend includes a native **Microsoft Teams Webhook connector**. It constructs rich **Adaptive Cards (v1.4)** containing survey metadata, confidentiality badges, and direct action buttons (`Action.OpenUrl`), dispatching them directly to departmental Teams channels with automatic simulation fallback when webhook URLs are omitted.

---

## Repository Structure

```text
damm-industrial-analytics/
├── backend/
│   ├── ai_service.py          # Multi-LLM orchestration (Gemini/OpenAI) & JSON survey generator
│   ├── api.py                 # FastAPI core, REST routes, k-anonymity, PII scrubber & Copilot
│   ├── db.py                  # Custom Turso libSQL HTTP client + automated SQLite failover
│   ├── models.py              # Pydantic validation schemas for strict API type safety
│   └── verificacio.py         # Zero-Trust QR gateway, CIDR IP gating, M365 SSO & mutex tokens
├── backups/
│   ├── damm_backup_local...   # Automated point-in-time local SQLite ACID snapshots
│   └── damm_backup_turso...   # Cloud state backups synchronized from Turso libSQL
├── public/
│   └── damm-logo.png          # Corporate visual assets
├── scripts/
│   ├── backup_db.py           # CLI daemon for atomic hot-backups (local & cloud)
│   └── importar_dades.py      # Database seeding & historical telemetry ingestion utility
├── src/
│   ├── components/            # Reusable UI primitives, navigation sidebar & security badges
│   ├── views/                 # Views: Dashboard, Surveys, CreateSurvey, Publish, Copilot, EmployeeView
│   ├── App.tsx                # Application state router & view controller
│   └── main.tsx               # React 18 DOM entry point
├── .env.example               # Template for environment configuration
├── damm_listen_final.db       # Local SQLite relational database (Edge persistence)
├── package.json               # Frontend dependencies & build scripts (React, Vite, Tailwind)
├── requirements.txt           # Backend Python dependencies (FastAPI, Uvicorn, GenAI, Requests)
└── vite.config.ts             # Vite bundler configuration & API proxy rules
```

---

## Complete REST API Reference

| Method | Endpoint | Security / Scope | Technical Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public / Monitoring | Returns active DB engine (`turso` vs `sqlite`), AI provider readiness, and k-anonymity threshold. |
| `GET` | `/api/dashboard` | HR Admin | Computes global KPIs, response velocity, eNPS, monthly participation trends, and proactive AI alerts. |
| `GET` | `/api/surveys` | HR Admin | Lists all active, draft, and historical surveys with real-time response counters. |
| `GET` | `/api/surveys/{id}/detail` | HR Admin ($k \ge 5$) | Returns per-question score distributions and sanitized comments. Enforces statistical k-anonymity lock. |
| `POST` | `/api/enquestes` | HR Admin (HITL) | Commits a newly created or AI-assisted survey schema into relational storage. |
| `GET` | `/api/verificar/metode/{token}` | Zero-Trust Gateway | Resolves QR token metadata and dictates required auth flow (`xarxa` CIDR vs `m365` SSO). |
| `POST` | `/api/verificar/xarxa` | Zero-Trust Gateway | Validates client IP against industrial CIDR ranges and issues a 256-bit one-time token. |
| `POST` | `/api/verificar/m365` | Zero-Trust Gateway | Validates corporate M365 identity and issues an unlinked ephemeral voting token. |
| `GET` | `/api/preguntes/{token}` | Employee Client | Retrieves localized (`CA`/`ES`) active survey questions for the verified operational segment. |
| `POST` | `/api/respondre` | One-Time Token | Atomically destroys the session token, scrubs PII via regex, and inserts anonymous responses. |
| `POST` | `/api/ai/generar-enquesta` | AI Service | Generates a structured JSON survey proposal from a natural language HR objective. |
| `POST` | `/api/copilot/chat` | AI Service (RAG) | Executes grounded analytical queries over live SQL telemetry with automatic offline fallback. |
| `GET` | `/api/ai/config` | System Admin | Retrieves current active LLM provider (`gemini`, `openai`, or `local`) and API key status. |
| `POST` | `/api/ai/config` | System Admin | Hot-swaps the active LLM provider or injects runtime API credentials without server restart. |
| `POST` | `/api/integrations/teams/send`| Webhook Connector | Dispatches interactive Adaptive Cards to Microsoft Teams channels. |

---

## Local Deployment & Quickstart

### Prerequisites
* **Python** `3.10+`
* **Node.js** `18+` & `npm`

### 1. Clone & Configure Environment
```bash
git clone [https://github.com/bbofill/damm-industrial-analytics.git](https://github.com/bbofill/damm-industrial-analytics.git)
cd damm-industrial-analytics
cp .env.example .env
```

Edit `.env` with your credentials (the platform runs 100% offline using local SQLite and the deterministic AI engine if cloud keys are omitted):
```env
# Hybrid Database (Turso Cloud + Local SQLite Failover)
TURSO_DATABASE_URL=libsql://your-cluster.turso.io
TURSO_AUTH_TOKEN=your_turso_jwt_token

# Multi-LLM Providers (Optional - Local Deterministic Engine active by default)
GEMINI_API_KEY=your_google_gemini_key
OPENAI_API_KEY=your_openai_key

# Zero-Trust Network & Demo Controls
PLANT_NETWORKS=10.20.0.0/16
M365_MODE=simulat
DEMO_MODE=1
```

### 2. Launch Asynchronous Backend (FastAPI)
```bash
pip install -r requirements.txt
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
```
*On startup, `init_schema()` automatically verifies and provisions all required relational tables.*

### 3. Launch Frontend Application (React + Vite)
In a separate terminal:
```bash
npm install
npm run dev
```
* **HR Analytics & Management Portal:** `http://localhost:5173`
* **Mobile Employee QR Flow (Demo Token):** `http://localhost:5173/?token=qr-demo-hackathon`
* **Interactive OpenAPI / Swagger Docs:** `http://localhost:8000/docs`

### 4. Run Atomic Hot-Backups (Optional)
```bash
python scripts/backup_db.py
```

---

## Author

**Blai Bofill Butinyà**  
Data Engineering Student at Universitat Autònoma de Barcelona (UAB)
