# 📋 KanbanFlow

A sleek, premium, "no-fuss" Kanban Board designed for tracking your to-do items. It is highly optimized for **mobiles, tablets, and desktops**, features **secure multi-user authentication**, an **administrative control panel**, a **cross-platform React Native mobile app**, and is built to run on your **home server** via Docker.

Built with **React (Vite)** on the frontend, **Node.js (Express)** on the backend, and **Expo** for the React Native mobile app, it uses a simple, lightweight JSON-file database. This allows seamless synchronization across all your home devices without the need for databases, external user accounts, or complex configurations!

---

## ✨ Features

- **📱 Mobile & Tablet Optimized**: 
  - Standard drag-and-drop support on desktop and tablets.
  - Custom column Tab Bar on mobile to easily switch views.
  - Quick-move buttons on mobile cards (`← Back` and `Next →`) for fluid touch management.
- **🔒 Secure Multi-User Auth**: Isolated workspaces per user with email and password sign-in (using salted bcrypt hashing and JWT tokens).
- **👑 Administrative Control Panel**: Administrators (`isAdmin: true`) can manage users, reset passwords, change access roles, and delete users (which automatically cleans up their tasks).
- **📱 Offline-First Mobile App**: A companion Expo-based React Native mobile app with local caching, offline outbox synchronization, and background automatic synchronization.
- **🎨 Premium Sleek UI**: Beautiful dark mode (default) and light mode toggle, complete with modern glassmorphism elements, clean layout structures, status glow indicators, and smooth micro-animations.
- **🔍 Quick Search & Filter**: Search cards instantly by title or details, or filter cards by priority level (Low, Medium, High).
- **💾 Auto-Sync Persistence**: Saves your data to local JSON databases. Every device connected to your homeserver sees the exact same board instantly.
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
├── mobile/
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

### 3. Default Credentials
On the first startup, KanbanFlow automatically seeds a default administrator account:
- **Email**: `admin@kanban.local`
- **Password**: `admin`

*Note: For security, please log in and change the admin password or create your personal account and delete/demote the seed admin inside the Admin panel!*

### 4. Backing Up Your Data
Your tasks and users are saved inside the Docker volume. If you want to store them in a local directory on your host for easy backups:
1. Open `docker-compose.yml`
2. Change the volume line:
   ```yaml
   volumes:
     - ./data:/data
   ```
3. Restart the container. A `data` folder will be created locally on your host containing `users.json`, `tasks.json`, and `jwt.secret`.

---

## 📱 Mobile App (React Native + Expo)

KanbanFlow includes a gorgeous mobile app built on Expo so you can manage your items on the go.

### Offline-First Architecture
The mobile app stores all data locally in `AsyncStorage`. If you lose internet connection:
1. You can still view, add, modify, and delete tasks.
2. Changes are stored in an **Offline Outbox queue**.
3. When you reconnect, the app's sync engine runs, processes the outbox sequentially, and automatically synchronizes with your homeserver.
4. Auto-sync triggers automatically every 15 seconds or whenever you launch the app/connect to Wi-Fi.

### Setup and Testing
To run the mobile app on a physical phone:
1. Navigate to the `mobile/` directory:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Expo developer server:
   ```bash
   npx expo start
   ```
4. Install **Expo Go** on your physical Android phone (from the Google Play Store).
5. Scan the QR code displayed in your terminal using the Expo Go app.
6. Enter your Home Server's IP address (e.g. `http://192.168.1.50:3000`) and log in using your email and password!

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

