# 🎮 Games Collection

A Django web application featuring multiple games, including the Retro Platform Fighter, with HTML5 Canvas gameplay, persistent game saves, and online leaderboards.

## 🌟 Features

### 🎯 Web-Based Gaming
- **HTML5 Canvas**: Smooth 60 FPS gameplay in your browser
- **Responsive Design**: Works on desktop and mobile devices
- **No Downloads**: Play instantly without installation

### 💾 Persistent Game State
- **Auto-Save**: Your progress is automatically saved
- **Session Management**: Resume your game from where you left off
- **Cross-Device**: Play on different devices with the same session

### 🏆 Online Features
- **Leaderboards**: Compete with other players worldwide
- **High Score Tracking**: Submit and view top scores
- **Player Statistics**: Track your progress and achievements

### 🎮 Available Games
- **Retro Platform Fighter**: A classic 2D platformer with combat mechanics
- More games coming soon!

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11 or higher
- Conda package manager
- PostgreSQL database

### Database Setup

1. **Create a PostgreSQL database**:
   ```sql
   CREATE DATABASE games_db;
   CREATE USER games_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE games_db TO games_user;
   ```

2. **Configure your database connection**:
   Create a `.env` file in the project root with:
   ```
   DATABASE_URL=postgres://games_user:your_password@localhost:5432/games_db
   DEBUG=True
   SECRET_KEY=your_secret_key
   ```

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/games-collection.git
   cd games-collection
   ```

2. **Run the setup script**:
   ```bash
   ./setup.sh
   ```

3. **Activate the conda environment**:
   ```bash
   conda activate gamer
   ```

4. **Initialize the database**:
   ```bash
   ./init_db.sh
   ```

5. **Start the server**:
   ```bash
   ./run.sh
   ```

6. **Open your browser** and navigate to:
   ```
   http://localhost:8000/
   ```

## 🌐 Deployment

This project can be deployed to any standard Django hosting platform.

For local development:

```bash
# Activate conda environment
conda activate gamer

# Start the development server
./run.sh
```

## 🎮 How to Play Retro Platform Fighter

### 🎯 Game Objective
- Collect diamonds throughout each level
- Defeat all robots to unlock the boss area
- Defeat the level boss to advance
- Complete all 5 levels to achieve victory!

### 🎮 Controls
| Key | Action |
|-----|--------|
| **Arrow Keys** / **WASD** | Move left/right and jump |
| **Space** | Jump (alternative) |
| **X** | Punch (close range, quick attack) |
| **Z** | Kick (longer range, more damage) |
| **ESC** | Pause/Resume game |
| **R** | Restart game (when game over) |

## 🏗️ Technical Architecture

### 🖥️ Backend (Django)
- **Models**: Game sessions, high scores, game states
- **Views**: Game rendering, API endpoints, leaderboards
- **Database**: SQLite (development)
- **Session Management**: Django sessions for game state persistence

### 🎨 Frontend (HTML5/JavaScript)
- **Canvas Rendering**: 2D graphics with smooth animations
- **Game Engine**: Custom JavaScript game loop at 60 FPS
- **Physics**: Gravity, collision detection, movement
- **Effects**: Particle systems for explosions and sparkles

## 🛠️ Development

### Project Structure
```
games-collection/
├── games/                   # Games package
│   ├── __init__.py
│   └── retro_platform_fighter/  # Retro Platform Fighter game
│       ├── __init__.py
│       ├── apps.py
│       ├── models.py
│       ├── urls.py
│       ├── views.py
│       ├── static/
│       └── templates/
├── games_manager/           # Games manager app
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── urls.py
│   ├── views.py
│   ├── migrations/
│   └── templates/
├── retro_game_web/          # Django project
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── manage.py                # Django management script
├── requirements.txt         # Project dependencies
├── setup.sh                 # Setup script
└── run.sh                   # Server startup script
```

### Adding New Games
1. Create a new folder in `/games/`
2. Add models, views, templates, and static files
3. Register in `settings.py`
4. Add URL patterns in main `urls.py`
5. Add game info in admin interface

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Django Framework**: Web framework for rapid development
- **HTML5 Canvas**: Modern web graphics API
- **Community**: Thanks to all contributors and players!
