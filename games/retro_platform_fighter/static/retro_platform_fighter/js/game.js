console.log('🎮 Retro Platform Fighter - Web Edition Loaded!');
console.log('📅 Script loaded at:', new Date().toISOString());

// Retro Platform Fighter - Web Version
// Converted from Python/Pygame to HTML5 Canvas/JavaScript

// Game constants
const SCREEN_WIDTH = 1024;
const SCREEN_HEIGHT = 768;
const FPS = 60;
const WORLD_WIDTH = 3000;

// Colors
const COLORS = {
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    BLUE: '#6496FF',
    GREEN: '#228B22',
    BROWN: '#8B4513',
    RED: '#FF0000',
    GRAY: '#808080',
    YELLOW: '#FFFF00',
    PINK: '#FFC0CB',
    CYAN: '#00FFFF',
    PURPLE: '#800080',
    ORANGE: '#FFA500',
    SKY_BLUE: '#87CEEB',
    GOLD: '#FFD700',
    LIME: '#00FF00'
};

// Player constants
const PLAYER_SPEED = 6;
const JUMP_STRENGTH = -16;
const SUPER_JUMP_STRENGTH = -28; // Enhanced jump with super diamond (increased from -22)
const SUPER_JUMP_GRAVITY = 0.5; // Reduced gravity during super jump
const NORMAL_GRAVITY = 0.8;
const GRAVITY = NORMAL_GRAVITY;
const PUNCH_RANGE = 50; // Increased range
const KICK_RANGE = 65; // Increased range
const JUMP_DAMAGE = 30; // Damage when jumping on robots

// Sound Manager for Web Audio API
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.init();
    }
    
    init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.generateSounds();
        } catch (e) {
            console.warn('Web Audio API not supported, sounds disabled');
            this.enabled = false;
        }
    }
    
    generateSounds() {
        if (!this.enabled) return;
        
        // Generate procedural sounds
        this.sounds.punch = this.createTone(440, 0.1, 'square');
        this.sounds.kick = this.createTone(220, 0.15, 'square');
        this.sounds.jump = this.createSweep(200, 400, 0.2);
        this.sounds.diamondCollect = this.createTone(800, 0.3, 'sine');
        this.sounds.diamondLost = this.createSweep(400, 200, 0.4);
        this.sounds.robotHit = this.createNoise(0.1);
        this.sounds.bossHit = this.createTone(150, 0.2, 'square');
        this.sounds.explosion = this.createExplosion();
        this.sounds.lifeLost = this.createLifeLostSound();
    }
    
    createTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        return { oscillator, gainNode, duration };
    }
    
    createSweep(startFreq, endFreq, duration) {
        if (!this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        return { oscillator, gainNode, duration };
    }
    
    createNoise(duration) {
        if (!this.audioContext) return null;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        return { source, gainNode, duration };
    }
    
    createExplosion() {
        // Complex explosion sound with multiple frequencies
        return this.createNoise(0.3);
    }
    
    createLifeLostSound() {
        // Dramatic descending sequence
        return this.createSweep(600, 100, 0.8);
    }
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            // Resume audio context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            const sound = this.sounds[soundName];
            
            if (sound.oscillator) {
                // Create new oscillator for each play
                const newSound = this.createTone(
                    sound.oscillator.frequency.value,
                    sound.duration,
                    sound.oscillator.type
                );
                if (newSound) {
                    newSound.oscillator.start();
                    newSound.oscillator.stop(this.audioContext.currentTime + newSound.duration);
                }
            } else if (sound.source) {
                // Create new buffer source for each play
                const newSound = this.createNoise(sound.duration);
                if (newSound) {
                    newSound.source.start();
                }
            }
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }
}

// Global sound manager
let soundManager;

function playSound(soundName) {
    if (soundManager) {
        soundManager.play(soundName);
    }
}

// Game variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let gameState = {};
let camera = { x: 0, y: 0 };
let keys = {};
let lastTime = 0;

// Game objects
let player;
let platforms = [];
let robots = [];
let diamonds = [];
let superDiamonds = []; // New array for super diamonds
let boss = null;
let effects = [];

