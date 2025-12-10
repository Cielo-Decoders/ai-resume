# ai-resume
AI Resume Optimizer


## What this repo contains
- `server/` — a small FastAPI backend (Python).
- `client/` — a React frontend (created with Create React App / TypeScript).


## Prerequisites
- macOS (these instructions assume macOS but are applicable to Linux with small changes).
- Python 3 (use `python3`). On macOS Homebrew-managed Python can prevent system-wide `pip` installs; see the Virtual Environment section below.
- Node.js and npm for the client (you can install via Homebrew: `brew install node`).
- Homebrew (optional but recommended) — https://brew.sh/


## Quick start (recommended)
1. Open a terminal and cd into the project root:

```bash
cd "$(pwd)/$(dirname "$0")" || cd "/Users/username/project path/ai-resume"
# or simply:
cd /Users/username/prject path/ai-resume
```

2. Create and activate a Python virtual environment for the server (recommended to avoid macOS externally-managed environment issues):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install Python dependencies (inside the activated venv). If you don't have a `requirements.txt`, this installs the minimal dependencies the project needs:

```bash
python3 -m pip install --upgrade pip
python3 -m pip install fastapi uvicorn
```

Note: If your system prints the "externally-managed-environment" message, creating and using a virtual environment as shown above will avoid that issue.

4. Start the FastAPI server (from the project root):

```bash
# preferred (when uvicorn is on PATH inside the venv)
uvicorn server.main:app --reload

# or, if uvicorn isn't on PATH, run it via python -m
python3 -m uvicorn server.main:app --reload
```

The server will be available at: http://127.0.0.1:8000
Open http://127.0.0.1:8000/docs for the automatic OpenAPI docs (Swagger UI).


## Running the React client
1. Open a new terminal (or use the same venv if you want) and change into the `client` directory:

```bash
cd client
```

2. Install dependencies and start the dev server:

```bash
npm install
npm start
```

This usually opens http://localhost:3000 in your browser. The client will proxy or call the backend at the address configured in the client (check `client/package.json` or the client source for exact endpoints).


## Troubleshooting
- If `python3` is missing, install Python 3 with Homebrew:

```bash
brew install python
```

- If `pip` prints the "externally-managed-environment" message, use a virtual environment (see above). Alternatively, install apps globally with Homebrew (`brew install xyz`) or use `pipx` for CLI apps.

- If `uvicorn: command not found`, run it with:

```bash
python3 -m uvicorn server.main:app --reload
```

- If Node/npm are missing on macOS:

```bash
brew install node
```


## Advanced / optional
- To create a `requirements.txt` for reproducible installs, after installing packages in the venv run:

```bash
python3 -m pip freeze > server/requirements.txt
```

- To stop the server started with `uvicorn` press Ctrl+C in the terminal.


## Summary
- Start the backend: activate venv -> `uvicorn server.main:app --reload`
- Start the frontend: `cd client` -> `npm install && npm start`

If you'd like, I can also add a `server/requirements.txt` and a small `Makefile` or npm script to simplify these commands — tell me which you'd prefer.
