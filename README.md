# AI Resume Optimizer - CareerLab AI

An AI-powered resume optimization platform that helps job seekers create ATS-friendly resumes and land interviews.

## 🚀 Quick Start

### From Root Directory

1. **Install dependencies:**
   ```bash
   npm run install:client   # Install React dependencies
   npm run install:server   # Install Python dependencies
   ```

2. **Run the application:**
   ```bash
   npm start                # Start client only (React app)
   npm run server           # Start server only (FastAPI backend)
   npm run dev              # Start both client and server
   ```

### From Specific Directories

**Client (React):**
```bash
cd client
npm install
npm start
```

**Server (FastAPI):**
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📂 Project Structure

```
ai-resume/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   └── services/   # API services
│   └── package.json
├── server/              # FastAPI backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── routes/
│   ├── main.py
│   └── requirements.txt
└── package.json        # Root package.json for convenience scripts
```

## 🌟 Features

- **AI-Powered Analysis** - Advanced AI algorithms analyze resumes
- **ATS Score Optimization** - Detailed scoring and recommendations
- **Smart Resume Tailoring** - Automatic optimization for job descriptions
- **Instant Feedback** - Real-time analysis and suggestions
- **Privacy & Security** - Encrypted processing, no data retention

## 🛠️ Available Commands

From the **root directory** (`ai-resume/`):

| Command | Description |
|---------|-------------|
| `npm start` | Start React client on http://localhost:3000 |
| `npm run server` | Start FastAPI server on http://localhost:8000 |
| `npm run dev` | Start both client and server concurrently |
| `npm run client` | Start React client |
| `npm run install:client` | Install client dependencies |
| `npm run install:server` | Install server dependencies |
| `npm run build:client` | Build client for production |

## 🔧 Environment Setup

Make sure you have:
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

## 👥 Development Team

- Isaac Narteh
- Kyle Drummonds
- Alejandro Ramos

## 📄 License

MIT License

## 🌐 Domain

Production: https://mycareerlab.ai

---

**Note:** Always run `npm start` from the root directory, or `cd client && npm start` if you're in a subdirectory.
{
  "name": "ai-resume",
  "version": "1.0.0",
  "description": "AI-powered resume optimization platform",
  "scripts": {
    "client": "cd client && npm start",
    "server": "cd server && python -m uvicorn main:app --reload",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "install:client": "cd client && npm install",
    "install:server": "cd server && pip install -r requirements.txt",
    "build:client": "cd client && npm run build",
    "start": "npm run client"
  },
  "keywords": [
    "resume",
    "ats",
    "ai",
    "career",
    "optimization"
  ],
  "authors": [
    "Isaac Narteh",
    "Kyle Drummonds",
    "Alejandro Ramos"
  ],
  "license": "MIT",
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}

