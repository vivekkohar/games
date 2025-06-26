# 🎮 Retro Platform Fighter - Web Edition

A Django web application version of the classic 2D platformer game, featuring HTML5 Canvas gameplay, persistent game saves, and online leaderboards.

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

### 🎮 Original Game Features
- **5 Progressive Levels**: From beginner to expert difficulty
- **Combat System**: Punch, kick, and jump attacks
- **Diamond Collection**: Collect diamonds as health/currency
- **Boss Battles**: Epic end-level boss encounters
- **Smart AI**: Robots with patrol and chase behaviors

## 🚀 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- Conda package manager

### Quick Start

1. **Navigate to the web version directory**:
   ```bash
   cd retro_game_web
   ```

2. **Activate the conda environment**:
   ```bash
   conda activate gamer
   ```

3. **Install additional dependencies** (if not already installed):
   ```bash
   conda install django -y
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

## 🎮 How to Play

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

### 💎 Game Mechanics
- **Health System**: Diamonds serve as your health
- **Lives**: Start with 3 lives, lose one when diamonds reach zero
- **Combat**: Attack robots or jump on them to defeat them
- **Invulnerability**: Brief protection after taking damage
- **Boss Battles**: Must defeat all robots before accessing boss

## 🏗️ Technical Architecture

### 🖥️ Backend (Django)
- **Models**: GameSession, HighScore, GameState
- **Views**: Game rendering, API endpoints, leaderboards
- **Database**: SQLite (development) / PostgreSQL (production)
- **Session Management**: Django sessions for game state persistence

### 🎨 Frontend (HTML5/JavaScript)
- **Canvas Rendering**: 2D graphics with smooth animations
- **Game Engine**: Custom JavaScript game loop at 60 FPS
- **Physics**: Gravity, collision detection, movement
- **Effects**: Particle systems for explosions and sparkles

### 🔗 API Endpoints
- `POST /api/save-state/` - Save game progress
- `GET /api/load-state/` - Load game progress
- `POST /api/submit-score/` - Submit high score
- `GET /api/high-scores/` - Get leaderboard data
- `POST /api/reset-game/` - Reset game session

## 📱 Responsive Design

The game is designed to work on various screen sizes:
- **Desktop**: Full 1024x768 canvas experience
- **Tablet**: Scaled canvas with touch-friendly controls
- **Mobile**: Optimized layout with virtual controls

## 🎯 Game Progression

### Level Structure
1. **Level 1**: Tutorial level with basic enemies
2. **Level 2**: Increased difficulty and more platforms
3. **Level 3**: Vertical platforming challenges
4. **Level 4**: Mixed enemy types and complex layouts
5. **Level 5**: Ultimate challenge with tough enemies

### Scoring System
- **Diamonds**: 10 points each
- **Robots**: 100 points each
- **Bosses**: 500 points each
- **Level Completion**: Bonus points

## 🛠️ Development

### Project Structure
```
retro_game_web/
├── game/                   # Django app
│   ├── models.py          # Database models
│   ├── views.py           # Views and API endpoints
│   ├── urls.py            # URL routing
│   ├── admin.py           # Admin interface
│   ├── templates/         # HTML templates
│   └── static/            # CSS, JS, images
├── retro_game_web/        # Django project
│   ├── settings.py        # Django settings
│   └── urls.py            # Main URL config
└── manage.py              # Django management script
```

### Key Files
- `static/game/js/game.js` - Main game engine
- `templates/game/game.html` - Game canvas page
- `models.py` - Database schema
- `views.py` - Game logic and API

### Adding Features
1. **New Levels**: Modify `createPlatforms()` and `createRobots()` functions
2. **New Enemies**: Create new classes extending the Robot class
3. **Power-ups**: Add new collectible items with special effects
4. **Multiplayer**: Extend with WebSocket support for real-time play

## 🔧 Configuration

### Django Settings
- **DEBUG**: Set to `False` for production
- **ALLOWED_HOSTS**: Configure for your domain
- **DATABASE**: Switch to PostgreSQL for production
- **STATIC_FILES**: Configure for production serving

### Game Settings
Modify constants in `game.js`:
- `SCREEN_WIDTH/HEIGHT`: Canvas dimensions
- `PLAYER_SPEED`: Character movement speed
- `GRAVITY`: Physics gravity strength
- `FPS`: Target frame rate

## 🚀 Deployment

### Production Deployment
1. **Set up production database** (PostgreSQL recommended)
2. **Configure static files** serving (nginx/Apache)
3. **Set environment variables** for security
4. **Use WSGI server** (Gunicorn recommended)
5. **Set up SSL certificate** for HTTPS

### Docker Deployment
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "retro_game_web.wsgi:application"]
```

## 🎮 Game Features Comparison

| Feature | Original (Pygame) | Web Version |
|---------|------------------|-------------|
| Graphics | Pygame surfaces | HTML5 Canvas |
| Input | Keyboard events | Web keyboard events |
| Audio | Pygame mixer | Web Audio API |
| Save/Load | Local files | Database |
| Multiplayer | Local only | Online ready |
| Platform | Desktop only | Cross-platform |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
```bash
# Clone and setup
git clone <repository>
cd retro_game_web

# Install dependencies
conda create -n gamer python=3.11 django
conda activate gamer

# Setup database
python manage.py migrate
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Original Game**: Converted from Python/Pygame version
- **Django Framework**: Web framework for rapid development
- **HTML5 Canvas**: Modern web graphics API
- **Community**: Thanks to all contributors and players!

---

**Ready to play? Start your Diamond Quest adventure at http://localhost:8000/ !** 🎮✨
