# 🎮 Retro Platform Fighter - Diamond Quest

A classic 2D platformer game built with Python and Pygame, featuring a young hero on a quest to collect diamonds and defeat evil robots across 5 challenging levels.

![Game Screenshot](screenshot.png)

## 🌟 Features

### 🧒 Character Design
- **Detailed Boy Character**: Complete with head, hair, body, arms, and legs
- **Smooth Animations**: Walking animation with realistic leg movement
- **Combat Animations**: Visible punch and kick attacks with extended limbs
- **Character Customization**: Blue shirt, dark pants, and brown hair

### 💎 Diamond Collection System
- **Resource Management**: Start with 50 diamonds, collect more throughout levels
- **Risk/Reward Mechanics**: Lose 5 diamonds when touched by enemies (unless attacking)
- **Life System**: Lose a life when diamonds reach zero
- **Score System**: Earn points for collecting diamonds and defeating enemies

### 🗺️ World Design
- **Large Scrolling Levels**: 3000px wide levels with smooth camera following
- **5 Progressive Levels**: Each with unique layouts and increasing difficulty
- **Varied Terrain**: Multiple platform heights and challenging jumps
- **Strategic Placement**: Diamonds and enemies positioned for optimal gameplay

### 🤖 Enemy System
- **Multiple Robot Types**: 
  - Normal robots (30 HP, moderate speed)
  - Tough robots (60 HP, faster movement)
- **Smart AI**: Patrol patterns and player-chasing behavior
- **Combat Mechanics**: Vulnerable to punches, kicks, and jump attacks

### 👹 Boss Battles
- **Level Bosses**: Unique boss at the end of each level
- **Progressive Difficulty**: Bosses get stronger and smarter each level
- **Advanced AI**: Different attack patterns and special abilities
- **Gatekeeper System**: Must defeat all robots before accessing boss

### 🎯 Game Progression
- **5 Challenging Levels**: From beginner-friendly to expert difficulty
- **Lives System**: 3 lives with respawn mechanics
- **Score Tracking**: Points for diamonds (10), robots (100), and bosses (500)
- **Victory Conditions**: Complete all levels to achieve ultimate victory

## 🎮 Controls

| Key | Action |
|-----|--------|
| **Arrow Keys** / **WASD** | Move left/right and jump |
| **X** | Punch (close range, quick attack) |
| **Z** | Kick (longer range, more damage) |
| **ESC** | Quit game |
| **R** | Restart game (when game over) |
| **ENTER** | Advance to next level (after boss defeat) |

## 🚀 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- Conda package manager

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd retro-platform-game
   ```

2. **Create and activate conda environment**:
   ```bash
   conda create -n gamer python=3.13
   conda activate gamer
   ```

3. **Install Pygame**:
   ```bash
   conda install -c conda-forge pygame
   ```

4. **Run the game**:
   ```bash
   python retro_platform_game.py
   ```

## 🎯 Gameplay Guide

### Basic Mechanics
- **Movement**: Use arrow keys or WASD to move and jump
- **Combat**: Press X to punch or Z to kick enemies
- **Collection**: Walk over diamonds to collect them
- **Health**: Diamonds serve as your health - don't let them reach zero!

### Combat System
- **Punch**: Quick, close-range attack (15 damage to normal robots)
- **Kick**: Slower but longer range and more powerful (25 damage)
- **Jump Attack**: Land on enemies to damage them (20 damage)
- **Invulnerability**: Brief protection after taking damage

### Level Progression
1. **Explore**: Navigate through platforms to find all diamonds
2. **Fight**: Defeat robots using combat moves or jump attacks
3. **Clear**: Eliminate all robots to unlock the boss area
4. **Boss Battle**: Face the level boss in epic combat
5. **Advance**: Complete the level to progress to the next challenge

### Scoring System
- **Diamonds Collected**: 10 points each
- **Robots Defeated**: 100 points each
- **Bosses Defeated**: 500 points each
- **Level Completion**: Bonus points for finishing levels

## 🏆 Level Guide

### Level 1: "First Steps"
- **Difficulty**: Beginner
- **Robots**: 6 normal robots
- **Boss**: Level 1 Boss (100 HP)
- **Focus**: Learn basic mechanics and combat

### Level 2: "Rising Challenge"
- **Difficulty**: Easy-Medium
- **Robots**: 9 normal robots
- **Boss**: Level 2 Boss (150 HP)
- **Focus**: More complex platforming

### Level 3: "Vertical Ascent"
- **Difficulty**: Medium
- **Robots**: 11 normal robots
- **Boss**: Level 3 Boss (200 HP)
- **Focus**: Vertical platforming challenges

### Level 4: "Mixed Warfare"
- **Difficulty**: Medium-Hard
- **Robots**: 12 mixed (normal + tough)
- **Boss**: Level 4 Boss (250 HP)
- **Focus**: Combat variety and strategy

### Level 5: "Ultimate Trial"
- **Difficulty**: Expert
- **Robots**: 16 tough robots
- **Boss**: Final Boss (300 HP)
- **Focus**: Master-level challenge requiring all skills

## 🛠️ Technical Details

### Architecture
- **Engine**: Pygame 2.6.1
- **Language**: Python 3.13
- **Resolution**: 1024x768 pixels
- **Frame Rate**: 60 FPS
- **World Size**: 3000x768 pixels per level

### Key Classes
- **Player**: Main character with movement, combat, and state management
- **Robot**: Enemy AI with patrol and combat behaviors
- **Boss**: Advanced enemy with multiple attack patterns
- **Diamond**: Collectible items with animation
- **Platform**: Static world geometry with collision detection

### Performance Features
- **Culling**: Off-screen objects are not rendered
- **Smooth Camera**: Interpolated camera following
- **Efficient Collision**: Optimized rectangle-based collision detection

## 🎨 Art & Design

### Visual Style
- **Retro Aesthetic**: Classic 2D platformer look
- **Bright Colors**: Vibrant palette for engaging gameplay
- **Clear Sprites**: Easily distinguishable characters and objects
- **Smooth Animation**: Fluid character movement and effects

### Color Palette
- **Sky**: Light blue background
- **Platforms**: Brown dirt with green grass tops
- **Player**: Blue shirt, dark pants, brown hair, skin tone
- **Robots**: Gray bodies with red glowing eyes
- **Diamonds**: Cyan with white outlines
- **UI**: White text with colored highlights

## 🐛 Known Issues & Future Enhancements

### Current Limitations
- Simple sprite graphics (geometric shapes)
- Basic sound effects not implemented
- No save/load functionality
- Limited animation frames

### Planned Features
- **Enhanced Graphics**: Sprite-based character art
- **Sound System**: Music and sound effects
- **Power-ups**: Special abilities and temporary boosts
- **More Levels**: Additional worlds and challenges
- **Multiplayer**: Local co-op gameplay
- **Customization**: Character skins and abilities

## 🤝 Contributing

We welcome contributions! Please feel free to:
- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Pygame Community**: For the excellent game development framework
- **Python Software Foundation**: For the Python programming language
- **Retro Gaming**: Inspired by classic platformer games

---

**Enjoy your adventure in Retro Platform Fighter - Diamond Quest!** 🎮✨
