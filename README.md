# Credere AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-credereai--frontend.pages.dev-3b93d2?style=for-the-badge&logo=cloudflare)](https://credereai-frontend.pages.dev/)
&nbsp;
[![Watch Demo Video](https://img.shields.io/badge/Demo%20Video-Watch%20Now-red?style=for-the-badge&logo=google-drive)](https://drive.google.com/file/d/1UaqxdGIYJWDyXdq_Hina9SpBy7M2G7Oz/view)

---

> **Note:** GitHub README does not support embedding Google Drive videos inline. Click the badge above to watch the demo. To embed a video natively on GitHub, the video file would need to be uploaded as a GitHub-hosted asset.

---

Credere AI is a full-stack corporate credit intelligence workspace built for document-led underwriting, external research, portfolio visibility, decision support, and grounded knowledge retrieval.

The project combines:
- a Spring Boot backend for document processing, credit analytics, research orchestration, authentication, and history
- a React frontend for the analyst workspace
- LLM-backed summarization and recommendation flows with guardrails around evidence grounding

This repository contains both the frontend and backend in a single workspace.

## What The Product Does

Credere AI is designed around the workflow a credit team actually follows:

1. ingest borrower documents
2. extract and normalize structured financial data
3. run cross-checks, ratios, completeness checks, and underwriting views
4. launch external intelligence scans for litigation, promoter, network, and news signals
5. turn evidence into decisions, committee notes, and case actions
6. query the uploaded evidence through a grounded knowledge assistant

## Core Workspaces

### Module 1: Financial IQ & Intake

Module 1 handles borrower document ingestion and structured analysis.

Key capabilities:
- PDF upload with large-file support
- auto-detection of document category
- extracted financial fields such as revenue, profit, debt, equity, current assets, current liabilities, GST, and bank flows
- completeness analysis to detect missing critical underwriting fields
- cross-verification and anomaly detection
- ratio analysis and underwriting output
- dashboard, enterprise assessment, and review workflow views
- analysis snapshot persistence to history

Primary backend routes include:
- `/api/upload`
- `/api/documents`
- `/api/completeness`
- `/api/analysis/full`
- `/api/analysis/dashboard`
- `/api/analysis/underwriting`
- `/api/analysis/enterprise`
- `/api/analysis/recommendation-engine`
- `/api/analysis/review-workflow`
- `/api/reset`

### Module 2: Credit Intelligence

Module 2 extends the financial intake context with external intelligence and case operations.

Key capabilities:
- company research request intake
- async intelligence scan execution with polling
- module-to-module autofill from Module 1 extracted context
- promoter analysis, litigation scans, regulatory actions, and news signals
- network graph generation
- intelligence case creation and workbench operations
- evidence logging, action assignment, state transitions, escalation sweep, and audit verification
- local persistence of in-progress Module 2 state in the frontend so the page can be revisited without losing the current workspace

Primary backend routes include:
- `/api/module2/research`
- `/api/module2/research/async`
- `/api/module2/research/async/{jobId}`
- `/api/module2/module1-data`
- `/api/module2/research/from-module1`
- `/api/module2/cases`
- `/api/module2/cases/{caseId}`
- `/api/module2/cases/{caseId}/actions`
- `/api/module2/cases/{caseId}/evidence`
- `/api/module2/cases/{caseId}/decision`
- `/api/module2/cases/{caseId}/audit`
- `/api/module2/cases/{caseId}/decision-pack`

### Module 3: Decision Studio

Module 3 is the recommendation and committee-preparation layer.

Key capabilities:
- recommendation engine outputs
- peer benchmarking
- scenario and stress framing
- evidence-grounded recommendation summaries
- decision-oriented UI for underwriting users

### Portfolio Intelligence

Portfolio views aggregate pipeline and exposure information across uploaded entities.

Key capabilities:
- portfolio segmentation
- exposure overview
- alert rollups
- pipeline-level monitoring
- quick refresh for current analytics state

Primary backend route:
- `/api/analytics/portfolio`

### AI Knowledge Hub

The Knowledge Hub is a grounded assistant for uploaded financial documents and derived analysis.

Key capabilities:
- natural-language querying against uploaded evidence
- grounded responses with source filenames
- structured answers for common questions such as debt-to-equity, liquidity, and top risks
- fallback to LLM synthesis using structured financial evidence when deterministic answers are not enough
- client-side chat and query history persistence

Primary backend route:
- `/api/analytics/knowledge/query`

### Authentication And History

The backend includes lightweight built-in authentication and saved analysis history.

Primary routes:
- `/api/auth/login`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/history`
- `/api/history/{id}`

Default demo users currently registered in code:
- `bank.admin` / `Credere@123`
- `credit.officer` / `Officer@123`

## Repository Layout

```text
CredereAI/
├── backend-java/          Spring Boot backend
│   ├── src/main/java/     controllers, services, models, engines, config
│   ├── src/main/resources/application.properties
│   ├── data/              local data artifacts and module state files
│   └── Dockerfile
├── frontend-react/        React + Vite frontend
│   ├── src/components/    workspace panels and shared UI
│   ├── src/api/client.js  frontend API client and timeouts
│   ├── src/styles.css     shared styling
│   └── wrangler.toml
├── render.yaml            Render deployment definition
├── BENCHMARK_README.md
├── COMPETITIVE_EDGE_PLAYBOOK.md
└── benchmark_harness.py
```

## Architecture Overview

### Backend

The backend is a Spring Boot 3.2.5 application running on Java 17.

Important backend building blocks:
- `module1`: document ingestion, extraction, financial synthesis, completeness, ratio analysis, underwriting logic
- `module2`: external research orchestration, async jobs, case management, audit trails
- `analytics`: portfolio analytics, peer benchmarking, knowledge assistant
- `auth`: login, current user, logout, and saved history
- `llm`: provider selection and runtime model routing
- `config`: CORS, global exception handling, and web configuration

Notable dependencies:
- Spring Boot Web
- Spring Boot WebFlux
- Spring Validation
- Apache PDFBox
- Tabula
- Jackson
- Lombok
- dotenv-java

### Frontend

The frontend is a React 18 application built with Vite.

Important frontend characteristics:
- workspace-based UI with dedicated panels per module
- centralized API client in `frontend-react/src/api/client.js`
- environment-aware backend resolution for local, hosted, and Cloudflare Pages deployments
- long-running Module 2 scans handled via async submission and polling
- local storage persistence for theme, onboarding state, knowledge chat, and Module 2 workspace state

## How The System Works End To End

### 1. Document intake

An operator uploads a PDF in Module 1. The backend:
- stores the file under the configured upload directory
- extracts PDF text using PDFBox utilities
- switches to a faster extraction strategy for very large reports
- runs financial extraction and optional focused retries if core fields are missing
- stores the extracted financial data in in-memory document state

### 2. Financial synthesis

Module 1 analysis endpoints consolidate uploaded document data into:
- normalized financial fields
- ratio analysis
- completeness reports
- cross-verification alerts
- underwriting and enterprise views

### 3. Research enrichment

Module 2 can pull company context from Module 1 and launch a multi-step research job. The backend orchestrates network, promoter, litigation, regulatory, and news research. The frontend polls for completion rather than waiting on one long synchronous request.

### 4. Decision support

Module 3 and related analytics panels transform the extracted and researched evidence into decision recommendations, benchmark views, and committee-facing summaries.

### 5. Grounded Q and A

The Knowledge Hub uses uploaded documents plus synthesized Module 1 analysis to answer user questions. For certain high-value financial questions, the backend now answers directly from structured data before falling back to LLM synthesis.

## Local Development

### Prerequisites

- Java 17
- Maven 3.8 or later
- Node.js 18 or later
- npm
- a Gemini API key and optionally a Groq API key if you want to switch providers

### Backend Setup

Move into the backend directory:

```bash
cd backend-java
```

The backend reads configuration from `src/main/resources/application.properties` and environment variables.

Important runtime values:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `LLM_PROVIDER`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `CORS_ALLOWED_ORIGINS`

Example local shell setup:

```bash
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=your_key_here
export GEMINI_MODEL=gemini-2.5-flash
export CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Run the backend:

```bash
mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8013"
```

Build the backend:

```bash
mvn -DskipTests package
```

### Frontend Setup

Move into the frontend directory:

```bash
cd frontend-react
```

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run dev
```

By default, the frontend API client prefers explicit `VITE_API_BASE` when provided. For local development, a practical setup is:

```bash
VITE_API_BASE=http://localhost:8013 npm run dev
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Deployment

### Render

This repository includes `render.yaml` with services for:
- `credere-backend`
- `credere-frontend`

Important Render backend environment variables:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`
- `LLM_PROVIDER`
- `JAVA_OPTS`
- `CORS_ALLOWED_ORIGINS`

For the current Cloudflare Pages deployment pattern, `CORS_ALLOWED_ORIGINS` should be set to:

```env
CORS_ALLOWED_ORIGINS=https://credereai-frontend.pages.dev
```

Notes:
- do not wrap the origin in quotes or backticks
- do not append `/api`
- redeploy the backend after changing this value

### Cloudflare Pages

The frontend also supports deployment on Cloudflare Pages.

Recommended Pages environment variable:

```env
VITE_API_BASE=https://credere-backend.onrender.com
```

The frontend client is configured to avoid same-origin API fallback on Pages, because Pages serves static assets and does not host the Java API.

### Wrangler

The frontend includes `wrangler.toml` and these scripts:

```bash
npm run deploy
npm run deploy:dry-run
```

## Authentication Model

The current implementation uses built-in demo users registered in the backend service. This is suitable for a demo or internal prototype environment, but not for production identity management.

Current demo credentials:

```text
bank.admin      / Credere@123
credit.officer  / Officer@123
```

Authenticated features include:
- user lookup with `/api/auth/me`
- logout with `/api/auth/logout`
- history storage and retrieval
- action flows tied to the active session

## Key Environment Variables

### Backend

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
CORS_ALLOWED_ORIGINS=http://localhost:5173
JAVA_OPTS=-Xmx512m
```

### Frontend

```env
VITE_API_BASE=http://localhost:8013
```

## API Summary

### Health and system
- `GET /api/health`
- `GET /api/system/llm-provider`
- `GET /api/system/llm-provider/settings`
- `POST /api/system/llm-provider/settings`

### Module 1
- `POST /api/upload`
- `GET /api/documents`
- `DELETE /api/documents/{documentId}`
- `GET /api/completeness`
- `GET /api/analysis/full`
- `GET /api/analysis/dashboard`
- `GET /api/analysis/underwriting`
- `GET /api/analysis/enterprise`
- `GET /api/analysis/recommendation-engine`
- `GET /api/analysis/review-workflow`
- `POST /api/analysis/review/submit`
- `POST /api/analysis/review/approve`
- `POST /api/reset`

### Module 2
- `GET /api/module2/health`
- `POST /api/module2/research`
- `POST /api/module2/research/async`
- `GET /api/module2/research/async/{jobId}`
- `GET /api/module2/module1-data`
- `POST /api/module2/research/from-module1`
- `POST /api/module2/cases`
- `POST /api/module2/cases/from-research`
- `GET /api/module2/cases`
- `GET /api/module2/cases/{caseId}`
- `POST /api/module2/cases/{caseId}/state`
- `POST /api/module2/cases/{caseId}/actions`
- `PATCH /api/module2/cases/{caseId}/actions/{actionId}`
- `POST /api/module2/cases/{caseId}/evidence`
- `POST /api/module2/cases/{caseId}/decision`
- `GET /api/module2/cases/{caseId}/audit`
- `GET /api/module2/cases/{caseId}/audit/verify`
- `GET /api/module2/cases/actions/overdue`
- `POST /api/module2/cases/escalation/sweep`
- `GET /api/module2/cases/{caseId}/decision-pack`

### Analytics
- `GET /api/analytics/portfolio`
- `POST /api/analytics/knowledge/query`
- `GET /api/analytics/peer-benchmarking`

### Auth and history
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/history`
- `GET /api/history/{id}`
- `POST /api/history`

## Notable Implementation Details

- large PDF uploads are supported up to roughly 220 MB based on backend multipart configuration
- long Module 2 research flows are executed asynchronously to avoid browser/network timeout issues
- the frontend hardens API payload handling with array guards to prevent `.map()` crashes on malformed responses
- the Knowledge Hub now uses structured financial evidence, not just a naive object dump, for better answers
- Module 2 persists its current UI state locally so analysts can navigate away and come back without losing context
- CORS handling normalizes allowed origins to avoid deployment-time misconfiguration issues

## Known Constraints

- the auth model is demo-grade and should be replaced for production use
- much of the backend state is held in memory, so a full restart can clear runtime-only session context unless explicitly persisted elsewhere
- document extraction quality depends on PDF text extractability and document structure
- research results are only as strong as the available external signal generation logic and configured LLM provider

## Recommended Production Hardening

- replace demo auth with enterprise identity and session management
- move in-memory state to a durable database
- add background job persistence for research jobs
- introduce observability, structured logs, and request tracing
- externalize secrets and runtime configuration fully through deployment environments
- add integration tests around extraction, auth, Module 2 job flows, and knowledge responses

## Developer Notes

- use `mvn -DskipTests package` to validate backend changes
- use `npm run build` to validate frontend changes
- when deploying frontend to Pages and backend to Render, verify `VITE_API_BASE` and `CORS_ALLOWED_ORIGINS` together
- if login or cross-origin requests fail in production, test backend preflight with `OPTIONS` before assuming frontend issues

## Related Files

- [render.yaml](/Users/aksharsakhi/Downloads/CredereAI/render.yaml)
- [backend-java/pom.xml](/Users/aksharsakhi/Downloads/CredereAI/backend-java/pom.xml)
- [backend-java/src/main/resources/application.properties](/Users/aksharsakhi/Downloads/CredereAI/backend-java/src/main/resources/application.properties)
- [frontend-react/package.json](/Users/aksharsakhi/Downloads/CredereAI/frontend-react/package.json)

## License And Ownership

This repository currently does not declare a separate license file in the workspace root. Add one explicitly if this project is intended for external distribution.
