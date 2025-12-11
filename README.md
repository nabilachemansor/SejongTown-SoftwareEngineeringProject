# SejongTown – Software Engineering Project

SejongTown is an event management platform designed for university students.
The system allows students to browse events, register, view their joined events, and interact with an AI chatbot that recommends upcoming activities based on their interests and event history.

---

This project consists of three main components:

- Frontend (HTML, CSS) – User interface

- Backend (Node.js + PostgreSQL) – Handles events, users, database

- AI Chatbot (Python + Flask) – NLP-based event helper bot

---

## Features

- View and explore campus events  
- Personalized event recommendations (date, category, keyword, etc.)  
- AI chatbot with NLP intent detection
- User verification system
- User login system  
- Student can create and manage events  
- PostgreSQL-backed data storage

---

## Installation Guide

1. Clone the repository
   ```bash
   git clone <repo-url>
   cd SejongTown-SoftwareEngineeringProject
   
   
2. Install frontend dependencies
   > <sub>node_module</sub> is not included because the folder too large
   
   Run this inside the main project folder:
   
   ```bash
   npm install
   ```

   This will automatically recreate <sub>node_module</sub> based on:
   
   - <sub>package.json</sub>
   
   - <sub>package-lock.json</sub>
   
3. Install ai dependencies
   Run:
   ```bash
   cd ai
   pip install -r requirements.txt
   ```
---

## Backend setup
Start the backend server

In Terminal 1:
```bash
node backend/server.js
```

or

```bash
server.js
```

Requirements

- PostgreSQL database must be running

- Environment variables must match your DB settings

- Make sure your DB has events or the main page will appear empty

## AI chatbot setup
Start the AI server

In Terminal 2:
```bash
cd ai
python app.py
```

The AI chatbot handles:

- Intent detection

- Date keyword parsing

- Monthly event filtering

- Category extraction

- Recommendations

- User registered events lookup

Make sure backend is running first because AI calls the backend API.

🖥 Frontend

Start the frontend:

```bash
npm start
```

The UI will load and include:

- Event list

- Event registration

- User dashboard

- AI chatbot interface


