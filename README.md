# 📋 KanbanFlow

A sleek, premium, "no-fuss" Kanban Board designed for tracking your to-do items. It is highly optimized for **mobiles, tablets, and desktops**, and built to run on your **home server** via Docker.

Built with **React (Vite)** on the frontend and **Node.js (Express)** on the backend, it uses a simple, lightweight JSON-file database. This allows seamless synchronization across all your home devices without the need for databases, external user accounts, or complex configurations!

---

## ✨ Features

- **📱 Mobile & Tablet Optimized**: 
  - Standard drag-and-drop support on desktop and tablets.
  - Custom column Tab Bar on mobile to easily switch views.
  - Quick-move buttons on mobile cards (`← Back` and `Next →`) for fluid touch management.
- **🎨 Premium Sleek UI**: Beautiful dark mode (default) and light mode toggle, complete with modern glassmorphism elements, clean layout structures, status glow indicators, and smooth micro-animations.
- **🔍 Quick Search & Filter**: Search cards instantly by title or details, or filter cards by priority level (Low, Medium, High).
- **💾 Auto-Sync Persistence**: Saves your data to a `tasks.json` database. Every device connected to your homeserver sees the exact same board instantly.
- **🐳 Docker Native**: Standard multi-stage Docker build ready to run on Unraid, Synology, Raspberry Pi, or any generic Linux home server.

---

## 🚀 Home Server Deployment

The simplest way to deploy KanbanFlow is using **Docker Compose**.

### 1. Structure
Ensure your files are structured like this on your home server:
```text
kanban-board/
├── backend/
├── frontend/
├── Dockerfile
└── docker-compose.yml
```

### 2. Startup
Navigate to the directory in your shell and run:
```bash
docker compose up -d --build
```
Your board will compile and be available on port **`3000`**! Open your browser and navigate to:
`http://<your-home-server-ip>:3000`

### 3. Backing Up Your Tasks
Your tasks are saved to `tasks.json` inside the Docker volume. If you want to store them in a local directory on your host for easy backups:
1. Open `docker-compose.yml`
2. Change the volume line:
   ```yaml
   volumes:
     - ./data:/data
   ```
3. Restart the container. A `data` folder will be created locally on your host containing `tasks.json`.

---

## 🛠️ Local Developer Setup

If you wish to test or run the application directly on your local machine:

### 1. Start the Backend API
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server (runs on `http://localhost:3000`):
   ```bash
   npm start
   ```

### 2. Start the React Frontend
1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs on `http://localhost:5173`):
   ```bash
   npm run dev
   ```
4. Vite is preconfigured to automatically proxy `/api` requests to your Express backend, allowing complete development integration!
