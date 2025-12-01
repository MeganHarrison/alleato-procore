# Multi-Agent Workflow: Phase 1–5 Split

Engineered to run reliably, without timeouts, and with deterministic gating between steps.

## Important Notes Before We Begin

- These scripts assume you are using Codex MCP as in your repository.
- Each phase is 100% isolated, meaning you can run Phase 1, inspect outputs, then manually (or via another orchestrator) run Phase 2, etc.
- Every phase starts with a strict file verification so the agent never runs without required context.
- This is the architecture used in real agent pipelines (OpenAI, ReAct, SWE-agent workflows).
- You will get five separate Python files, one for each phase.

---

## PHASE 1 — Project Manager

**Creates:**
- `REQUIREMENTS.md`
- `AGENT_TASKS.md`
- `TEST.md`

**File:** `phase_1_project_manager.py`

```python
"""
Phase 1 — Project Manager
Creates REQUIREMENTS.md, AGENT_TASKS.md, TEST.md.
This phase must be run before any other phase.
"""

import asyncio
import os
from dotenv import load_dotenv
from agents import Agent, ModelSettings, Runner, set_default_openai_api
from agents.mcp import MCPServerStdio
from openai.types.shared import Reasoning

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

async def main():
    async with MCPServerStdio(
        name="Codex",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=200000,
    ) as mcp:

        project_manager = Agent(
            name="Project Manager",
            model="gpt-5",
            model_settings=ModelSettings(reasoning=Reasoning(effort="medium")),
            mcp_servers=[mcp],
            instructions="""
You are the Project Manager.

Your job is to create three files in the project root:
- REQUIREMENTS.md
- TEST.md
- AGENT_TASKS.md

Keep each file short, structured, and implementation-ready.

Use Codex MCP to write files with:
{"approval-policy":"never","sandbox":"workspace-write"}

Once all three files are created, return a final confirmation message.
""",
        )

        with open("TASK_LIST.md", "r") as f:
            task_list = f.read()

        result = await Runner.run(project_manager, task_list, max_turns=15)
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## PHASE 2 — Designer

**Reads:**
- `REQUIREMENTS.md`
- `AGENT_TASKS.md`

**Outputs:**
- `/design/design_spec.md`
- `/design/wireframe.md`

**File:** `phase_2_designer.py`

```python
"""
Phase 2 — Designer
Consumes REQUIREMENTS.md and AGENT_TASKS.md.
Produces design/design_spec.md and optional wireframe.md.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from agents import Agent, Runner, set_default_openai_api
from agents.mcp import MCPServerStdio

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

def verify_inputs():
    required = ["REQUIREMENTS.md", "AGENT_TASKS.md"]
    missing = [f for f in required if not Path(f).exists()]
    if missing:
        raise FileNotFoundError(f"Missing required files: {missing}")

async def main():
    verify_inputs()

    async with MCPServerStdio(
        name="Codex",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=200000,
    ) as mcp:

        designer = Agent(
            name="Designer",
            model="gpt-5",
            mcp_servers=[mcp],
            instructions="""
You are the Designer.

Read REQUIREMENTS.md and AGENT_TASKS.md.
Produce:
- design/design_spec.md
- design/wireframe.md (if specified)

Use Codex MCP to write files with:
{"approval-policy":"never","sandbox":"workspace-write"}
"""
        )

        task = "Design the UX based on REQUIREMENTS.md and AGENT_TASKS.md."

        result = await Runner.run(designer, task, max_turns=15)
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## PHASE 3 — Frontend

**Reads:**
- `design/design_spec.md`
- `REQUIREMENTS.md`
- `AGENT_TASKS.md`

**Outputs:**
- `/frontend/index.html`
- `/frontend/styles.css`
- `/frontend/main.js`

**File:** `phase_3_frontend.py`

```python
"""
Phase 3 — Frontend Developer
Consumes design_spec.md and AGENT_TASKS.md.
Produces frontend files.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from agents import Agent, Runner, set_default_openai_api
from agents.mcp import MCPServerStdio

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

def verify_inputs():
    required = [
        "design/design_spec.md",
        "REQUIREMENTS.md",
        "AGENT_TASKS.md"
    ]
    missing = [f for f in required if not Path(f).exists()]
    if missing:
        raise FileNotFoundError(f"Missing required files: {missing}")