// Initialize game
function initGame() {
    try {
        console.log('🎮 Initializing game...');
        console.log('🔍 Checking for initialGameState:', typeof initialGameState !== 'undefined' ? 'Found' : 'Missing');
        
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        console.log('✅ Canvas found:', canvas.width + 'x' + canvas.height);
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get 2D context');
        }
        console.log('✅ Canvas context initialized');
        
        // Initialize sound manager
        soundManager = new SoundManager();
        console.log('✅ Sound manager initialized');
        
        // Check if initialGameState is defined
        if (typeof initialGameState === 'undefined') {
            console.warn('⚠️ initialGameState not defined, using defaults');
            window.initialGameState = {
                level: 1,
                diamonds: 50,
                lives: 3,
                score: 0,
                playerX: 100,
                playerY: 500,
                robotsDefeated: [],
                diamondsCollected: [],
                bossDefeated: false,
                levelCompleted: false
            };
        }
        
        // Set up game state with power-ups
        gameState = { 
            ...initialGameState,
            // Power-up states
            superJumpActive: false,
            superJumpTimer: 0,
            superStrengthActive: false,
            superStrengthTimer: 0,
            invincibilityActive: false,
            invincibilityTimer: 0
        };
        console.log('✅ Game state initialized:', gameState);
        
        // Hide loading message
        const loadingElement = document.getElementById('loadingMessage');
        if (loadingElement) {
            loadingElement.style.display = 'none';
            console.log('✅ Loading message hidden');
        }
        
        // Initialize game objects
        console.log('🎯 Initializing player...');
        initPlayer();
        console.log('✅ Player initialized');
        
        console.log('🏗️ Initializing level', gameState.level);
        initLevel(gameState.level);
        console.log('✅ Level initialized');
        
        // Set up event listeners
        console.log('🎧 Setting up event listeners...');
        setupEventListeners();
        console.log('✅ Event listeners set up');
        
        // Update UI and buttons
        console.log('🖥️ Updating UI...');
        updateGameState();
        console.log('✅ UI updated');
        
        // Start game loop
        gameRunning = true;
        lastTime = 0; // Reset timing
        requestAnimationFrame(gameLoop);
        console.log('✅ Game loop started');
        
        console.log('🎮 Game initialization complete!');
        
    } catch (error) {
        console.error('❌ Error initializing game:', error);
        console.error('Stack trace:', error.stack);
        
        // Show error message to user
        const loadingElement = document.getElementById('loadingMessage');
        if (loadingElement) {
            loadingElement.innerHTML = `
                <div style="color: red; padding: 20px;">
                    ❌ Error loading game: ${error.message}<br><br>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔄 Reload Page
                    </button>
                    <button onclick="console.log('Debug info:', {canvas: document.getElementById('gameCanvas'), initialGameState: typeof initialGameState !== 'undefined' ? initialGameState : 'undefined'})" style="margin: 10px; padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔍 Debug Info
                    </button>
                </div>
            `;
        }
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 50;
        this.velX = 0;
        this.velY = 0;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.health = gameState.diamonds;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        // Animation
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.attacking = false;
        this.attackType = '';
        this.attackTimer = 0;
        
        // Jump attack system
        this.wasInAir = false;
        this.jumpAttackCooldown = 0;
    }
    
    update() {
        // Handle input
        this.handleInput();
        
        // Update power-up timers
        this.updatePowerUps();
        
        // Apply gravity based on power-up state
        GRAVITY = gameState.superJumpActive ? SUPER_JUMP_GRAVITY : NORMAL_GRAVITY;
        
        // Track if player was in air (for jump attacks)
        this.wasInAir = !this.onGround;
        
        // Apply gravity
        this.velY += GRAVITY;
        
        // Update position
        this.x += this.velX;
        this.y += this.velY;
        
        // Check platform collisions
        this.checkPlatformCollisions();
        
        // Check jump attacks on robots - check every frame while in air
        if (this.wasInAir && this.jumpAttackCooldown <= 0) {
            this.checkJumpAttacks();
        }
        
        // Update jump attack cooldown
        if (this.jumpAttackCooldown > 0) {
            this.jumpAttackCooldown--;
        }
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update attack timer
        if (this.attacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }
        
        // Update walk animation
        if (Math.abs(this.velX) > 0.1) {
            this.walkTimer++;
            if (this.walkTimer >= 10) {
                this.walkFrame = (this.walkFrame + 1) % 4;
                this.walkTimer = 0;
            }
        } else {
            this.walkFrame = 0;
        }
        
        // Keep player in bounds
        this.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.x));
        
        // Update camera
        updateCamera();
    }
    
    updatePowerUps() {
        // Update super jump timer
        if (gameState.superJumpActive) {
            gameState.superJumpTimer--;
            if (gameState.superJumpTimer <= 0) {
                gameState.superJumpActive = false;
                console.log('🦘 Super Jump power-up expired');
            }
        }
        
        // Update super strength timer
        if (gameState.superStrengthActive) {
            gameState.superStrengthTimer--;
            if (gameState.superStrengthTimer <= 0) {
                gameState.superStrengthActive = false;
                console.log('💪 Super Strength power-up expired');
            }
        }
        
        // Update invincibility timer
        if (gameState.invincibilityActive) {
            gameState.invincibilityTimer--;
            if (gameState.invincibilityTimer <= 0) {
                gameState.invincibilityActive = false;
                console.log('🛡️ Invincibility power-up expired');
            }
        }
    }
    
    createShockwave() {
        // Create a shockwave effect that damages nearby enemies
        const shockwaveRadius = 150;
        const shockwaveDamage = 40;
        
        // Visual effect
        createExplosionEffect(this.x + this.width/2, this.y + this.height/2, shockwaveRadius/2);
        
        // Damage all nearby enemies
        [...robots, boss].forEach(enemy => {
            if (!enemy || enemy.defeated) return;
            
            const dx = (enemy.x + enemy.width/2) - (this.x + this.width/2);
            const dy = (enemy.y + enemy.height/2) - (this.y + this.height/2);
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < shockwaveRadius) {
                enemy.takeDamage(shockwaveDamage);
                // Knockback effect
                enemy.x += (dx / distance) * 10;
                enemy.y -= 5; // Slight upward knockback
            }
        });
        
        playSound('explosion');
    }
    
    checkJumpAttacks() {
        // First check robots
        let foundAttack = false;
        for (let i = 0; i < robots.length; i++) {
            const robot = robots[i];
            if (!robot.defeated && this.isOnTopOf(robot)) {
                foundAttack = true;
                console.log(`🦘 Attempting jump attack on robot at (${robot.x},${robot.y})`);
                // Enhanced jump attack damage with super strength
                const baseJumpDamage = JUMP_DAMAGE * (gameState.superStrengthActive ? 3 : 1);
                const damage = baseJumpDamage + (this.velY > 0 ? Math.abs(this.velY) * 2 : 0); // Bonus for falling speed

                // Apply damage
                robot.takeDamage(damage);
                console.log(`🤖 Robot HP after jump: ${robot.health}`);

                // Bounce effect - stronger if falling fast
                const bounceStrength = Math.min(Math.abs(this.velY) * 0.8, 15);
                this.velY = -bounceStrength;
                this.jumpAttackCooldown = 15; // Shorter cooldown for faster gameplay

                // Visual and audio feedback
                createHitEffect(robot.x + robot.width/2, robot.y - 10);
                playSound('explosion');

                console.log(`🦘 Jump attack! Damage: ${damage} (velY: ${this.velY.toFixed(1)})`);

                // Only process one robot per frame to avoid multiple bounces
                break;
            }
        }

        // Then check boss
        if (boss && !boss.defeated && this.isOnTopOf(boss)) {
            const baseJumpDamage = JUMP_DAMAGE * 1.5 * (gameState.superStrengthActive ? 3 : 1);
            const damage = baseJumpDamage + (this.velY > 0 ? Math.abs(this.velY) * 2 : 0);

            boss.takeDamage(damage);

            // Bounce higher off boss
            const bounceStrength = Math.min(Math.abs(this.velY) * 0.9, 18);
            this.velY = -bounceStrength;
            this.jumpAttackCooldown = 20;

            createHitEffect(boss.x + boss.width/2, boss.y - 20);
            playSound('explosion');
            console.log(`🦘 Jump attack on boss! Damage: ${damage} (velY: ${this.velY.toFixed(1)})`);
        }
    }
    
    handleInput() {
        this.velX = 0;
        
        // Movement
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.velX = -PLAYER_SPEED;
            this.facing = -1;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.velX = PLAYER_SPEED;
            this.facing = 1;
        }
        
        // Jumping with super jump support
        if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && this.onGround) {
            const jumpStrength = gameState.superJumpActive ? SUPER_JUMP_STRENGTH : JUMP_STRENGTH;
            this.velY = jumpStrength;
            this.onGround = false;
            playSound('jump');
            
            if (gameState.superJumpActive) {
                console.log('🦘 Super Jump activated!');
            }
        }
        
        // Attacks
        if (keys['KeyX'] && !this.attacking) {
            this.attack('punch');
            playSound('punch');
        }
        if (keys['KeyZ'] && !this.attacking) {
            this.attack('kick');
            playSound('kick');
        }
    }
    
    attack(type) {
        this.attacking = true;
        this.attackType = type;
        this.attackTimer = 20;
        
        // Enhanced damage with super strength
        const baseDamage = type === 'punch' ? 20 : 30; // Increased base damage
        const damage = gameState.superStrengthActive ? Math.floor(baseDamage * 2.5) : baseDamage; // 2.5x damage instead of 2x
        
        // Shockwave effect for super strength attacks
        if (gameState.superStrengthActive) {
            this.createShockwave();
        }
        const range = type === 'punch' ? PUNCH_RANGE : KICK_RANGE;
        
        console.log(`🥊 ${type} attack! Damage: ${damage}, Range: ${range}`);
        
        // Check robot hits with improved detection
        let hitCount = 0;
        robots.forEach(robot => {
            if (!robot.defeated && this.isInAttackRange(robot, range)) {
                robot.takeDamage(damage);
                createHitEffect(robot.x, robot.y);
                hitCount++;
                console.log(`🎯 Hit robot at (${robot.x}, ${robot.y})`);
            }
        });
        
        // Check boss hits
        if (boss && !boss.defeated && this.isInAttackRange(boss, range)) {
            boss.takeDamage(damage);
            createHitEffect(boss.x, boss.y);
            hitCount++;
            console.log(`🎯 Hit boss at (${boss.x}, ${boss.y})`);
        }
        
        if (hitCount === 0) {
            console.log('❌ Attack missed - no targets in range');
        // Check if target is in front of player (more lenient)
        const inFront = (this.facing === 1 && dx > -10) || (this.facing === -1 && dx < 10);
        
        // Check vertical alignment (more lenient)
        const verticallyAligned = Math.abs(dy) < 40;
        
        const inRange = distance <= range;
        
        console.log(`🎯 Attack check: distance=${distance.toFixed(1)}, range=${range}, inFront=${inFront}, verticallyAligned=${verticallyAligned}`);
        
        return inRange && inFront && verticallyAligned;
    }
    
    checkPlatformCollisions() {
        this.onGround = false;
        
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Landing on top
                if (this.velY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = 0;
                    this.onGround = true;
                }
                // Hitting from below
                else if (this.velY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velY = 0;
                }
                // Side collisions
                else if (this.velX > 0) {
                    this.x = platform.x - this.width;
                } else if (this.velX < 0) {
                    this.x = platform.x + platform.width;
                }
            }
        });
        
        // Ground collision
        if (this.y + this.height >= SCREEN_HEIGHT - 50) {
            this.y = SCREEN_HEIGHT - 50 - this.height;
            this.velY = 0;
            this.onGround = true;
        }
    }
    
    takeDamage(amount) {
        // Check for invincibility
        if (gameState.invincibilityActive) {
            console.log('🛡️ Damage blocked by invincibility!');
            createHitEffect(this.x, this.y - 20);
            playSound('block');
            
            // Shockwave effect when hit while invincible
            this.createShockwave();
            return;
        }
        
        if (!this.invulnerable) {
            gameState.diamonds -= amount;
            this.health = gameState.diamonds;
            this.invulnerable = true;
            this.invulnerableTime = 120; // 2 seconds at 60 FPS
            
            playSound('diamondLost');
            updateUI();
            
            if (gameState.diamonds <= 0) {
                this.die();
            }
        }
    }
    
    die() {
        gameState.lives--;
        playSound('lifeLost');
        updateUI();
        
        if (gameState.lives <= 0) {
            gameOver();
        } else {
            // Respawn
            gameState.diamonds = 50;
            this.health = 50;
            this.x = 100;
            this.y = 500;
            this.velX = 0;
            this.velY = 0;
        }
    }
    
    draw() {
        ctx.save();
        
        // Power-up visual effects
        if (gameState.invincibilityActive) {
            // Golden glow for invincibility
            ctx.shadowColor = COLORS.GOLD;
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 100);
        } else if (gameState.superStrengthActive) {
            // Red glow for super strength
            ctx.shadowColor = COLORS.RED;
            ctx.shadowBlur = 10;
        } else if (gameState.superJumpActive) {
            // Blue glow for super jump
            ctx.shadowColor = COLORS.BLUE;
            ctx.shadowBlur = 10;
        }
        
        // Flicker when invulnerable (from damage)
        if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        const x = this.x - camera.x;
        const y = this.y - camera.y;
        
        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.ellipse(x + this.width/2, y + this.height + 5, this.width/2, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw legs (pants)
        ctx.fillStyle = '#2C3E50'; // Dark blue pants
        const legOffset = Math.abs(this.velX) > 0.1 ? Math.sin(this.walkFrame * Math.PI / 2) * 3 : 0;
        
        if (this.attacking && this.attackType === 'kick') {
            // Extended leg for kick
            if (this.facing === 1) {
                ctx.fillRect(x + 25, y + 35, 15, 18); // Extended right leg
                ctx.fillRect(x + 8, y + 35, 10, 18);  // Left leg
            } else {
                ctx.fillRect(x - 5, y + 35, 15, 18);  // Extended left leg
                ctx.fillRect(x + 18, y + 35, 10, 18); // Right leg
            }
        } else {
            // Normal walking legs
            ctx.fillRect(x + 8 + legOffset, y + 35, 10, 18);  // Left leg
            ctx.fillRect(x + 16 - legOffset, y + 35, 10, 18); // Right leg
        }
        
        // Draw shoes
        ctx.fillStyle = '#8B4513'; // Brown shoes
        if (this.attacking && this.attackType === 'kick') {
            if (this.facing === 1) {
                ctx.fillRect(x + 25, y + 50, 18, 6); // Extended shoe
                ctx.fillRect(x + 8, y + 50, 12, 6);
            } else {
                ctx.fillRect(x - 8, y + 50, 18, 6);  // Extended shoe
                ctx.fillRect(x + 18, y + 50, 12, 6);
            }
        } else {
            ctx.fillRect(x + 8 + legOffset, y + 50, 12, 6);
            ctx.fillRect(x + 16 - legOffset, y + 50, 12, 6);
        }
        
        // Draw main body (shirt)
        ctx.fillStyle = '#3498DB'; // Blue shirt
        ctx.fillRect(x + 5, y + 15, 20, 25);
        
        // Draw shirt details
        ctx.fillStyle = '#2980B9'; // Darker blue for shirt details
        ctx.fillRect(x + 7, y + 17, 16, 2); // Collar
        ctx.fillRect(x + 13, y + 19, 4, 15); // Button line
        
        // Draw arms
        ctx.fillStyle = '#FFDBAC'; // Skin color
        const armY = y + 18;
        
        if (this.attacking && this.attackType === 'punch') {
            // Extended arm for punch
            if (this.facing === 1) {
                ctx.fillRect(x + 25, armY, 12, 8);     // Extended right arm
                ctx.fillRect(x - 3, armY, 8, 15);     // Left arm
            } else {
                ctx.fillRect(x - 7, armY, 12, 8);     // Extended left arm
                ctx.fillRect(x + 25, armY, 8, 15);    // Right arm
            }
        } else {
            // Normal arms
            ctx.fillRect(x - 3, armY, 8, 15);  // Left arm
            ctx.fillRect(x + 25, armY, 8, 15); // Right arm
        }
        
        // Draw hands
        ctx.fillStyle = '#FFDBAC';
        if (this.attacking && this.attackType === 'punch') {
            if (this.facing === 1) {
                ctx.fillRect(x + 35, armY + 2, 6, 6); // Extended hand
                ctx.fillRect(x - 3, armY + 13, 6, 6);
            } else {
                ctx.fillRect(x - 10, armY + 2, 6, 6); // Extended hand
                ctx.fillRect(x + 25, armY + 13, 6, 6);
            }
        } else {
            ctx.fillRect(x - 3, armY + 13, 6, 6);
            ctx.fillRect(x + 25, armY + 13, 6, 6);
        }
        
        // Draw neck
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 12, y + 5, 8, 10);
        
        // Draw head
        ctx.fillStyle = '#FFDBAC';
        ctx.fillRect(x + 8, y - 15, 16, 20);
        
        // Draw hair
        ctx.fillStyle = '#8B4513'; // Brown hair
        ctx.fillRect(x + 6, y - 18, 20, 8);
        ctx.fillRect(x + 8, y - 20, 16, 5); // Hair top
        
        // Draw hair details
        ctx.fillStyle = '#A0522D'; // Lighter brown highlights
        ctx.fillRect(x + 10, y - 17, 2, 6);
        ctx.fillRect(x + 16, y - 17, 2, 6);
        ctx.fillRect(x + 22, y - 17, 2, 6);
        
        // Draw eyes
        ctx.fillStyle = '#FFFFFF'; // White eyes
        ctx.fillRect(x + 10, y - 8, 3, 3);
        ctx.fillRect(x + 17, y - 8, 3, 3);
        
        // Draw pupils
        ctx.fillStyle = '#000000';
        const eyeDirection = this.facing === 1 ? 1 : 0;
        ctx.fillRect(x + 11 + eyeDirection, y - 7, 1, 2);
        ctx.fillRect(x + 18 + eyeDirection, y - 7, 1, 2);
        
        // Draw eyebrows
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x + 10, y - 10, 4, 1);
        ctx.fillRect(x + 16, y - 10, 4, 1);
        
        // Draw nose
        ctx.fillStyle = '#F4C2A1'; // Slightly darker skin
        ctx.fillRect(x + 14, y - 5, 2, 3);
        
        // Draw mouth
        ctx.fillStyle = '#000000';
        if (this.attacking) {
            // Open mouth when attacking
            ctx.fillRect(x + 13, y - 2, 4, 2);
        } else {
            // Small smile
            ctx.fillRect(x + 13, y - 1, 4, 1);
        }
        
        // Draw attack effects
        if (this.attacking) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;
            
            if (this.attackType === 'punch') {
                // Punch effect
                const punchX = this.facing === 1 ? x + 35 : x - 10;
                ctx.beginPath();
                ctx.arc(punchX, armY + 4, 8, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (this.attackType === 'kick') {
                // Kick effect
                const kickX = this.facing === 1 ? x + 35 : x - 15;
                ctx.beginPath();
                ctx.arc(kickX, y + 45, 10, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    // Add this method to the Player class
    isOnTopOf(target) {
        // Check if player is falling
        if (this.velY <= 0) return false;
        // Calculate player and target bounds
        const playerBottom = this.y + this.height;
        const playerTop = this.y;
        const targetTop = target.y;
        const targetBottom = target.y + target.height;
        const targetLeft = target.x;
        const targetRight = target.x + target.width;
        // Check horizontal overlap
        const horizontalOverlap = this.x + this.width > targetLeft + 8 && this.x < targetRight - 8;
        // Check if player's bottom is above the top half of the target and within a small margin
        const verticalCondition = playerBottom > targetTop && playerTop < targetTop && playerBottom < targetTop + target.height * 0.6;
        return horizontalOverlap && verticalCondition;
    }
}

// Initialize player
function initPlayer() {
    try {
        console.log('👤 Initializing player at:', gameState.playerX, gameState.playerY);
        player = new Player(gameState.playerX, gameState.playerY);
        console.log('✅ Player initialized:', player);
    } catch (error) {
        console.error('❌ Error initializing player:', error);
        throw error; // Re-throw to be caught by the caller
    }
}

// Platform class
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw() {
        // Draw dirt
        ctx.fillStyle = COLORS.BROWN;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        
        // Draw grass on top
        ctx.fillStyle = COLORS.GREEN;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, 10);
    }
}

// Continue in next part...
// Robot class
class Robot {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = 25;
        this.height = 40;
        this.type = type;
        this.health = type === 'tough' ? 60 : 30;
        this.maxHealth = this.health;
        this.speed = type === 'tough' ? 2 : 1.5;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        this.defeated = false;
        this.patrolDistance = 100;
        this.startX = x;
        this.chasing = false;
        this.attackCooldown = 0;
        this.velY = 0;
        this.onGround = false;
    }
    
    update() {
        if (this.defeated) return;
        
        // Apply gravity
        this.velY += GRAVITY;
        
        // Check if player is nearby
        const distanceToPlayer = Math.abs(this.x - player.x);
        this.chasing = distanceToPlayer < 150;
        
        let moveX = 0;
        if (this.chasing) {
            // Chase player
            if (player.x > this.x) {
                moveX = this.speed;
                this.direction = 1;
            } else {
                moveX = -this.speed;
                this.direction = -1;
            }
        } else {
            // Patrol behavior
            moveX = this.direction * this.speed * 0.5;
            
            if (Math.abs(this.x - this.startX) > this.patrolDistance) {
                this.direction *= -1;
            }
        }
        
        // Update position
        this.x += moveX;
        this.y += this.velY;

        // Check platform collisions
        this.checkPlatformCollisions();

        // Attack player only if colliding (AABB)
        const collidesWithPlayer =
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y;
        if (collidesWithPlayer && this.attackCooldown <= 0) {
            player.takeDamage(5);
            this.attackCooldown = 60; // 1 second cooldown
            playSound('robotHit');
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        // Keep in world bounds
        this.x = Math.max(0, Math.min(WORLD_WIDTH - this.width, this.x));
    }
    
    checkPlatformCollisions() {
        this.onGround = false;
        
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Landing on top
                if (this.velY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = 0;
                    this.onGround = true;
                }
                // Hitting from below
                else if (this.velY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velY = 0;
                }
            }
        });
        
        // Ground collision
        if (this.y + this.height >= SCREEN_HEIGHT - 50) {
            this.y = SCREEN_HEIGHT - 50 - this.height;
            this.velY = 0;
            this.onGround = true;
        }
        
        // Don't walk off platforms (simple AI)
        if (this.onGround && !this.chasing) {
            const futureX = this.x + this.direction * this.speed * 2;
            let willFall = true;
            
            platforms.forEach(platform => {
                if (futureX >= platform.x && futureX <= platform.x + platform.width &&
                    this.y + this.height <= platform.y + 10) {
                    willFall = false;
                }
            });
            
            // Check ground
            if (this.y + this.height >= SCREEN_HEIGHT - 60) {
                willFall = false;
            }
            
            if (willFall) {
                this.direction *= -1; // Turn around
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.defeated = true;
            gameState.score += 100;
            playSound('explosion');
            updateUI();
            createExplosionEffect(this.x, this.y);
        }
    }
    
    draw() {
        if (this.defeated) return;
        
        // Draw robot body
        ctx.fillStyle = this.type === 'tough' ? '#666666' : COLORS.GRAY;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        
        // Draw glowing eyes
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(this.x - camera.x + 5, this.y - camera.y + 5, 4, 4);
        ctx.fillRect(this.x - camera.x + 16, this.y - camera.y + 5, 4, 4);
        
        // Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = COLORS.RED;
            ctx.fillRect(this.x - camera.x - 2, this.y - camera.y - 10, barWidth, barHeight);
            
            ctx.fillStyle = COLORS.GREEN;
            ctx.fillRect(this.x - camera.x - 2, this.y - camera.y - 10, barWidth * healthPercent, barHeight);
        }
    }
}

