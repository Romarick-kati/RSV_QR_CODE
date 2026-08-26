# Presence - RSVP and Attendance Management System

Presence is a full-stack web application designed for managing event registrations (RSVP) and tracking attendance using QR codes.

## Project Structure
This repository contains both the frontend and backend applications:
*   `presence-frontend/` - Built with React, Vite, and Tailwind CSS.
*   `presence-backend/` - Built with Node.js, Express, and MongoDB.

---

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
Make sure you have the following installed:
*   [Node.js](https://nodejs.org) (v16 or higher)
*   [MongoDB Atlas account](https://mongodb.com) (or local MongoDB community instance)

---

### 1. Backend Setup

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd presence-backend
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your database variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will typically run on `http://localhost:5000`.*

---

### 2. Frontend Setup

1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd presence-frontend
   ```
2. Install the required packages:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your backend API endpoint:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the frontend application:
   ```bash
   npm run dev
   ```
   *Vite will provide a local link, usually `http://localhost:5173`.*

---

## 🛠️ Tech Stack
*   **Frontend:** React, Vite, Tailwind CSS, Context API
*   **Backend:** Node.js, Express.js, Mongoose
*   **Database:** MongoDB Atlas
