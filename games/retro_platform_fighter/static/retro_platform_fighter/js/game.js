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
    SKY_BLUE: '#87CEEB'
};

// Player constants
const PLAYER_SPEED = 6;
const JUMP_STRENGTH = -16;
const GRAVITY = 0.8;
const PUNCH_RANGE = 45;
const KICK_RANGE = 55;

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
        
        // Set up game state
        gameState = { ...initialGameState };
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
        
        // Update UI
        console.log('🖥️ Updating UI...');
        updateUI();
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
    }
    
    update() {
        // Handle input
        this.handleInput();
        
        // Apply gravity
        this.velY += GRAVITY;
        
        // Update position
        this.x += this.velX;
        this.y += this.velY;
        
        // Check platform collisions
        this.checkPlatformCollisions();
        
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
        
        // Jumping
        if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && this.onGround) {
            this.velY = JUMP_STRENGTH;
            this.onGround = false;
            playSound('jump');
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
        
        // Check for hits on robots and boss
        const range = type === 'punch' ? PUNCH_RANGE : KICK_RANGE;
        const damage = type === 'punch' ? 15 : 25;
        
        // Check robot hits
        robots.forEach(robot => {
            if (!robot.defeated && this.isInRange(robot, range)) {
                robot.takeDamage(damage);
                createHitEffect(robot.x, robot.y);
            }
        });
        
        // Check boss hits
        if (boss && !boss.defeated && this.isInRange(boss, range)) {
            boss.takeDamage(damage);
            createHitEffect(boss.x, boss.y);
        }
    }
    
    isInRange(target, range) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if target is in front of player
        const inFront = (this.facing === 1 && dx > 0) || (this.facing === -1 && dx < 0);
        
        return distance <= range && inFront;
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
        
        // Flicker when invulnerable
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
}

// Initialize player
function initPlayer() {
    player = new Player(gameState.playerX, gameState.playerY);
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
        
        // Attack player if close
        if (distanceToPlayer < 40 && this.attackCooldown <= 0) {
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
        this.health -= amount;
        if (this.health <= 0) {
            this.defeated = true;
            gameState.score += 500;
            playSound('explosion');
            updateUI();
            createExplosionEffect(this.x, this.y);
            levelComplete();
        }
    }
    
    draw() {
        if (this.defeated) return;
        
        // Draw boss body (larger robot)
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.width, this.height);
        
        // Draw glowing eyes
        ctx.fillStyle = COLORS.RED;
        ctx.fillRect(this.x - camera.x + 10, this.y - camera.y + 10, 8, 8);
        ctx.fillRect(this.x - camera.x + 32, this.y - camera.y + 10, 8, 8);
        
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

// Diamond class
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
    platforms = [];
    robots = [];
    diamonds = [];
    boss = null;
    effects = [];
    
    // Create platforms based on level
    createPlatforms(levelNum);
    createRobots(levelNum);
    createDiamonds(levelNum);
    createBoss(levelNum);
}

function createPlatforms(level) {
    // Ground platforms
    for (let x = 0; x < WORLD_WIDTH; x += 200) {
        platforms.push(new Platform(x, SCREEN_HEIGHT - 50, 200, 50));
    }
    
    // Level-specific platforms
    switch (level) {
        case 1:
            platforms.push(new Platform(300, 600, 150, 20));
            platforms.push(new Platform(600, 500, 150, 20));
            platforms.push(new Platform(1000, 400, 150, 20));
            break;
        case 2:
            platforms.push(new Platform(200, 600, 100, 20));
            platforms.push(new Platform(400, 550, 100, 20));
            platforms.push(new Platform(650, 500, 100, 20));
            platforms.push(new Platform(900, 450, 100, 20));
            platforms.push(new Platform(1200, 400, 150, 20));
            break;
        case 3:
            // Vertical level
            for (let i = 0; i < 8; i++) {
                platforms.push(new Platform(300 + (i % 2) * 400, 650 - i * 80, 120, 20));
            }
            break;
        case 4:
            // Complex layout
            platforms.push(new Platform(150, 600, 100, 20));
            platforms.push(new Platform(350, 550, 80, 20));
            platforms.push(new Platform(500, 500, 100, 20));
            platforms.push(new Platform(700, 450, 80, 20));
            platforms.push(new Platform(900, 400, 100, 20));
            platforms.push(new Platform(1100, 350, 120, 20));
            break;
        case 5:
            // Ultimate challenge
            for (let i = 0; i < 10; i++) {
                platforms.push(new Platform(200 + i * 150, 600 - (i % 3) * 100, 100, 20));
            }
            break;
    }
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
    
    for (let i = 0; i < diamondCount; i++) {
        const x = 200 + Math.random() * (WORLD_WIDTH - 400);
        const y = 300 + Math.random() * 200;
        diamonds.push(new Diamond(x, y));
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
    
    // Draw controls hint
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, SCREEN_HEIGHT - 80, 300, 60);
    
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WASD/Arrows: Move  Space: Jump', 30, SCREEN_HEIGHT - 60);
    ctx.fillText('X: Punch  Z: Kick  ESC: Pause', 30, SCREEN_HEIGHT - 45);
    ctx.fillText('Collect diamonds, defeat all robots!', 30, SCREEN_HEIGHT - 30);
}