// Boss class
class Boss {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.level = level;
        this.health = 100 + (level - 1) * 50;
        this.maxHealth = this.health;
        this.speed = 1 + level * 0.2;
        this.defeated = false;
        this.attackCooldown = 0;
        this.attackPattern = 0;
        this.direction = 1;
        this.velY = 0;
        this.onGround = false;
        this.startX = x; // Boss stays near the end
        this.patrolRange = 150; // Limited movement range
    }
    
    update() {
        if (this.defeated) return;
        
        // Apply gravity
        this.velY += GRAVITY;
        
        const distanceToPlayer = Math.abs(this.x - player.x);
        const playerInRange = distanceToPlayer < 200; // Only move when player is close
        
        // Move towards player but stay near the end
        if (playerInRange && distanceToPlayer > 60) {
            if (player.x > this.x && this.x < this.startX + this.patrolRange) {
                this.x += this.speed;
                this.direction = 1;
            } else if (player.x < this.x && this.x > this.startX - this.patrolRange) {
                this.x -= this.speed;
                this.direction = -1;
            }
        }
        
        // Update position with gravity
        this.y += this.velY;
        
        // Check platform collisions
        this.checkPlatformCollisions();
        
        // Attack patterns
        if (this.attackCooldown <= 0) {
            if (distanceToPlayer < 60) {
                // Melee attack
                player.takeDamage(10);
                this.attackCooldown = 90;
                playSound('bossHit');
            } else if (distanceToPlayer < 200 && this.level >= 3) {
                // Ranged attack for higher level bosses
                this.rangedAttack();
                this.attackCooldown = 120;
            }
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        // Keep boss in bounds but near the end
        this.x = Math.max(this.startX - this.patrolRange, 
                         Math.min(this.startX + this.patrolRange, this.x));
    }
    
    checkPlatformCollisions() {
        this.onGround = false;
        
        platforms.forEach(platform => {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {
                
                // Landing on top
                if (this.velY > 0 && this.y < platform.y) {
                    this.y = platform.y - this.height;
                    this.velY = 0;
                    this.onGround = true;
                }
                // Hitting from below
                else if (this.velY < 0 && this.y > platform.y) {
                    this.y = platform.y + platform.height;
                    this.velY = 0;
                }
            }
        });
        
        // Ground collision
        if (this.y + this.height >= SCREEN_HEIGHT - 50) {
            this.y = SCREEN_HEIGHT - 50 - this.height;
            this.velY = 0;
            this.onGround = true;
        }
    }
    
    rangedAttack() {
        // Create projectile effect
        createProjectileEffect(this.x, this.y, player.x, player.y);
    }
    
    takeDamage(amount) {
        if (this.defeated) return;
        
        console.log(`Boss took ${amount} damage! Health: ${this.health} -> ${this.health - amount}`);
        this.health -= amount;
        
        // Visual feedback
        createHitEffect(this.x + this.width/2, this.y - 30);
        
        if (this.health <= 0) {
            this.defeated = true;
            gameState.score += 500;
            playSound('explosion');
            updateUI();
            createExplosionEffect(this.x, this.y);
            levelComplete();
        } else {
            // Flash effect when hit
            this.flashTimer = 5;
            playSound('bossHit');
        }
    }
    
    draw() {
        if (this.defeated) return;
        
        // Flash effect when hit
        if (this.flashTimer > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillRect(this.x - camera.x - 5, this.y - camera.y - 5, this.width + 10, this.height + 10);
            this.flashTimer--;
        }
        
        // Draw boss body (larger robot)
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        
        // Draw glowing eyes with pulsing effect
        const pulse = 1 + 0.2 * Math.sin(Date.now() * 0.01);
        const eyeSize = 8 * (this.health < this.maxHealth * 0.3 ? 1.5 : 1); // Bigger when low health
        
        ctx.fillStyle = `hsl(${Date.now() * 0.1 % 360}, 100%, 60%)`; // Rainbow effect
        ctx.fillRect(this.x - camera.x + 10, this.y - camera.y + 10, eyeSize, eyeSize);
        ctx.fillRect(this.x - camera.x + 32, this.y - camera.y + 10, eyeSize, eyeSize);
        
        // Draw health bar
        const barWidth = 60;
        const barHeight = 6;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(this.x - camera.x - 5, this.y - camera.y - 15, barWidth, barHeight);
        
        ctx.fillStyle = COLORS.GREEN;
        ctx.fillRect(this.x - camera.x - 5, this.y - camera.y - 15, barWidth * healthPercent, barHeight);
        
        // Boss name
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Level ${this.level} Boss`, this.x - camera.x + this.width/2, this.y - camera.y - 20);
    }
}

// Super Diamond class
class SuperDiamond {
    constructor(x, y, type = 'jump') {
        this.x = x;
        this.y = y;
        this.width = 50; // Increased size
        this.height = 50; // Increased size
        this.collected = false;
        this.animationFrame = 0;
        this.sparkleTimer = 0;
        this.type = type; // 'jump', 'strength', 'invincibility'
        this.pulseTimer = 0;
        
        // Type-specific properties
        this.colors = {
            jump: { primary: COLORS.BLUE, secondary: COLORS.CYAN },
            strength: { primary: COLORS.RED, secondary: COLORS.ORANGE },
            invincibility: { primary: COLORS.GOLD, secondary: COLORS.YELLOW }
        };
    }
    
    update() {
        if (this.collected) return;
        
        // Animation
        this.animationFrame += 0.1;
        this.sparkleTimer++;
        this.pulseTimer += 0.15;
        
        // Calculate screen position with camera offset
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Check if on screen
        if (screenX + this.width < 0 || screenX > SCREEN_WIDTH ||
            screenY + this.height < 0 || screenY > SCREEN_HEIGHT) {
            return; // Skip collision check if not on screen
        }
        
        // Check collision with player (using screen coordinates)
        if (screenX < player.x + player.width &&
            screenX + this.width > player.x &&
            screenY < player.y + player.height &&
            screenY + this.height > player.y) {
            
            this.collected = true;
            this.activatePowerUp();
            gameState.score += 50; // More points than regular diamonds
            playSound('diamondCollect');
            updateUI();
            createSparkleEffect(this.x, this.y);
            
            // Log collection for debugging
            console.log(`✨ Collected ${this.type} super diamond!`);
        }
    }
    
    activatePowerUp() {
        const duration = 600; // 10 seconds at 60 FPS
        
        switch (this.type) {
            case 'jump':
                gameState.superJumpActive = true;
                gameState.superJumpTimer = duration;
                console.log('🦘 Super Jump activated for 10 seconds!');
                showPowerUpMessage('🦘 Super Jump!', 'Higher jumps for 10 seconds!');
                break;
                
            case 'strength':
                gameState.superStrengthActive = true;
                gameState.superStrengthTimer = duration;
                console.log('💪 Super Strength activated for 10 seconds!');
                showPowerUpMessage('💪 Super Strength!', 'Double damage for 10 seconds!');
                break;
                
            case 'invincibility':
                gameState.invincibilityActive = true;
                gameState.invincibilityTimer = duration;
                console.log('🛡️ Invincibility activated for 10 seconds!');
                showPowerUpMessage('🛡️ Invincibility!', 'No damage for 10 seconds!');
                break;
        }
    }
    
    draw() {
        if (this.collected) return;
        
        ctx.save();
        
        // Enhanced pulsing effect
        const pulse = 1.2 + 0.5 * Math.sin(this.pulseTimer); // More dramatic pulse
        const centerX = this.x - camera.x + this.width/2;
        const centerY = this.y - camera.y + this.height/2;
        
        // Draw outer glow
        const glowGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 60 // Larger glow
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        glowGradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
        glowGradient.addColorStop(0.8, 'rgba(255,255,255,0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        // Animated outline
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,0,0.9)';
        ctx.lineWidth = 7 + 3*Math.abs(Math.sin(this.pulseTimer*1.5));
        ctx.beginPath();
        ctx.arc(centerX, centerY, 28*pulse, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
        
        // Rotate diamond
        ctx.translate(centerX, centerY);
        ctx.rotate(this.animationFrame);
        ctx.scale(pulse, pulse);
        
        // Draw outer glow
        const colors = this.colors[this.type];
        ctx.shadowColor = colors.secondary;
        ctx.shadowBlur = 20;
        
        // Draw super diamond (larger than regular)
        ctx.fillStyle = colors.primary;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw inner highlight
        ctx.fillStyle = colors.secondary;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, 0);
        ctx.lineTo(0, 15);
        ctx.lineTo(-12, 0);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
        
        // Enhanced sparkle effect
        if (this.sparkleTimer % 20 < 10) {
            const sparkles = [
                { x: this.x - camera.x + 5, y: this.y - camera.y - 8 },
                { x: this.x - camera.x + 25, y: this.y - camera.y + 8 },
                { x: this.x - camera.x - 5, y: this.y - camera.y + 25 },
                { x: this.x - camera.x + 20, y: this.y - camera.y - 5 }
            ];
            
            ctx.fillStyle = COLORS.WHITE;
            sparkles.forEach(sparkle => {
                ctx.fillRect(sparkle.x, sparkle.y, 3, 3);
            });
        }
    }
}
class Diamond {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.animationFrame = 0;
        this.sparkleTimer = 0;
    }
    
    update() {
        if (this.collected) return;
        
        // Animation
        this.animationFrame += 0.1;
        this.sparkleTimer++;
        
        // Check collision with player
        if (this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y) {
            
            this.collected = true;
            gameState.diamonds += 1;
            gameState.score += 10;
            playSound('diamondCollect');
            updateUI();
            createSparkleEffect(this.x, this.y);
        }
    }
    
    draw() {
        if (this.collected) return;
        
        ctx.save();
        
        // Rotate diamond
        ctx.translate(this.x - camera.x + this.width/2, this.y - camera.y + this.height/2);
        ctx.rotate(this.animationFrame);
        
        // Draw diamond
        ctx.fillStyle = COLORS.CYAN;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = COLORS.WHITE;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
        
        // Sparkle effect
        if (this.sparkleTimer % 30 < 15) {
            ctx.fillStyle = COLORS.WHITE;
            ctx.fillRect(this.x - camera.x + 8, this.y - camera.y - 5, 2, 2);
            ctx.fillRect(this.x - camera.x + 15, this.y - camera.y + 5, 2, 2);
            ctx.fillRect(this.x - camera.x + 5, this.y - camera.y + 15, 2, 2);
        }
    }
}

// Effect classes
class Effect {
    constructor(x, y, type, duration = 30) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.duration = duration;
        this.maxDuration = duration;
        this.particles = [];
        
        // Initialize particles based on type
        if (type === 'explosion') {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: 0,
                    y: 0,
                    velX: (Math.random() - 0.5) * 10,
                    velY: (Math.random() - 0.5) * 10,
                    color: Math.random() > 0.5 ? COLORS.ORANGE : COLORS.RED
                });
            }
        } else if (type === 'sparkle') {
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: 0,
                    y: 0,
                    velX: (Math.random() - 0.5) * 4,
                    velY: (Math.random() - 0.5) * 4,
                    color: COLORS.CYAN
                });
            }
        }
    }
    
    update() {
        this.duration--;
        
        // Update particles
        this.particles.forEach(particle => {
            particle.x += particle.velX;
            particle.y += particle.velY;
            particle.velY += 0.2; // Gravity
        });
        
        return this.duration > 0;
    }
    
    draw() {
        const alpha = this.duration / this.maxDuration;
        
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = particle.color;
            ctx.fillRect(
                this.x + particle.x - camera.x,
                this.y + particle.y - camera.y,
                4, 4
            );
            ctx.restore();
        });
    }
}

// Effect creation functions
function createHitEffect(x, y) {
    effects.push(new Effect(x, y, 'hit', 15));
}

function createExplosionEffect(x, y) {
    effects.push(new Effect(x, y, 'explosion', 45));
}

function createSparkleEffect(x, y) {
    effects.push(new Effect(x, y, 'sparkle', 30));
}

function createProjectileEffect(fromX, fromY, toX, toY) {
    // Simple projectile effect - could be enhanced
    effects.push(new Effect(fromX, fromY, 'projectile', 20));
}

// Level initialization
function initLevel(levelNum) {
    console.log(`🏗️ Initializing Level ${levelNum}...`);
    
    platforms = [];
    robots = [];
    diamonds = [];
    superDiamonds = []; // Clear super diamonds
    boss = null;
    effects = [];
    
    // Create platforms based on level
    createPlatforms(levelNum);
    createRobots(levelNum);
    createDiamonds(levelNum);
    createSuperDiamonds(levelNum); // Create super diamonds
    createBoss(levelNum);
    
    console.log(`✅ Level ${levelNum} initialized with ${robots.length} robots, ${diamonds.length} diamonds, ${superDiamonds.length} super diamonds`);
}

function createPlatforms(level) {
    // Ground platforms
    for (let x = 0; x < WORLD_WIDTH; x += 200) {
        platforms.push(new Platform(x, SCREEN_HEIGHT - 50, 200, 50));
    }
    
    // Platform height constraints (reachable by normal jump, but allow super jump for some bonus platforms)
    // Max vertical distance for normal jump: ~220px, but use 180px for reliability
    const maxVertical = 180;
    const maxHorizontal = 250; // Player can clear this horizontally with jump
    
    const platformLayouts = [
        // Level 1
        [
            {x: 300, y: 600, w: 180},
            {x: 600, y: 480, w: 180},
            {x: 760, y: 430, w: 180}, // moved even closer and lower for easy jump
            {x: 1000, y: 370, w: 180}, // adjust next for smooth progression
        ],
        // Level 2
        [
            {x: 220, y: 600, w: 140},
            {x: 500, y: 500, w: 140},
            {x: 800, y: 400, w: 160},
            {x: 1200, y: 300, w: 180},
        ],
        // Level 3 (vertical)
        [
            {x: 350, y: 650, w: 120},
            {x: 600, y: 560, w: 120},
            {x: 350, y: 470, w: 120},
            {x: 600, y: 380, w: 120},
            {x: 350, y: 290, w: 120},
            {x: 600, y: 200, w: 120},
        ],
        // Level 4 (zigzag)
        [
            {x: 200, y: 600, w: 120},
            {x: 500, y: 520, w: 120},
            {x: 800, y: 440, w: 120},
            {x: 1100, y: 360, w: 120},
            {x: 1400, y: 280, w: 120},
        ],
        // Level 5 (challenge)
        [
            {x: 220, y: 600, w: 120},
            {x: 480, y: 520, w: 120},
            {x: 740, y: 440, w: 120},
            {x: 1000, y: 360, w: 120},
            {x: 1260, y: 280, w: 120},
            {x: 1520, y: 200, w: 120},
        ]
    ];
    
    const layout = platformLayouts[(level-1)%platformLayouts.length];
    layout.forEach(p => platforms.push(new Platform(p.x, p.y, p.w, 22)));
}

function createRobots(level) {
    const robotCounts = [6, 9, 11, 12, 16];
    const robotCount = robotCounts[level - 1] || 6;
    
    // Place robots on platforms and ground
    const robotPositions = [];
    
    // Add ground positions
    for (let i = 0; i < Math.floor(robotCount * 0.6); i++) {
        robotPositions.push({
            x: 400 + i * 300 + Math.random() * 100,
            y: SCREEN_HEIGHT - 90 // On ground
        });
    }
    
    // Add platform positions
    platforms.forEach(platform => {
        if (platform.y < SCREEN_HEIGHT - 100 && robotPositions.length < robotCount) {
            robotPositions.push({
                x: platform.x + Math.random() * (platform.width - 30),
                y: platform.y - 40 // On platform
            });
        }
    });
    
    // Create robots at positions
    for (let i = 0; i < Math.min(robotCount, robotPositions.length); i++) {
        const pos = robotPositions[i];
        const type = (level >= 4 && i % 2 === 0) ? 'tough' : 'normal';
        robots.push(new Robot(pos.x, pos.y, type));
    }
}

function createDiamonds(level) {
    const diamondCount = 15 + level * 5;
    const allSurfaces = [];
    // Add platforms (excluding ground)
    platforms.forEach(p => {
        if (p.y < SCREEN_HEIGHT - 60) {
            allSurfaces.push(p);
        }
    });
    // Add ground as a surface
    allSurfaces.push({x: 0, y: SCREEN_HEIGHT - 70, width: WORLD_WIDTH});
    
    for (let i = 0; i < diamondCount; i++) {
        // Pick a random surface
        const surface = allSurfaces[Math.floor(Math.random() * allSurfaces.length)];
        const pad = 18;
        const x = surface.x + pad + Math.random() * (surface.width - 2*pad);
        // 50% chance to float, but always within jump range (max 160px above surface)
        let y;
        if (Math.random() < 0.5) {
            // On the surface
            y = surface.y - 28;
        } else {
            // Floating, but within jump range
            const maxJump = 160; // px above surface, slightly less than max jump
            const minFloat = 40; // at least a little above
            const floatHeight = minFloat + Math.random() * (maxJump - minFloat);
            y = surface.y - 28 - floatHeight;
        }
        diamonds.push(new Diamond(x, y));
    }
}

function createSuperDiamonds(level) {
    // Always create at least 1 super diamond, up to 3
    const superDiamondCount = Math.min(3, Math.max(1, level));
    const types = ['jump', 'strength', 'invincibility'];
    
    console.log(`🎯 Creating ${superDiamondCount} super diamonds for level ${level}`);
    
    // Get visible platforms (not too low)
    const validPlatforms = platforms.filter(p => p.y < SCREEN_HEIGHT - 150);
    
    if (validPlatforms.length === 0) {
        console.warn('No valid platforms found for super diamonds!');
        return;
    }
    
    for (let i = 0; i < superDiamondCount; i++) {
        // Pick a random platform that's not too low
        const platform = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
        const x = platform.x + 10 + Math.random() * (platform.width - 50);
        const y = platform.y - 50; // Position above platform
        const type = types[i % types.length];
        
        superDiamonds.push(new SuperDiamond(x, y, type));
        console.log(`🌟 Created ${type} super diamond at (${x.toFixed(0)}, ${y.toFixed(0)}) on platform at y=${platform.y}`);
    }
}

function createBoss(level) {
    const bossX = WORLD_WIDTH - 200;
    const bossY = SCREEN_HEIGHT - 130;
    boss = new Boss(bossX, bossY, level);
}

// Continue in next part...
// Camera system
function updateCamera() {
    // Follow player
    camera.x = player.x - SCREEN_WIDTH / 2;
    camera.y = 0; // Keep camera at ground level
    
    // Keep camera in bounds
    camera.x = Math.max(0, Math.min(WORLD_WIDTH - SCREEN_WIDTH, camera.x));
}

// Game loop
function gameLoop(currentTime) {
    if (!gameRunning) {
        console.log('Game loop stopped');
        return;
    }
    
    // Initialize lastTime on first call
    if (lastTime === 0) {
        lastTime = currentTime;
    }
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (!gamePaused) {
        update();
    }
    
    draw();
    
    requestAnimationFrame(gameLoop);
}

function update() {
    // Update player
    player.update();
    
    // Update robots
    robots.forEach(robot => robot.update());
    
    // Update boss
    if (boss) {
        boss.update();
    }
    
    // Update diamonds
    diamonds.forEach(diamond => diamond.update());
    
    // Update super diamonds
    superDiamonds.forEach(superDiamond => superDiamond.update());
    
    // Update effects
    effects = effects.filter(effect => effect.update());
    
    // Check level completion
    checkLevelCompletion();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.SKY_BLUE;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Draw platforms
    platforms.forEach(platform => platform.draw());
    
    // Draw diamonds
    diamonds.forEach(diamond => diamond.draw());
    
    // Draw super diamonds
    superDiamonds.forEach(superDiamond => superDiamond.draw());
    
    // Draw robots
    robots.forEach(robot => robot.draw());
    
    // Draw boss
    if (boss) {
        boss.draw();
    }
    
    // Draw player
    player.draw();
    
    // Draw effects
    effects.forEach(effect => effect.draw());
    
    // Draw UI elements
    drawUI();
}

function drawUI() {
    // Draw level progress
    const robotsLeft = robots.filter(robot => !robot.defeated).length;
    const bossDefeated = boss ? boss.defeated : false;
    
    if (robotsLeft > 0) {
        ctx.fillStyle = COLORS.WHITE;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Robots remaining: ${robotsLeft}`, 20, 30);
    } else if (!bossDefeated) {
        ctx.fillStyle = COLORS.YELLOW;
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('All robots defeated! Find the boss!', 20, 30);
    }
    
    // Draw power-up status
    let powerUpY = 50;
    if (gameState.superJumpActive) {
        const timeLeft = Math.ceil(gameState.superJumpTimer / 60);
        ctx.fillStyle = COLORS.BLUE;
        ctx.font = '14px monospace';
        ctx.fillText(`🦘 Super Jump: ${timeLeft}s`, 20, powerUpY);
        powerUpY += 20;
    }
    if (gameState.superStrengthActive) {
        const timeLeft = Math.ceil(gameState.superStrengthTimer / 60);
        ctx.fillStyle = COLORS.RED;
        ctx.font = '14px monospace';
        ctx.fillText(`💪 Super Strength: ${timeLeft}s`, 20, powerUpY);
        powerUpY += 20;
    }
    if (gameState.invincibilityActive) {
        const timeLeft = Math.ceil(gameState.invincibilityTimer / 60);
        ctx.fillStyle = COLORS.GOLD;
        ctx.font = '14px monospace';
        ctx.fillText(`🛡️ Invincibility: ${timeLeft}s`, 20, powerUpY);
        powerUpY += 20;
    }
    
    // Draw controls hint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, SCREEN_HEIGHT - 100, 350, 80);
    
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WASD/Arrows: Move  Space: Jump', 30, SCREEN_HEIGHT - 80);
    ctx.fillText('X: Punch  Z: Kick  ESC: Pause', 30, SCREEN_HEIGHT - 65);
    ctx.fillText('Jump on robots for damage!', 30, SCREEN_HEIGHT - 50);
    ctx.fillText('Collect super diamonds for power-ups!', 30, SCREEN_HEIGHT - 35);
}

