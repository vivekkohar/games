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
- Python 3.7 or higher
- Conda package manager

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/games-collection.git
   cd games-collection
   ```

2. **Activate the conda environment**:
   ```bash
   conda activate gamer
   ```

3. **Install additional dependencies** (if not already installed):
   ```bash
   conda install django pillow -y
   ```

4. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser** (optional, for admin access):
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server**:
   ```bash
   python manage.py runserver
   ```

7. **Open your browser** and navigate to:
   ```
   http://localhost:8000/
   ```

## 🌐 Deployment

### Azure Web Apps Deployment

This project is configured for deployment to Azure Web Apps using GitHub Actions. For detailed instructions, see [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md).

Quick deployment steps:

1. **Set up Azure resources**:
   ```bash
   ./setup-azure-deployment.sh
   ```

2. **Push to GitHub**:
   ```bash
   git push origin main
   ```

3. **Access your deployed application**:
   ```
   https://v-games.azurewebsites.net
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
- **Database**: SQLite (development) / PostgreSQL (production)
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
├── start_server.sh          # Server startup script
└── setup-azure-deployment.sh # Azure deployment script
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