// Event handlers
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
    
    if (allRobotsDefeated && bossDefeated) {
        levelComplete();
    }
}

function levelComplete() {
    gameState.level++;
    
    if (gameState.level > 5) {
        gameWin();
    } else {
        showMessage('Level Complete!', 
                   `Advancing to Level ${gameState.level}`, 
                   [{ text: 'Continue', action: nextLevel }]);
    }
}

function nextLevel() {
    hideMessage();
    initLevel(gameState.level);
    saveGameState();
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
    gamePaused = !gamePaused;
    
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

// API functions
function saveGame() {
    const data = {
        level: gameState.level,
        diamonds: gameState.diamonds,
        lives: gameState.lives,
        score: gameState.score,
        player_x: player.x,
        player_y: player.y,
        robots_defeated: robots.map((robot, index) => robot.defeated ? index : null).filter(x => x !== null),
        diamonds_collected: diamonds.map((diamond, index) => diamond.collected ? index : null).filter(x => x !== null),
        boss_defeated: boss ? boss.defeated : false,
        level_completed: false
    };
    
    fetch('/api/save-state/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('💾 Game Saved', 'Your progress has been saved!', 
                       [{ text: 'Continue', action: hideMessage }]);
        }
    })
    .catch(error => console.error('Save error:', error));
}

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
    
    fetch('/api/save-state/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
    .catch(error => console.error('Auto-save error:', error));
}

function submitHighScore() {
    const playerName = prompt('Enter your name for the leaderboard:', 'Anonymous');
    if (!playerName) return;
    
    const data = {
        player_name: playerName,
        score: gameState.score,
        level_reached: gameState.level
    };
    
    fetch('/api/submit-score/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showMessage('🏆 Score Submitted!', 
                       `Your rank: #${data.rank}`, 
                       [
                           { text: 'View Leaderboard', action: () => window.location.href = '/leaderboard/' },
                           { text: 'Play Again', action: () => { resetGame(); hideMessage(); } }
                       ]);
        }
    })
    .catch(error => console.error('Score submission error:', error));
}

function resetGame() {
    fetch('/api/reset-game/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(() => {
        // Reset game state
        gameState = {
            level: 1,
            diamonds: 50,
            lives: 3,
            score: 0,
            playerX: 100,
            playerY: 500
        };
        
        updateUI();
        initLevel(1);
        gameRunning = true;
        gamePaused = false;
    })
    .catch(error => console.error('Reset error:', error));
}

// Button handlers for UI
function pauseGame() {
    togglePause();
}

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
    if (gameRunning) {
        togglePause();
    }
};

window.resetGame = function() {
    if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
        // Reset game state
        gameState = { ...initialGameState };
        
        // Reinitialize game
        initPlayer();
        initLevel(gameState.level);
        updateUI();
        
        // Unpause if paused
        if (gamePaused) {
            togglePause();
        }
        
        console.log('🔄 Game reset');
    }
};

window.saveGame = function() {
    // Save game state to server
    const gameData = {
        level: gameState.level,
        diamonds: gameState.diamonds,
        lives: gameState.lives,
        score: gameState.score,
        playerX: player ? player.x : gameState.playerX,
        playerY: player ? player.y : gameState.playerY,
        robotsDefeated: gameState.robotsDefeated,
        diamondsCollected: gameState.diamondsCollected,
        bossDefeated: gameState.bossDefeated,
        levelCompleted: gameState.levelCompleted
    };
    
    fetch('/api/save-state/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify(gameData)
    })
    .then(response => response.json())
    .then(data => {
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

// Manual initialization function for debugging
window.startGame = function() {
    console.log('🎮 Manual game start triggered');
    initGame();
};

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