// Power-up message system
function showPowerUpMessage(title, description) {
    // Create a temporary message effect
    const messageEffect = {
        x: SCREEN_WIDTH / 2,
        y: SCREEN_HEIGHT / 2 - 100,
        title: title,
        description: description,
        timer: 180, // 3 seconds
        maxTimer: 180,
        
        update() {
            this.timer--;
            return this.timer > 0;
        },
        
        draw() {
            const alpha = this.timer / this.maxTimer;
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(this.x - 200, this.y - 40, 400, 80);
            
            // Title
            ctx.fillStyle = COLORS.GOLD;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.title, this.x, this.y - 10);
            
            // Description
            ctx.fillStyle = COLORS.WHITE;
            ctx.font = '16px monospace';
            ctx.fillText(this.description, this.x, this.y + 15);
            
            ctx.restore();
        }
    };
    
    effects.push(messageEffect);
}
function setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        
        // Special keys
        if (e.code === 'Escape') {
            togglePause();
        } else if (e.code === 'KeyR' && !gameRunning) {
            resetGame();
        }
        
        e.preventDefault();
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });
    
    // Prevent context menu on canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Focus canvas for keyboard input
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
}

// Game state functions
function checkLevelCompletion() {
    const allRobotsDefeated = robots.every(robot => robot.defeated);
    const bossDefeated = boss ? boss.defeated : true;
    
    // Debug logging
    const robotsLeft = robots.filter(robot => !robot.defeated).length;
    if (robotsLeft === 0 && bossDefeated) {
        console.log(`🏆 Level ${gameState.level} completed! All robots defeated: ${allRobotsDefeated}, Boss defeated: ${bossDefeated}`);
    }
    
    if (allRobotsDefeated && bossDefeated) {
        levelComplete();
    }
}

