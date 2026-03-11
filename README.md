# Credere AI — Enterprise Credit Intelligence Platform

Credere AI is a high-performance, industry-grade credit intelligence system designed for financial institutions to automate document intake, cross-validate financial data, and perform deep research on corporate entities.

## 🚀 Core Modules

### 1. Financial IQ & Intake (Module 1)
- **High-Fidelity Extraction**: Intelligent parsing of Annual Reports, Financial Statements, GST Filings, and Bank Statements.
- **Cross-Verification**: Multi-source validation (e.g., GST vs. Financials) to detect anomalies and revenue leakage.
- **Data Completeness**: Automated quality gates ensuring no critical credit data points are missing.

### 2. Credit Intelligence (Module 2)
- **Autonomous Research**: Deep-dive intelligence gathering across corporate networks, litigation records, and media signals.
- **Network Analysis**: Visualizing complex promoter connections and related-party structures.
- **Risk Scoring**: Real-time algorithmic rating based on multi-dimensional evidence grounding.

### 3. Decision Studio (Module 3)
- **Peer Benchmarking**: Side-by-side performance comparison against sector norms (EBITDA margins, Current Ratios, etc.).
- **Scenarios & Sensitivity**: AI-driven stress testing of debt-servicing capacity under various market conditions.
- **Grounding & Guardrails**: Final committee recommendations with complete evidence lineage to prevent hallucinations.

### 4. Portfolio Analytics Hub
- **Aggregate Oversight**: Real-time monitoring of total exposure, asset quality (Standard vs. NPL), and risk concentration.
- **Pipeline Visibility**: Track active appraisals and confidence levels across different sectoral segments.

### 5. AI Knowledge Hub
- **Grounded RAG Bot**: Conversational expert grounded in the institution's entire document repository and research history.
- **Source Lineage**: Every answer is linked back to specific source documents for absolute auditability.

---

## 🛠 Tech Stack

- **Backend**: Java 17+, Spring Boot 3.2, Maven, Lombok, Jackson
- **Frontend**: React 18+, Vite, Vanilla CSS (Premium Micro-animations)
- **Intelligence**: Gemini Pro / Gemini Flash 2.0 (via LLM Gateway), PDFBox, Tabula
- **Security**: JWT-based Authentication, Environment-level variable management

---

## 🏁 Getting Started

### Prerequisites
- Java 17 SDK
- Node.js 18+
- Maven 3.8+
- Gemini API Key

### Configuration
Create a `.env` file in `backend-java/`:
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
AUTH_TOKEN=your_secure_token
```

### Installation

1. **Backend**:
   ```bash
   cd backend-java
   mvn clean compile
   mvn spring-boot:run -Dspring-boot.run.arguments="--server.port=8013"
   ```

2. **Frontend**:
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```

---

## 🛡 Industry Compliance
Credere AI follows strict **Anti-Hallucination Guardrails**. Recommendations are "Withheld" if critical evidence falls below confidence thresholds, ensuring that credit decisions are always grounded in verifiable fact.

---
© 2026 Credere AI — Built for the future of Credit Risk Management.
