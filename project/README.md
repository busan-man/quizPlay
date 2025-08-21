# Educational Quiz Platform

A full-stack interactive educational quiz platform similar to Blooket or Gimkit, featuring real-time multiplayer gameplay with Unity WebGL integration.

## Features

- **Teacher Dashboard:** Create and manage quiz sessions, upload questions, and monitor student progress
- **Student Experience:** Join games with a code, choose a nickname, and compete in real-time
- **Real-time Gameplay:** Socket.IO integration for live gameplay and instant scoring
- **Unity WebGL Integration:** Host interactive game experiences embedded in the platform
- **Multiple Game Modes:** Support for different styles of play (Quiz, CryptoHack, Race)
- **Role-based Authentication:** Separate experiences for teachers and students

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, Socket.IO
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT-based authentication
- **Game Integration:** Unity WebGL (iframe embed)

## Project Structure

```
/
├── client/              # Frontend React application
│   ├── public/          # Static assets
│   └── src/             # React source code
│       ├── api/         # API service layer
│       ├── components/  # Reusable components
│       ├── layouts/     # Page layouts
│       ├── pages/       # Page components
│       ├── socket/      # Socket.IO client
│       └── stores/      # State management with Zustand
│
├── server/              # Backend Node.js application
│   ├── public/          # Public assets (includes Unity WebGL build)
│   └── src/             # Server source code
│       ├── controllers/ # API Controllers
│       ├── middleware/  # Express middlewares
│       ├── models/      # Mongoose models
│       ├── routes/      # API routes
│       └── socket/      # Socket.IO handlers
│
└── public/              # Unity WebGL build files
    └── unity/           # Unity game files
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the server directory based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

## Unity Integration

To integrate a Unity WebGL game:

1. Build your Unity project with WebGL target
2. Place the build files in `/public/unity/`
3. The game will be embedded in the game view via iframe
4. Use Socket.IO to communicate between the game and the platform

## License

This project is licensed under the MIT License - see the LICENSE file for details.