function levelComplete() {
    console.log(`🎉 Level ${gameState.level} complete!`);
    
    if (gameState.level >= 5) {
        console.log('🏆 All 5 levels completed! Game won!');
        gameWin();
    } else {
        console.log(`🚀 Showing level complete message for current level ${gameState.level}`);
        showMessage('Level Complete!', 
                   `Advancing to Level ${gameState.level + 1}...`, 
                   []);
        setTimeout(() => {
            hideMessage();
            nextLevel();
        }, 2000);
    }
}

function nextLevel() {
    gameState.level++;
    if (gameState.level > 5) {
        gameWin();
        return;
    }
    showMessage(
        `Level ${gameState.level}`,
        `Get ready for Level ${gameState.level}!`,
        [
            { text: 'Continue', action: () => {
                hideMessage();
                initLevel(gameState.level);
            }}
        ]
    );
    
    console.log(`🎯 Advanced to Level ${gameState.level}`);
}

function gameWin() {
    gameRunning = false;
    showMessage('🏆 VICTORY!', 
               'You have completed all 5 levels of Diamond Quest!', 
               [
                   { text: 'Submit Score', action: submitHighScore },
                   { text: 'Play Again', action: () => { resetGame(); hideMessage(); } }
               ]);
}

function gameOver() {
    gameRunning = false;
    showMessage('💀 Game Over', 
               `Final Score: ${gameState.score}`, 
               [
                   { text: 'Submit Score', action: submitHighScore },
                   { text: 'Try Again', action: () => { resetGame(); hideMessage(); } }
               ]);
}

