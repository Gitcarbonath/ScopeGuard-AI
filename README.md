# ScopeGuard AI

**An evidence-led, local-first assistant for reviewing client requests against an agreed project scope.**

ScopeGuard AI helps freelancers and small development teams review proposed changes before agreeing to them. It compares a client's request with the project's stated scope, separates the request into findings, quotes relevant scope evidence, and drafts a professional reply for the user to review.

> ScopeGuard AI is a decision-support tool, not a legal adviser. AI assessments can be incomplete or incorrect. Always review the evidence and use your own judgement before making commitments to a client.

## Features

- **Three-way classification:** `in_scope`, `potentially_out_of_scope`, and `needs_clarification`.
- **Evidence-led findings:** relevant quotations from the agreed scope and an explanation of what the wording does—and does not—establish.
- **Explicit exclusion handling:** distinguishes a feature expressly excluded by the agreement from one that is simply not mentioned.
- **Separate findings for combined requests:** evaluates individual requested features when the analysis returns them separately.
- **Client reply drafting:** generates a suggested response that you can edit before copying or sending.
- **Project management and history:** create, update, list, and delete projects, and revisit previous analyses.
- **Local model inference:** uses Ollama, with `gemma3:4b` as the default model.
- **Local SQLite storage:** projects and analysis history are stored in a local database created by the backend.

## How it works

1. Create a project and save the agreed scope.
2. Enter a new client request.
3. ScopeGuard sends the scope and request to the configured local Ollama model.
4. The backend validates the response and checks the supporting scope evidence.
5. Review each finding, its classification, evidence, suggested next step, and draft reply.
6. Edit the reply as needed. ScopeGuard does not send messages to clients automatically.

## Technology stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python, FastAPI, Pydantic, HTTPX
- **Model runtime:** Ollama
- **Default model:** `gemma3:4b`
- **Persistence:** SQLite

## Requirements

- Python 3.10 or newer (Python 3.12 recommended)
- Node.js 18 or newer and npm
- [Ollama](https://ollama.com/) installed and running
- Enough RAM and CPU/GPU resources to run your selected local model

## Run locally

Open two PowerShell terminals from the repository root.

### 1. Download the model

Install Ollama, start it, and pull the default model:

```powershell
ollama pull gemma3:4b
```

If Ollama is not already running, start it in a separate terminal:

```powershell
ollama serve
```

If the service is already running, you do not need to start it a second time.

### 2. Start the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

If PowerShell blocks virtual-environment activation, you can run the environment's Python directly instead:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

### 3. Start the frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm ci
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Configuration

The backend supports these environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | Base URL for the Ollama API |
| `OLLAMA_MODEL` | `gemma3:4b` | Model tag to use for analysis |

For example, in PowerShell for the current terminal session:

```powershell
$env:OLLAMA_URL = "http://localhost:11434"
$env:OLLAMA_MODEL = "gemma3:4b"
```

Use a model you have already downloaded with Ollama. These environment variables are optional for the default local setup.

## API overview

The FastAPI backend exposes these routes:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | API and Ollama availability status |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List projects |
| `GET` | `/api/projects/{project_id}` | Retrieve a project |
| `PUT` | `/api/projects/{project_id}` | Update a project |
| `DELETE` | `/api/projects/{project_id}` | Delete a project |
| `GET` | `/api/projects/{project_id}/analyses` | List a project's analyses |
| `POST` | `/api/analyze` | Analyse a client request against an agreed scope |

For request schemas and interactive testing, run the backend and visit `/docs`.

## Project structure

```text
ScopeGuard-AI/
├── backend/
│   ├── main.py          # FastAPI routes, analysis and validation
│   ├── database.py      # SQLite persistence
│   └── requirements.txt # Python dependencies
└── frontend/
    ├── index.html
    ├── package.json
    ├── public/
    │   └── favicon.svg
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        └── main.jsx
```

## Testing and limitations

This is an evolving MVP. LLM outputs can vary between runs and models. A quotation may be accurate but not the most relevant evidence; a feature omitted from a scope is not necessarily explicitly excluded; and a vague agreement may require human clarification. Review each finding before acting on it.

Before using the tool for real client work, test it against representative agreements and requests, verify that no private project data is committed to the repository, and confirm the behaviour of your chosen local model.

## Contributing

Bug reports, reproducible examples, documentation improvements, and regression tests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request.

## License

This project is intended to be released under the MIT License. See [LICENSE](LICENSE).
