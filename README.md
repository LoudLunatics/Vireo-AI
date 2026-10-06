Vireo AI

<img width="1280" height="720" alt="vireogif-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/a837be66-c55c-4985-988b-11b4da99b1e0" />


A productivity dashboard application powered by autonomous AI agents, designed to streamline task management, habit tracking, goal planning, and daily briefings.
Preview
Core Features

    Tasks Management: Create, update, filter (Pending, Overdue, Completed), and prioritize tasks using AI analysis.

    Habits Tracking: Manage daily routines, track streaks, and log daily completions.

    Goals & AI Roadmaps: Define long-term objectives and generate structured daily, weekly, monthly, or custom milestones automatically via AI.

    AI Daily Briefing: Context-aware daily summaries, workload analytics, and built-in burnout protection (Recovery Mode).

    Vector Memory: Semantic storage powered by SQLite-vec for long-term AI context retention.

Tech Stack

    Frontend: React, Tailwind CSS, Vite, Lucide Icons

    Backend: Node.js, Express

    Database: SQLite

    AI Integration: OpenRouter API

Project Structure
Plaintext

vireo-ai/
├── backend/
│   ├── config/          # Database and AI configuration
│   ├── controllers/     # Route logic controllers
│   ├── models/          # SQLite data models
│   ├── services/        # AI agents and vector services
│   └── server.js        # Entry point for backend
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components and modules
│   │   ├── services/    # API client service
│   │   └── App.jsx      # Root component
│   └── vite.config.js   # Vite configuration
└── package.json

Getting Started
Prerequisites

    Node.js (v18 or higher recommended)

    npm or yarn

Installation & Setup

    Clone the repository
    Bash

    git clone https://github.com/your-username/vireo-ai.git
    cd vireo-ai

    Backend Setup
    Bash

    # Install backend dependencies
    npm install

    # Configure environment variables
    cp .env.example .env
    # Edit .env and provide your OpenRouter API key

    # Start the backend server
    npm run dev

    Frontend Setup
    Bash

    # Navigate to the frontend directory
    cd frontend

    # Install frontend dependencies
    npm install

    # Start the development server
    npm run dev

Environment Variables

Create a .env file in the root directory with the following variables:
Cuplikan kode

PORT=5000
OPENROUTER_API_KEY=your_openrouter_api_key_here

A productivity dashboard application powered by autonomous AI agents, designed to streamline task management, habit tracking, goal planning, and daily briefings.
Preview
Core Features

    Tasks Management: Create, update, filter (Pending, Overdue, Completed), and prioritize tasks using AI analysis.

    Habits Tracking: Manage daily routines, track streaks, and log daily completions.

    Goals & AI Roadmaps: Define long-term objectives and generate structured daily, weekly, monthly, or custom milestones automatically via AI.

    AI Daily Briefing: Context-aware daily summaries, workload analytics, and built-in burnout protection (Recovery Mode).

    Vector Memory: Semantic storage powered by SQLite-vec for long-term AI context retention.

Tech Stack

    Frontend: React, Tailwind CSS, Vite, Lucide Icons

    Backend: Node.js, Express

    Database: SQLite

    AI Integration: OpenRouter API

Project Structure
Plaintext

vireo-ai/
├── backend/
│   ├── config/          # Database and AI configuration
│   ├── controllers/     # Route logic controllers
│   ├── models/          # SQLite data models
│   ├── services/        # AI agents and vector services
│   └── server.js        # Entry point for backend
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components and modules
│   │   ├── services/    # API client service
│   │   └── App.jsx      # Root component
│   └── vite.config.js   # Vite configuration
└── package.json

Getting Started
Prerequisites

    Node.js (v18 or higher recommended)

    npm or yarn

Installation & Setup

    Clone the repository
    Bash

    git clone https://github.com/your-username/vireo-ai.git
    cd vireo-ai

    Backend Setup
    Bash

    # Install backend dependencies
    npm install

    # Configure environment variables
    cp .env.example .env
    # Edit .env and provide your OpenRouter API key

    # Start the backend server
    npm run dev

    Frontend Setup
    Bash

    # Navigate to the frontend directory
    cd frontend

    # Install frontend dependencies
    npm install

    # Start the development server
    npm run dev

Environment Variables

Create a .env file in the root directory with the following variables:
Cuplikan kode

PORT=5000
OPENROUTER_API_KEY=your_openrouter_api_key_here!