function togglePause() {
    console.log('⏸️ Toggle pause called, current state - gamePaused:', gamePaused, 'gameRunning:', gameRunning);
    
    if (!gameRunning) {
        console.log('⚠️ Cannot toggle pause - game not running');
        return;
    }
    
    gamePaused = !gamePaused;
    console.log('⏸️ Pause state changed to:', gamePaused);
    
    // Update button states
    updateButtonStates();
    
    if (gamePaused) {
        showMessage('⏸️ Game Paused', 
                   'Press ESC to resume', 
                   [{ text: 'Resume', action: () => { togglePause(); hideMessage(); } }]);
    } else {
        hideMessage();
    }
}

// UI functions
function updateUI() {
    document.getElementById('levelDisplay').textContent = gameState.level;
    document.getElementById('diamondsDisplay').textContent = gameState.diamonds;
    document.getElementById('livesDisplay').textContent = gameState.lives;
    document.getElementById('scoreDisplay').textContent = gameState.score;
}

function showMessage(title, text, buttons = []) {
    const messageDiv = document.getElementById('gameMessage');
    const titleDiv = document.getElementById('messageTitle');
    const textDiv = document.getElementById('messageText');
    const buttonsDiv = document.getElementById('messageButtons');
    
    titleDiv.textContent = title;
    textDiv.textContent = text;
    
    buttonsDiv.innerHTML = '';
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.className = 'btn';
        btn.onclick = button.action;
        btn.style.margin = '5px';
        buttonsDiv.appendChild(btn);
    });
    
    messageDiv.style.display = 'block';
}

