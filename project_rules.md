# NexusAnalytics – Project Rules & Team Alignment

## Mission

**Transform raw, unstructured datasets into polished visual insights completely on autopilot** using a three-tier multi-agent swarm that writes, tests, and validates its own code without human hand-holding.

---

## Team Structure (5 Members)

| Role | Name | Responsibilities |
|------|------|------------------|
| **Vibe-Coder 1** | [Frontend Lead] | React/Next.js UI, Tailwind styling, WebSocket integration |
| **Vibe-Coder 2** | [Backend Lead] | CrewAI agents, agent prompts, FastAPI routes, code sandbox |
| **Code Integrator** | [DevOps] | AWS Lambda setup, end-to-end wiring, CI/CD, deployments |
| **Deck Designer** | [Pitch] | Slide deck, visual narrative, demo flow |
| **Speaker** | [Presenter] | Live demo, Q&A, storytelling |

---

## Development Timeline: 6 Hours

### Phase 1: Scaffold (0:00–0:45) ✅
- ✅ Next.js + FastAPI boilerplate initialized
- ✅ Mock dataset created (sales_data.csv)
- ✅ GitHub repo set up with initial folder structure

### Phase 2: Backend Agents (0:45–2:15) ⏳
- [ ] Implement `agents.py` – CrewAI three-tier (Manager, Developer, QA)
- [ ] Implement `tasks.py` – Workflow task definitions
- [ ] Implement `sandbox.py` – Code execution + error capture
- [ ] Implement `main.py` routes – `/analyze`, `/stream-logs`, `/upload`
- [ ] Integrate Google Gemini 1.5 Pro API calls

### Phase 3: Frontend UI (0:45–2:00) ⏳ [Parallel with Phase 2]
- [ ] FileUpload component (drag-drop preview)
- [ ] ChatInterface component (query input + submit)
- [ ] TerminalLog component (WebSocket + real-time color-coded logs) ← **WOW FACTOR**
- [ ] ChartDisplay component (Recharts visualization)
- [ ] Main dashboard layout (responsive grid)

### Phase 4: Integration & Testing (2:15–3:15) ⏳
- [ ] End-to-end wiring (frontend → backend)
- [ ] **Intentional error test**: Query non-existent column → watch self-correction
- [ ] Live log verification (all three agents visible in terminal)
- [ ] Chart renders correctly with mock data

### Phase 5: Deployment (3:15–3:45) ⏳
- [ ] Frontend → Vercel (public URL)
- [ ] Backend → AWS Lambda OR Docker on EC2 (public API)
- [ ] Production smoke test (Vercel → AWS)

### Phase 6: Final Polish & Deck (3:45–6:00) ⏳
- [ ] Bug fixes & demo walkthrough
- [ ] Pitch deck refinement
- [ ] Speaker rehearsal

---

## Code Standards

### Python (Backend)
```python
# Use type hints
def analyze(query: str, csv_path: str) -> Dict[str, Any]:
    ...

# Docstrings on all functions
def execute_code(code: str) -> Dict:
    """Execute Python code in isolated sandbox.
    
    Args:
        code: Python code string
    
    Returns:
        Dictionary with success, output, error, traceback
    """
    ...

# Use logging, not print()
import logging
logger = logging.getLogger(__name__)
logger.info("Analysis started")
```

### JavaScript/TypeScript (Frontend)
```tsx
// Use React hooks, not class components
"use client";  // Mark client components

interface FileUploadProps {
  onFileChange: (fileName: string) => void;
}

// Comprehensive JSDoc comments
/**
 * Uploads and processes a CSV file
 * @param file - The CSV file to upload
 * @returns Promise resolving to uploaded file info
 */
export async function uploadFile(file: File) {
  ...
}

// Use Tailwind for all styling (no inline CSS)
className="bg-slate-800 border border-slate-700 rounded-lg p-6"
```

---

## Git Workflow

```bash
# Main branch = production-ready demo
# Feature branches for each phase

git checkout -b feature/backend-agents
# ... commit work ...
git push origin feature/backend-agents
# Create PR, Code Integrator reviews + merges

# Before merge, verify:
# - No hardcoded API keys or secrets
# - Linting passes (black, eslint)
# - Commit messages are clear
```

---

## API Integration Checklist

### Backend Must Provide
- [ ] `POST /analyze` returns structured JSON with `success`, `result`, `agent_logs`, `code`, `execution_time`
- [ ] `WebSocket /stream-logs` sends agent logs in real-time (format: `{agent, message, timestamp}`)
- [ ] `POST /upload` accepts multipart file, saves to `backend/uploads/`, returns file path
- [ ] `GET /health` returns status for uptime monitoring
- [ ] All endpoints support CORS (frontend on Vercel, backend on Lambda/EC2)

### Frontend Must Consume
- [ ] FileUpload → `POST /upload` (or use mock data)
- [ ] ChatInterface → `POST /analyze` + listen to `/stream-logs` WebSocket
- [ ] TerminalLog → consume WebSocket messages, color-code by agent, auto-scroll
- [ ] ChartDisplay → render recharts based on `result.chart_data` from API response

---

## Demo Flow (2 Minutes)

1. **Intro** (10 sec): "Raw data to insights automatically"
2. **Upload** (5 sec): Upload mock CSV (or use pre-loaded file)
3. **Query** (5 sec): Type "Find the worst-performing product"
4. **Live Logs** (45 sec): Watch terminal log stream live
   - Manager: "Analyzing schema..."
   - Developer: "Writing code..."
   - Developer: "Code executed!"
   - QA: "Validation passed!"
5. **Results** (40 sec): Chart renders, summary displays
6. **Wow Factor** (15 sec): Highlight self-correction ("We caught an error and fixed it live")
7. **Close** (5 sec): "End-to-end autonomously, no human hand-holding"

---

## Critical Success Factors

✅ **Must-Have:**
- Multi-agent orchestration visible in terminal log
- Real-time WebSocket streaming (judges love watching agents think)
- One working end-to-end flow (upload → query → chart)
- Production deployment (Vercel + public AWS URL)

❌ **Cut if Running Behind:**
- Advanced self-correction logic (1 retry is enough)
- Multiple file formats (CSV only)
- User authentication
- Database persistence

---

## Communication

- **Slack**: #nexusanalytics channel
- **Daily Sync**: Kickoff at 0:00, check-in every 90 minutes
- **Code Lead**: Code Integrator is final arbiter on merge decisions
- **Blockers**: Report immediately to Code Integrator

---

## References

- **CrewAI Docs**: https://docs.crewai.io
- **Google Gemini API**: https://ai.google.dev
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com

---

## Final Reminders

1. **No hardcoded secrets** – Use .env files
2. **Commit frequently** – Small, reviewable PRs
3. **Test locally first** – Avoid last-minute deployment surprises
4. **Document as you go** – Comments save sanity
5. **Have fun** – This is a hackathon! 🚀

---

**Created**: 2026-07-04  
**Deadline**: 2026-07-04 (6 hours from kickoff)
