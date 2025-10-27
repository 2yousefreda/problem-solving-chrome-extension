# Problem Solving Reminder - Chrome Extension

A Chrome Extension that helps programmers build a daily habit of solving coding problems. The extension features a daily challenge system, progress tracking, streak monitoring, and a comprehensive roadmap of 75+ LeetCode problems.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)

## 📋 Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Admin Panel](#admin-panel)
- [Technologies Used](#technologies-used)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Features
- **Daily Challenge System**: One problem per day to maintain consistency
- **Progress Tracking**: Track solved problems and completion dates
- **Streak Monitoring**: Keep track of your daily solving streak
- **Full Roadmap**: View all 75+ problems organized by difficulty
- **User Authentication**: Simple username-based login system
- **Settings Management**: Reset progress, logout, and manage preferences
- **Admin Panel**: Add, edit, delete, and reorder problems

### UI Features
- Modern dark theme with cyan/blue accents
- Responsive design optimized for Chrome extension popup (350x500px)
- Smooth animations and transitions
- Difficulty badges (Easy/Medium/Hard)
- Interactive roadmap with completion status
- Loading states and error handling
- Confirmation modals for destructive actions

## 📁 Project Structure

```
problem-solving-reminder/
├── backend/
│   ├── server.js          # Express server with all API endpoints
│   ├── database.js        # SQLite database initialization
│   ├── admin.html         # Admin control panel UI
│   ├── problems.json      # Initial problem set (75+ problems)
│   ├── package.json       # Backend dependencies
│   └── .gitignore         # Git ignore file
├── extension/
│   ├── manifest.json      # Chrome extension manifest (v3)
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Extension logic
│   ├── styles.css         # Custom styles
│   └── icons/             # Extension icons
└── README.md              # This file
```

## 🔧 Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Google Chrome** browser
- **SQLite3** (installed via npm)

## 📦 Installation

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd problem-solving-reminder
   ```

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:8000`

### Chrome Extension Setup

1. **Open Chrome** and navigate to `chrome://extensions/`

2. **Enable Developer Mode** (toggle in the top-right corner)

3. **Click "Load unpacked"**

4. **Select the `extension` folder** from the project directory

5. **The extension icon** should now appear in your Chrome toolbar

## 🚀 Usage

### For Users

1. **Click the extension icon** in your Chrome toolbar

2. **Login/Register**:
   - Enter a username
   - Click "Login / Register"

3. **View Today's Challenge**:
   - See the problem title and difficulty
   - Click "Show Hint" for a helpful tip
   - Click "Open Problem" to solve on LeetCode
   - Click "Mark as Completed" when done

4. **Track Progress**:
   - View your solved count and streak in the footer
   - Click the roadmap icon to see all problems
   - Completed problems are marked with green

5. **Settings**:
   - Click the settings icon
   - Logout or reset your progress

### Admin Panel

Access the admin panel at `http://localhost:8000/admin`

**Features**:
- Add new problems
- Edit existing problems (title, difficulty, hint, URL)
- Delete problems
- Reorder problems (move up/down)
- All changes are immediately saved to the database

## 📚 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### 1. User Login/Registration
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "string"
}
```

**Response**: `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "code-master"
  }
}
```

---

#### 2. Get Daily Challenge
```http
GET /api/challenge?username=<username>
```

**Response**: `200 OK`
```json
{
  "data": {
    "id": 1,
    "title": "Two Sum",
    "difficulty": "Easy",
    "hint": "Use a hash map...",
    "url": "https://leetcode.com/problems/two-sum/",
    "order": 1
  },
  "status": "incomplete"
}
```

**Status Values**:
- `incomplete`: User has a problem to solve today
- `completed_today`: User already completed today's problem
- `all_completed`: User finished all problems

---

#### 3. Complete Challenge
```http
POST /api/challenge/complete?username=<username>
Content-Type: application/json

{
  "problemId": 1
}
```

**Response**: `200 OK`
```json
{
  "message": "Success",
  "completedId": 1
}
```

**Error**: `403 Forbidden` (if already completed today)
```json
{
  "error": "You can only complete one problem per day."
}
```

---

#### 4. Get User Statistics
```http
GET /api/stats?username=<username>
```

**Response**: `200 OK`
```json
{
  "data": {
    "solved": 15,
    "total": 75,
    "streak": 7
  }
}
```

---

#### 5. Get Full Roadmap
```http
GET /api/roadmap?username=<username>
```

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "title": "Two Sum",
      "difficulty": "Easy",
      "hint": "Use a hash map...",
      "url": "https://leetcode.com/problems/two-sum/",
      "order": 1,
      "completed": 1
    },
    ...
  ]
}
```

---

#### 6. Reset Progress
```http
POST /api/challenge/reset?username=<username>
```