function hideMessage() {
    document.getElementById('gameMessage').style.display = 'none';
}

// API functions (saveGame function moved to window.saveGame below)

function saveGameState() {
    // Auto-save without showing message
    const data = {
        level: gameState.level,
        diamonds: gameState.diamonds,
        lives: gameState.lives,
        score: gameState.score,
        player_x: player.x,
        player_y: player.y
    };
    
    fetch('/retro_platform_fighter/api/save-state/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
    .catch(error => console.error('Auto-save error:', error));
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function submitHighScore() {
    const playerName = prompt('Enter your name for the leaderboard:', 'Anonymous');
    if (!playerName) return;
    
    const csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        console.error('CSRF token not found');
        showMessage('Error', 'Security token missing. Please refresh the page and try again.');
        return;
    }
    
    const data = {
        player_name: playerName,
        score: gameState.score,
        level_reached: gameState.level
    };
    
    console.log('Submitting score:', data);
    
    fetch('/retro_platform_fighter/api/submit-score/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('🏆 Score Submitted!', 
                       `Your rank: #${data.rank}`, 
                       [
                           { text: 'View Leaderboard', action: () => window.location.href = '/retro_platform_fighter/leaderboard/' },
                           { text: 'Play Again', action: () => { resetGame(); hideMessage(); } }
                       ]);
        } else {
            showMessage('❌ Submission Failed', 
                       data.error || 'Failed to submit score', 
                       [
                           { text: 'Try Again', action: submitHighScore },
                           { text: 'Continue', action: hideMessage }
                       ]);
        }
    })
    .catch(error => {
        console.error('Score submission error:', error);
        showMessage('❌ Network Error', 
                   'Failed to connect to server', 
                   [
                       { text: 'Try Again', action: submitHighScore },
                       { text: 'Continue', action: hideMessage }
                   ]);
    });
}

