# Contributing to Retro Platform Fighter - Diamond Quest

Thank you for your interest in contributing to our retro platformer game! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
1. **Check existing issues** first to avoid duplicates
2. **Use the bug report template** when creating new issues
3. **Provide detailed information**:
   - Operating system and version
   - Python and Pygame versions
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots if applicable

### Suggesting Features
1. **Check the roadmap** in README.md for planned features
2. **Create a feature request** with detailed description
3. **Explain the use case** and benefits
4. **Consider implementation complexity**

### Code Contributions

#### Getting Started
1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/retro-platform-game.git
   cd retro-platform-game
   ```
3. **Set up development environment**:
   ```bash
   conda env create -f environment.yml
   conda activate gamer
   ```

#### Development Workflow
1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**
3. **Test thoroughly**:
   - Test all game mechanics
   - Verify all levels work correctly
   - Check performance on different systems
4. **Commit with clear messages**:
   ```bash
   git commit -m "Add: New enemy type with special abilities"
   ```
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request**

## 📋 Development Guidelines

### Code Style
- **Follow PEP 8** Python style guidelines
- **Use meaningful variable names**
- **Add comments** for complex logic
- **Keep functions focused** and reasonably sized
- **Use type hints** where appropriate

### Game Design Principles
- **Maintain retro aesthetic** and feel
- **Keep gameplay balanced** and fair
- **Ensure accessibility** for different skill levels
- **Preserve performance** on older hardware
- **Test on multiple platforms**

### Architecture Guidelines
- **Keep classes focused** on single responsibilities
- **Use composition** over inheritance where appropriate
- **Maintain clean separation** between game logic and rendering
- **Optimize for performance** without sacrificing readability

## 🎮 Areas for Contribution

### High Priority
- **Enhanced Graphics**: Replace geometric shapes with proper sprites
- **Sound System**: Add music and sound effects
- **Performance Optimization**: Improve frame rate and memory usage
- **Bug Fixes**: Address any gameplay or technical issues

### Medium Priority
- **New Levels**: Design additional challenging levels
- **Power-ups**: Implement temporary abilities and boosts
- **Enemy Variety**: Create new robot types with unique behaviors
- **UI Improvements**: Better menus and game interface

### Low Priority
- **Multiplayer**: Local co-op gameplay
- **Customization**: Character skins and abilities
- **Save System**: Game progress persistence
- **Mobile Support**: Touch controls and responsive design

## 🧪 Testing Guidelines

### Manual Testing
- **Play through all levels** completely
- **Test all combat mechanics** (punch, kick, jump attacks)
- **Verify diamond collection** and life system
- **Check boss battles** and level progression
- **Test edge cases** (falling off platforms, etc.)

### Performance Testing
- **Monitor frame rate** during gameplay
- **Check memory usage** over extended play
- **Test on different hardware** configurations
- **Verify smooth camera movement**

### Compatibility Testing
- **Test on multiple operating systems** (Windows, macOS, Linux)
- **Verify different Python versions** (3.7+)
- **Check various screen resolutions**

## 📝 Documentation

### Code Documentation
- **Add docstrings** to all classes and functions
- **Comment complex algorithms** and game logic
- **Update README.md** for new features
- **Maintain CHANGELOG.md** for all changes

### User Documentation
- **Update controls** if adding new inputs
- **Document new gameplay mechanics**
- **Add screenshots** for visual features
- **Update installation instructions** if needed

## 🎯 Pull Request Guidelines

### Before Submitting
- [ ] Code follows project style guidelines
- [ ] All tests pass (manual testing completed)
- [ ] Documentation updated for changes
- [ ] CHANGELOG.md updated
- [ ] No merge conflicts with main branch

### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Other (please describe)

## Testing
- [ ] Manual testing completed
- [ ] All levels playable
- [ ] No performance regressions
- [ ] Cross-platform testing (if applicable)

## Screenshots
Add screenshots for visual changes.

## Additional Notes
Any additional information or context.
```

## 🏆 Recognition

Contributors will be recognized in:
- **README.md acknowledgments**
- **Git commit history**
- **Release notes** for significant contributions

## 📞 Getting Help

- **Create an issue** for questions about contributing
- **Check existing documentation** first
- **Be patient** - maintainers will respond as soon as possible

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for helping make Retro Platform Fighter - Diamond Quest even better! 🎮✨