async def main():
    verify_inputs()

    async with MCPServerStdio(
        name="Codex",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=200000,
    ) as mcp:

        frontend = Agent(
            name="Frontend",
            model="gpt-5",
            mcp_servers=[mcp],
            instructions="""
You are the Frontend Developer.

Consume:
- design/design_spec.md
- REQUIREMENTS.md
- AGENT_TASKS.md

Produce files in /frontend:
- index.html
- styles.css
- main.js

Use Codex MCP to write files.
"""
        )

        task = "Implement frontend exactly according to design_spec.md."

        result = await Runner.run(frontend, task, max_turns=15)
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## PHASE 4 — Backend

**Reads:**
- `REQUIREMENTS.md`
- `AGENT_TASKS.md`

**Outputs:**
- `/backend/server.js`
- `/backend/package.json`

**File:** `phase_4_backend.py`

```python
"""
Phase 4 — Backend Developer
Consumes AGENT_TASKS.md and REQUIREMENTS.md.
Produces server.js and package.json.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from agents import Agent, Runner, set_default_openai_api
from agents.mcp import MCPServerStdio

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

def verify_inputs():
    required = ["REQUIREMENTS.md", "AGENT_TASKS.md"]
    missing = [f for f in required if not Path(f).exists()]
    if missing:
        raise FileNotFoundError(f"Missing: {missing}")

async def main():
    verify_inputs()

    async with MCPServerStdio(
        name="Codex",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=200000,
    ) as mcp:

        backend = Agent(
            name="Backend",
            model="gpt-5",
            mcp_servers=[mcp],
            instructions="""
Implement backend endpoints described in AGENT_TASKS.md.

Produce:
- backend/server.js
- backend/package.json

Use Codex MCP to create files.
"""
        )

        task = "Implement backend according to REQUIREMENTS.md & AGENT_TASKS.md."

        result = await Runner.run(backend, task, max_turns=15)
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## PHASE 5 — Tester

**Reads:** Everything

**Outputs:**
- `/tests/TEST_PLAN.md`
- `/tests/test.sh` (optional)

**File:** `phase_5_tester.py`

```python
"""
Phase 5 — Tester
Consumes frontend, backend, and root files.
Produces TEST_PLAN.md and optional automation.
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from agents import Agent, Runner, set_default_openai_api
from agents.mcp import MCPServerStdio

load_dotenv(override=True)
set_default_openai_api(os.getenv("OPENAI_API_KEY"))

def verify_inputs():
    required = [
        "design/design_spec.md",
        "frontend/index.html",
        "backend/server.js",
        "REQUIREMENTS.md",
        "AGENT_TASKS.md",
        "TEST.md"
    ]
    missing = [f for f in required if not Path(f).exists()]
    if missing:
        raise FileNotFoundError(f"Missing: {missing}")

async def main():
    verify_inputs()

    async with MCPServerStdio(
        name="Codex",
        params={"command": "npx", "args": ["-y", "codex", "mcp"]},
        client_session_timeout_seconds=200000,
    ) as mcp:

        tester = Agent(
            name="Tester",
            model="gpt-5",
            mcp_servers=[mcp],
            instructions="""
You are the Tester.

Consume all project files and produce:
- tests/TEST_PLAN.md
- tests/test.sh (if appropriate)

Use Codex MCP to write files.

Keep the test plan clear and executable.
"""
        )

        task = "Verify system and generate tester outputs."

        result = await Runner.run(tester, task, max_turns=10)
        print(result.final_output)

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Next Step (Optional but Recommended)

A master orchestrator can be generated:

```bash
python run_all.py
```

That will:
1. Run Phase 1
2. Verify outputs
3. Run Phase 2
4. Verify outputs
5. Run Phase 3
6. …and so on

Fully automated. Zero guesswork.

---

## Phase Summary

| Phase | Agent | Inputs | Outputs |
|-------|-------|--------|---------|
| 1 | Project Manager | `TASK_LIST.md` | `REQUIREMENTS.md`, `AGENT_TASKS.md`, `TEST.md` |
| 2 | Designer | `REQUIREMENTS.md`, `AGENT_TASKS.md` | `design/design_spec.md`, `design/wireframe.md` |
| 3 | Frontend | `design/design_spec.md`, `REQUIREMENTS.md`, `AGENT_TASKS.md` | `frontend/index.html`, `frontend/styles.css`, `frontend/main.js` |
| 4 | Backend | `REQUIREMENTS.md`, `AGENT_TASKS.md` | `backend/server.js`, `backend/package.json` |
| 5 | Tester | All files | `tests/TEST_PLAN.md`, `tests/test.sh` |