function resetGame() {
    fetch('/retro_platform_fighter/api/reset-game/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(() => {
        console.log('🔄 Resetting game to Level 1...');
        
        // Reset game state with power-ups
        gameState = {
            level: 1,
            diamonds: 50,
            lives: 3,
            score: 0,
            playerX: 100,
            playerY: 500,
            // Power-up states
            superJumpActive: false,
            superJumpTimer: 0,
            superStrengthActive: false,
            superStrengthTimer: 0,
            invincibilityActive: false,
            invincibilityTimer: 0
        };
        
        updateGameState();
        initLevel(1);
        gameRunning = true;
        gamePaused = false;
        
        console.log('✅ Game reset complete');
    })
    .catch(error => console.error('Reset error:', error));
}

// Button handlers for UI (removed duplicate - using window.pauseGame below)

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM Content Loaded');
    
    // Add a small delay to ensure all scripts are loaded
    setTimeout(() => {
        console.log('🚀 Starting game initialization...');
        initGame();
    }, 100);
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM is already loaded
    console.log('🚀 DOM already loaded, initializing game immediately...');
    setTimeout(initGame, 100);
}

// Fallback initialization if DOMContentLoaded doesn't fire
window.addEventListener('load', () => {
    if (!gameRunning) {
        console.log('🔄 Fallback initialization...');
        setTimeout(initGame, 200);
    }
});

// Handle window focus/blur
window.addEventListener('blur', () => {
    if (gameRunning && !gamePaused) {
        togglePause();
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    // Could implement canvas scaling here if needed
});

// Game control functions for UI buttons
window.pauseGame = function() {
    console.log('🎮 Pause button clicked, gameRunning:', gameRunning, 'gamePaused:', gamePaused);
    if (gameRunning) {
        togglePause();
    } else {
        console.log('⚠️ Cannot pause - game not running');
        showMessage('Cannot Pause', 'Game is not currently running.', [
            { text: 'OK', action: () => hideMessage() }
        ]);
    }
};

window.resetGame = function() {
    console.log('🔄 Reset button clicked');
    
    if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
        console.log('🔄 User confirmed reset');
        
        try {
            // Reset all game objects
            player = null;
            platforms = [];
            robots = [];
            diamonds = [];
            superDiamonds = [];
            boss = null;
            effects = [];
            
            // Reset camera
            camera = { x: 0, y: 0 };
            
            // Reset game state with power-ups
            gameState = { 
                ...initialGameState,
                superJumpActive: false,
                superJumpTimer: 0,
                superStrengthActive: false,
                superStrengthTimer: 0,
                invincibilityActive: false,
                invincibilityTimer: 0,
                level: 1,
                lives: 3,
                score: 0,
                diamonds: 0,
                playerX: 100,
                playerY: 500,
                robotsDefeated: [],
                diamondsCollected: [],
                bossDefeated: false,
                levelCompleted: false
            };
            
            console.log('🔄 Game state reset to:', gameState);
            
            // Reinitialize game components
            initPlayer();
            initLevel(1); // Always start from level 1 on reset
            
            // Reset UI
            updateUI();
            hideMessage();
            
            // Reset game state flags
            gamePaused = false;
            gameRunning = true;
            
            // Force a redraw
            if (lastTime) {
                lastTime = performance.now();
            }
            
            console.log('🔄 Game reset successfully');
            
        } catch (error) {
            console.error('❌ Error during game reset:', error);
            showMessage('Reset Error', 'Failed to reset the game. Please refresh the page.', [
                { text: 'OK', action: () => window.location.reload() }
            ]);
        }
    } else {
        console.log('🔄 User cancelled reset');
    }
};

window.saveGame = function() {
    console.log('💾 Save button clicked, gameRunning:', gameRunning);
    
    if (!gameRunning) {
        console.log('⚠️ Cannot save - game not running');
        showMessage('Cannot Save', 'Game is not currently running.', [
            { text: 'OK', action: () => hideMessage() }
        ]);
        return;
    }
    
    // Get CSRF token safely
    let csrftoken = null;
    if (typeof getCookie === 'function') {
        csrftoken = getCookie('csrftoken');
    } else if (window.csrftoken) {
        csrftoken = window.csrftoken;
    }
    if (!csrftoken) {
        console.error('❌ CSRF token not found. Save aborted.');
        showMessage('Save Error', 'CSRF token missing. Please refresh the page and try again.', [
            { text: 'OK', action: () => hideMessage() }
        ]);
        return;
    }
    
    // Save game state to server
    const gameData = {
        level: gameState.level,
        diamonds: gameState.diamonds,
        lives: gameState.lives,
        score: gameState.score,
        playerX: player ? player.x : gameState.playerX,
        playerY: player ? player.y : gameState.playerY,
        robotsDefeated: gameState.robotsDefeated || [],
        diamondsCollected: gameState.diamondsCollected || [],
        bossDefeated: gameState.bossDefeated || false,
        levelCompleted: gameState.levelCompleted || false
    };
    
    console.log('💾 Saving game data:', gameData);
    
    fetch('/retro_platform_fighter/api/save-state/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(gameData)
    })
    .then(response => {
        console.log('💾 Save response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('💾 Save response data:', data);
        if (data.success) {
            console.log('✅ Game saved successfully');
            showMessage('Game Saved', 'Your progress has been saved!', [
                { text: 'Continue', action: () => hideMessage() }
            ]);
        } else {
            console.error('❌ Failed to save game:', data.error);
            showMessage('Save Failed', 'Could not save your progress. Please try again.', [
                { text: 'OK', action: () => hideMessage() }
            ]);
        }
    })
    .catch(error => {
        console.error('❌ Error saving game:', error);
        showMessage('Save Error', 'Network error while saving. Please check your connection.', [
            { text: 'OK', action: () => hideMessage() }
        ]);
    });
};

// Ensure the save button is always wired up
function wireSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.onclick = window.saveGame;
        saveBtn.disabled = !gameRunning;
    }
}

document.addEventListener('DOMContentLoaded', wireSaveButton);
// Also call after game state changes
function updateButtonStates() {
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    if (pauseBtn) {
        pauseBtn.disabled = !gameRunning;
        pauseBtn.textContent = gamePaused ? '▶️ Resume' : '⏸️ Pause';
    }
    if (resetBtn) {
        resetBtn.disabled = false;
    }
    if (saveBtn) {
        saveBtn.disabled = !gameRunning;
        saveBtn.onclick = window.saveGame;
    }
}


// Manual initialization function for debugging
window.startGame = function() {
    console.log('🎮 Manual game start triggered');
    initGame();
};

// Button state management
function updateButtonStates() {
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    if (pauseBtn) {
        pauseBtn.disabled = !gameRunning;
        pauseBtn.textContent = gamePaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    if (resetBtn) {
        resetBtn.disabled = false; // Reset should always be available
    }
    
    if (saveBtn) {
        saveBtn.disabled = !gameRunning;
    }
}

// Call updateButtonStates when game state changes
function updateGameState() {
    updateUI();
    updateButtonStates();
}

// Debug function to check game state
window.debugGame = function() {
    console.log('🔍 Game Debug Info:');
    console.log('Canvas:', canvas);
    console.log('Context:', ctx);
    console.log('Game Running:', gameRunning);
    console.log('Game State:', gameState);
    console.log('Player:', player);
    console.log('Sound Manager:', soundManager);
};