**Response**: `200 OK`
```json
{
  "message": "Progress reset successfully",
  "rowsDeleted": 15
}
```

---

### Admin Endpoints

#### 7. Get All Problems
```http
GET /api/admin/problems
```

#### 8. Add Problem
```http
POST /api/admin/problems
Content-Type: application/json

{
  "title": "string",
  "difficulty": "Easy|Medium|Hard",
  "hint": "string",
  "url": "string"
}
```

#### 9. Update Problem
```http
PUT /api/admin/problems/:id
Content-Type: application/json

{
  "title": "string",
  "difficulty": "Easy|Medium|Hard",
  "hint": "string",
  "url": "string"
}
```

#### 10. Delete Problem
```http
DELETE /api/admin/problems/:id
```

#### 11. Reorder Problems
```http
POST /api/admin/problems/reorder
Content-Type: application/json

{
  "problems": [
    { "id": 1, "order": 1 },
    { "id": 2, "order": 2 },
    ...
  ]
}
```

## 🗄️ Database Schema

The application uses SQLite with three tables:

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL
)
```

### Problems Table
```sql
CREATE TABLE problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT UNIQUE,
  difficulty TEXT,
  hint TEXT,
  url TEXT,
  "order" INTEGER
)
```

### User Progress Table
```sql
CREATE TABLE user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  problem_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE (user_id, problem_id)
)
```

## 🎨 Admin Panel

The admin panel is a full-featured web interface for managing problems:

### Access
Navigate to `http://localhost:8000/admin` while the server is running.

### Features

1. **Add New Problem**
   - Fill in title, difficulty, URL, and hint
   - Problem is automatically added to the end of the roadmap

2. **Edit Problem**
   - Click the edit icon (pencil)
   - Modify any field
   - Click "Save" to confirm

3. **Delete Problem**
   - Click the delete icon (trash)
   - Confirm deletion

4. **Reorder Problems**
   - Use the up/down arrows to change problem order
   - Changes are saved immediately
   - Affects the order users see problems

### UI Features
- Built with Tailwind CSS
- Responsive design
- Real-time validation
- Difficulty color coding
- Smooth animations

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite3** - Database
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-reload

### Frontend (Extension)
- **Vanilla JavaScript** - Core logic
- **HTML5** - Structure
- **Tailwind CSS** - Styling
- **Chrome Extension Manifest V3** - Extension framework

### Admin Panel
- **Tailwind CSS** (CDN)
- **Vanilla JavaScript**
- **Google Fonts** (Inter)

## 💻 Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Extension Development

1. Make changes to files in the `extension/` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test changes in the popup

### Database Management

The database file `db.sqlite` is created automatically when the server starts for the first time. It's populated with problems from `problems.json`.

To reset the database:
```bash
cd backend
rm db.sqlite
npm start  # Will recreate the database
```

### Adding New Problems

**Method 1: Via Admin Panel**
- Go to `http://localhost:8000/admin`
- Use the "Add New Problem" form

**Method 2: Edit problems.json**
- Edit `backend/problems.json`
- Delete `backend/db.sqlite`
- Restart the server

## 🔄 How It Works

### Daily Challenge Logic

1. **User requests today's challenge**
2. **System checks** if user completed a problem today
3. **If completed**: Show completion message
4. **If not completed**: Find the next unsolved problem based on order
5. **User marks as complete**: Record completion with today's date
6. **One problem per day**: Enforced at the API level

### Streak Calculation

1. Check the user's most recent completion date
2. If today or yesterday: Count consecutive days backward
3. If neither: Streak is 0

### Problem Order

Problems are ordered by the `order` field in the database. When a user completes all problems with a lower order, the next problem becomes available.

## 📝 Configuration

### Changing the Server Port

Edit `backend/server.js`:
```javascript
const PORT = 8000;  // Change to your desired port
```

Also update `extension/manifest.json`:
```json
"host_permissions": [
  "http://localhost:YOUR_PORT/"
]
```

### Customizing the Problem Set

Edit `backend/problems.json` before first run, or use the admin panel after setup.

## 🐛 Troubleshooting

### Extension can't connect to backend
- Ensure the backend server is running on port 8000
- Check the browser console for CORS errors
- Verify the URL in `extension/popup.js` matches your backend

### Database errors
- Delete `backend/db.sqlite` and restart the server
- Check that `backend/problems.json` is valid JSON

### Extension not loading
- Ensure manifest.json is valid
- Check for JavaScript errors in the extension popup
- Reload the extension from `chrome://extensions/`

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👨‍💻 Authors

Created as a tool to help developers maintain a consistent problem-solving practice.

## 🙏 Acknowledgments

- Problems curated from LeetCode
- Inspired by the need for consistent coding practice
- Built with love for the developer community

---

**Happy Coding! 🚀**
