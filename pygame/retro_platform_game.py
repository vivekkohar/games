import pygame
import sys
import random
import math
import os

# Initialize Pygame
pygame.init()
pygame.mixer.init(frequency=22050, size=-16, channels=2, buffer=512)

# Constants
SCREEN_WIDTH = 1024
SCREEN_HEIGHT = 768
FPS = 60
WORLD_WIDTH = 3000  # Much bigger world

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (100, 150, 255)
GREEN = (34, 139, 34)
BROWN = (139, 69, 19)
RED = (255, 0, 0)
GRAY = (128, 128, 128)
YELLOW = (255, 255, 0)
PINK = (255, 192, 203)
CYAN = (0, 255, 255)
PURPLE = (128, 0, 128)
ORANGE = (255, 165, 0)

# Player constants
PLAYER_SPEED = 6
JUMP_STRENGTH = -16
GRAVITY = 0.8
PUNCH_RANGE = 45
KICK_RANGE = 55

# Sound and Music Manager
class SoundManager:
    def __init__(self):
        self.sounds = {}
        self.music_playing = False
        self.sound_enabled = True
        self.music_enabled = True
        
        # Create sound directory if it doesn't exist
        if not os.path.exists('sounds'):
            os.makedirs('sounds')
            
        # Generate procedural sounds
        self.generate_sounds()
        
    def generate_sounds(self):
        """Generate simple procedural sounds using pygame"""
        try:
            # Punch sound - short sharp tone
            punch_sound = pygame.sndarray.make_sound(
                self.generate_tone(440, 0.1, 'square')
            )
            self.sounds['punch'] = punch_sound
            
            # Kick sound - deeper, longer tone
            kick_sound = pygame.sndarray.make_sound(
                self.generate_tone(220, 0.15, 'square')
            )
            self.sounds['kick'] = kick_sound
            
            # Jump sound - rising tone
            jump_sound = pygame.sndarray.make_sound(
                self.generate_sweep(200, 400, 0.2)
            )
            self.sounds['jump'] = jump_sound
            
            # Diamond collect - pleasant chime
            diamond_sound = pygame.sndarray.make_sound(
                self.generate_tone(800, 0.3, 'sine')
            )
            self.sounds['diamond_collect'] = diamond_sound
            
            # Diamond lost - descending tone
            diamond_lost_sound = pygame.sndarray.make_sound(
                self.generate_sweep(400, 200, 0.4)
            )
            self.sounds['diamond_lost'] = diamond_lost_sound
            
            # Life lost - dramatic descending sequence
            life_lost_sound = pygame.sndarray.make_sound(
                self.generate_life_lost_sound()
            )
            self.sounds['life_lost'] = life_lost_sound
            
            # Robot hit - metallic clang
            robot_hit_sound = pygame.sndarray.make_sound(
                self.generate_noise(0.1)
            )
            self.sounds['robot_hit'] = robot_hit_sound
            
            # Boss hit - deeper metallic sound
            boss_hit_sound = pygame.sndarray.make_sound(
                self.generate_tone(150, 0.2, 'square')
            )
            self.sounds['boss_hit'] = boss_hit_sound
            
            # Level complete - victory fanfare
            level_complete_sound = pygame.sndarray.make_sound(
                self.generate_victory_sound()
            )
            self.sounds['level_complete'] = level_complete_sound
            
        except Exception as e:
            print(f"Warning: Could not generate sounds: {e}")
            self.sound_enabled = False
    
    def generate_tone(self, frequency, duration, wave_type='sine'):
        """Generate a simple tone"""
        import numpy as np
        sample_rate = 22050
        frames = int(duration * sample_rate)
        arr = np.zeros((frames, 2))
        
        for i in range(frames):
            time = float(i) / sample_rate
            if wave_type == 'sine':
                wave = np.sin(2 * np.pi * frequency * time)
            elif wave_type == 'square':
                wave = 1 if np.sin(2 * np.pi * frequency * time) > 0 else -1
            else:
                wave = np.sin(2 * np.pi * frequency * time)
            
            # Apply envelope to avoid clicks
            envelope = min(1.0, min(time * 10, (duration - time) * 10))
            arr[i] = [wave * envelope * 0.3, wave * envelope * 0.3]
        
        return (arr * 32767).astype(np.int16)
    
    def generate_sweep(self, start_freq, end_freq, duration):
        """Generate a frequency sweep"""
        import numpy as np
        sample_rate = 22050
        frames = int(duration * sample_rate)
        arr = np.zeros((frames, 2))
        
        for i in range(frames):
            time = float(i) / sample_rate
            progress = time / duration
            frequency = start_freq + (end_freq - start_freq) * progress
            wave = np.sin(2 * np.pi * frequency * time)
            
            # Apply envelope
            envelope = min(1.0, min(time * 5, (duration - time) * 5))
            arr[i] = [wave * envelope * 0.3, wave * envelope * 0.3]
        
        return (arr * 32767).astype(np.int16)
    
    def generate_noise(self, duration):
        """Generate noise for metallic sounds"""
        import numpy as np
        sample_rate = 22050
        frames = int(duration * sample_rate)
        arr = np.random.random((frames, 2)) * 2 - 1
        
        # Apply envelope
        for i in range(frames):
            time = float(i) / sample_rate
            envelope = max(0, 1 - time / duration)
            arr[i] *= envelope * 0.2
        
        return (arr * 32767).astype(np.int16)
    
    def generate_life_lost_sound(self):
        """Generate dramatic life lost sound"""
        import numpy as np
        sample_rate = 22050
        duration = 1.0
        frames = int(duration * sample_rate)
        arr = np.zeros((frames, 2))
        
        # Descending sequence of tones
        frequencies = [400, 350, 300, 250, 200]
        tone_duration = duration / len(frequencies)
        
        for freq_idx, frequency in enumerate(frequencies):
            start_frame = int(freq_idx * tone_duration * sample_rate)
            end_frame = int((freq_idx + 1) * tone_duration * sample_rate)
            
            for i in range(start_frame, min(end_frame, frames)):
                time = float(i - start_frame) / sample_rate
                wave = np.sin(2 * np.pi * frequency * time)
                envelope = max(0, 1 - time / tone_duration)
                arr[i] = [wave * envelope * 0.3, wave * envelope * 0.3]
        
        return (arr * 32767).astype(np.int16)
    
    def generate_victory_sound(self):
        """Generate victory fanfare"""
        import numpy as np
        sample_rate = 22050
        duration = 1.5
        frames = int(duration * sample_rate)
        arr = np.zeros((frames, 2))
        
        # Ascending sequence for victory
        frequencies = [400, 500, 600, 800, 1000]
        tone_duration = duration / len(frequencies)
        
        for freq_idx, frequency in enumerate(frequencies):
            start_frame = int(freq_idx * tone_duration * sample_rate)
            end_frame = int((freq_idx + 1) * tone_duration * sample_rate)
            
            for i in range(start_frame, min(end_frame, frames)):
                time = float(i - start_frame) / sample_rate
                wave = np.sin(2 * np.pi * frequency * time)
                envelope = min(1.0, min(time * 3, (tone_duration - time) * 3))
                arr[i] = [wave * envelope * 0.4, wave * envelope * 0.4]
        
        return (arr * 32767).astype(np.int16)
    
    def play_sound(self, sound_name):
        """Play a sound effect"""
        if self.sound_enabled and sound_name in self.sounds:
            try:
                self.sounds[sound_name].play()
            except Exception as e:
                print(f"Warning: Could not play sound {sound_name}: {e}")
    
    def start_background_music(self):
        """Start background music (simple loop)"""
        if self.music_enabled and not self.music_playing:
            try:
                # Generate simple background music
                bg_music = self.generate_background_music()
                pygame.mixer.music.load(bg_music)
                pygame.mixer.music.play(-1)  # Loop indefinitely
                self.music_playing = True
            except Exception as e:
                print(f"Warning: Could not start background music: {e}")
    
    def generate_background_music(self):
        """Generate simple background music"""
        # For now, return None - background music would need more complex implementation
        return None

# Global sound manager
sound_manager = SoundManager()

class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 32
        self.height = 48
        self.vel_x = 0
        self.vel_y = 0
        self.on_ground = False
        self.facing_right = True
        self.punching = False
        self.kicking = False
        self.punch_timer = 0
        self.kick_timer = 0
        self.diamonds = 50  # Start with 50 diamonds
        self.lives = 3
        self.invulnerable = 0  # Invulnerability frames after taking damage
        self.animation_frame = 0
        self.punch_effect = []  # Visual punch effects
        self.kick_effect = []   # Visual kick effects
        self.jump_cooldown = 0  # Prevent infinite jumping on enemies
        
    def update(self, platforms, camera_x):
        # Handle input
        keys = pygame.key.get_pressed()
        
        # Movement
        self.vel_x = 0
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.vel_x = -PLAYER_SPEED
            self.facing_right = False
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.vel_x = PLAYER_SPEED
            self.facing_right = True
            
        # Jumping
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP] or keys[pygame.K_w]) and self.on_ground:
            self.vel_y = JUMP_STRENGTH
            self.on_ground = False
            sound_manager.play_sound('jump')
            
        # Combat
        if keys[pygame.K_x] and self.punch_timer <= 0:
            self.punching = True
            self.punch_timer = 20
            sound_manager.play_sound('punch')
            # Add punch visual effect
            punch_x = self.x + (40 if self.facing_right else -40)
            punch_y = self.y + 20
            self.punch_effect.append({
                'x': punch_x, 'y': punch_y, 'timer': 15, 'size': 20
            })
            
        if keys[pygame.K_z] and self.kick_timer <= 0:
            self.kicking = True
            self.kick_timer = 25
            sound_manager.play_sound('kick')
            # Add kick visual effect
            kick_x = self.x + (50 if self.facing_right else -50)
            kick_y = self.y + 30
            self.kick_effect.append({
                'x': kick_x, 'y': kick_y, 'timer': 20, 'size': 25
            })
            
        # Update timers
        if self.punch_timer > 0:
            self.punch_timer -= 1
        else:
            self.punching = False
            
        if self.kick_timer > 0:
            self.kick_timer -= 1
        else:
            self.kicking = False
            
        if self.invulnerable > 0:
            self.invulnerable -= 1
        
        if self.jump_cooldown > 0:
            self.jump_cooldown -= 1
        
        # Update visual effects
        self.punch_effect = [effect for effect in self.punch_effect 
                           if self.update_effect(effect)]
        self.kick_effect = [effect for effect in self.kick_effect 
                          if self.update_effect(effect)]
        
        # Apply gravity
        self.vel_y += GRAVITY
        
        # Update position
        self.x += self.vel_x
        self.y += self.vel_y
        
        # Platform collision
        self.on_ground = False
        player_rect = pygame.Rect(self.x, self.y, self.width, self.height)
        
        for platform in platforms:
            if player_rect.colliderect(platform.rect):
                # Landing on top of platform
                if self.vel_y > 0 and self.y < platform.rect.top:
                    self.y = platform.rect.top - self.height
                    self.vel_y = 0
                    self.on_ground = True
                # Hitting platform from below
                elif self.vel_y < 0 and self.y > platform.rect.bottom:
                    self.y = platform.rect.bottom
                    self.vel_y = 0
                # Side collisions
                elif self.vel_x > 0:  # Moving right
                    self.x = platform.rect.left - self.width
                elif self.vel_x < 0:  # Moving left
                    self.x = platform.rect.right
        
        # World boundaries
        if self.x < 0:
            self.x = 0
        elif self.x > WORLD_WIDTH - self.width:
            self.x = WORLD_WIDTH - self.width
            
        # Fall off screen - lose diamonds and respawn
        if self.y > SCREEN_HEIGHT + 100:
            self.lose_diamonds(10)
            self.respawn()
            
        # Animation
        self.animation_frame += 1
    
    def update_effect(self, effect):
        """Update visual effect and return True if it should continue"""
        effect['timer'] -= 1
        effect['size'] += 1  # Expand effect
        return effect['timer'] > 0
    
    def lose_diamonds(self, amount):
        self.diamonds -= amount
        sound_manager.play_sound('diamond_lost')
        if self.diamonds <= 0:
            self.diamonds = 0
            self.lose_life()
    
    def lose_life(self):
        self.lives -= 1
        sound_manager.play_sound('life_lost')
        self.diamonds = 50  # Reset diamonds
        self.respawn()
    
    def respawn(self):
        self.x = 100
        self.y = SCREEN_HEIGHT - 200
        self.vel_x = 0
        self.vel_y = 0
        self.invulnerable = 120  # 2 seconds of invulnerability
    
    def draw(self, screen, camera_x):
        # Calculate screen position
        screen_x = self.x - camera_x
        
        # Don't draw if off screen
        if screen_x < -50 or screen_x > SCREEN_WIDTH + 50:
            return
            
        # Flicker when invulnerable
        if self.invulnerable > 0 and self.invulnerable % 10 < 5:
            return
        
        # Body (boy character)
        body_color = (100, 150, 255)  # Blue shirt
        pygame.draw.rect(screen, body_color, (screen_x + 8, self.y + 16, 16, 20))
        
        # Pants
        pygame.draw.rect(screen, (50, 50, 150), (screen_x + 8, self.y + 36, 16, 12))
        
        # Head
        pygame.draw.circle(screen, (255, 220, 177), 
                         (int(screen_x + 16), int(self.y + 12)), 10)
        
        # Hair
        pygame.draw.arc(screen, BROWN, 
                       (screen_x + 6, self.y + 2, 20, 16), 0, math.pi, 3)
        
        # Eyes
        eye_x = screen_x + 16 + (2 if self.facing_right else -2)
        pygame.draw.circle(screen, BLACK, (int(eye_x), int(self.y + 10)), 2)
        
        # Arms with enhanced combat visualization
        arm_y = self.y + 20
        if self.punching:
            # Extended arm for punch with more detail
            arm_x = screen_x + (28 if self.facing_right else 4)
            # Upper arm
            pygame.draw.line(screen, (255, 220, 177), 
                           (screen_x + 16, arm_y), (arm_x - 8, arm_y), 4)
            # Forearm
            pygame.draw.line(screen, (255, 220, 177), 
                           (arm_x - 8, arm_y), (arm_x, arm_y), 4)
            # Fist
            pygame.draw.circle(screen, (255, 200, 150), (int(arm_x), int(arm_y)), 5)
        else:
            # Normal arms
            pygame.draw.circle(screen, (255, 220, 177), 
                             (int(screen_x + 6), int(arm_y)), 3)
            pygame.draw.circle(screen, (255, 220, 177), 
                             (int(screen_x + 26), int(arm_y)), 3)
        
        # Legs with enhanced kicking visualization
        leg_y = self.y + 48
        if self.kicking:
            # Extended leg for kick with more detail
            leg_x = screen_x + (32 if self.facing_right else 0)
            # Thigh
            pygame.draw.line(screen, (255, 220, 177), 
                           (screen_x + 16, leg_y - 5), (leg_x - 8, leg_y), 5)
            # Shin
            pygame.draw.line(screen, (255, 220, 177), 
                           (leg_x - 8, leg_y), (leg_x, leg_y), 5)
            # Foot
            pygame.draw.ellipse(screen, (50, 50, 50), 
                              (leg_x - 2, leg_y - 2, 8, 4))
            # Other leg (standing)
            other_leg_x = screen_x + (8 if self.facing_right else 24)
            pygame.draw.circle(screen, (255, 220, 177), 
                             (int(other_leg_x), int(leg_y)), 3)
        else:
            # Normal legs with walking animation
            offset = math.sin(self.animation_frame * 0.3) * 2 if abs(self.vel_x) > 0 else 0
            pygame.draw.circle(screen, (255, 220, 177), 
                             (int(screen_x + 10 + offset), int(leg_y)), 3)
            pygame.draw.circle(screen, (255, 220, 177), 
                             (int(screen_x + 22 - offset), int(leg_y)), 3)
        
        # Draw visual effects
        self.draw_effects(screen, camera_x)
    
    def draw_effects(self, screen, camera_x):
        """Draw punch and kick visual effects"""
        # Draw punch effects
        for effect in self.punch_effect:
            screen_x = effect['x'] - camera_x
            if -50 < screen_x < SCREEN_WIDTH + 50:
                # Expanding circle effect
                alpha = int(255 * (effect['timer'] / 15))
                color = (*YELLOW[:3], alpha) if len(YELLOW) == 3 else YELLOW
                
                # Create multiple rings for impact effect
                for i in range(3):
                    radius = effect['size'] + i * 3
                    if radius > 0:
                        pygame.draw.circle(screen, YELLOW, 
                                         (int(screen_x), int(effect['y'])), 
                                         radius, 2)
                
                # Add spark effects
                for i in range(8):
                    angle = (i * 45) * math.pi / 180
                    spark_x = screen_x + math.cos(angle) * effect['size']
                    spark_y = effect['y'] + math.sin(angle) * effect['size']
                    pygame.draw.circle(screen, WHITE, 
                                     (int(spark_x), int(spark_y)), 2)
        
        # Draw kick effects
        for effect in self.kick_effect:
            screen_x = effect['x'] - camera_x
            if -50 < screen_x < SCREEN_WIDTH + 50:
                # Expanding arc effect for kick
                alpha = int(255 * (effect['timer'] / 20))
                
                # Create arc effect
                for i in range(5):
                    radius = effect['size'] + i * 2
                    if radius > 0:
                        # Draw arc
                        start_angle = -math.pi/4
                        end_angle = math.pi/4
                        pygame.draw.arc(screen, RED, 
                                      (screen_x - radius, effect['y'] - radius, 
                                       radius * 2, radius * 2),
                                      start_angle, end_angle, 3)
                
                # Add motion lines
                for i in range(3):
                    line_x = screen_x + i * 8
                    pygame.draw.line(screen, ORANGE, 
                                   (line_x, effect['y'] - 5), 
                                   (line_x, effect['y'] + 5), 2)

class Platform:
    def __init__(self, x, y, width, height):
        self.rect = pygame.Rect(x, y, width, height)
        
    def draw(self, screen, camera_x):
        # Calculate screen position
        screen_x = self.rect.x - camera_x
        
        # Don't draw if completely off screen
        if screen_x + self.rect.width < 0 or screen_x > SCREEN_WIDTH:
            return
            
        # Dirt base
        dirt_rect = pygame.Rect(screen_x, self.rect.y, self.rect.width, self.rect.height)
        pygame.draw.rect(screen, BROWN, dirt_rect)
        
        # Grass top
        grass_rect = pygame.Rect(screen_x, self.rect.y, self.rect.width, 8)
        pygame.draw.rect(screen, GREEN, grass_rect)
        
        # Add some texture
        for i in range(0, self.rect.width, 16):
            if screen_x + i >= 0 and screen_x + i <= SCREEN_WIDTH:
                pygame.draw.line(screen, (100, 50, 0), 
                               (screen_x + i, self.rect.y + 8), 
                               (screen_x + i, self.rect.y + self.rect.height), 1)

class Diamond:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 16
        self.height = 16
        self.collected = False
        self.animation = 0
        
    def update(self, player):
        if self.collected:
            return
            
        self.animation += 0.2
        
        # Check collision with player
        diamond_rect = pygame.Rect(self.x, self.y, self.width, self.height)
        player_rect = pygame.Rect(player.x, player.y, player.width, player.height)
        
        if diamond_rect.colliderect(player_rect):
            self.collected = True
            player.diamonds += 1
            sound_manager.play_sound('diamond_collect')
    
    def draw(self, screen, camera_x):
        if self.collected:
            return
            
        screen_x = self.x - camera_x
        if screen_x < -20 or screen_x > SCREEN_WIDTH + 20:
            return
            
        # Animated diamond
        offset_y = math.sin(self.animation) * 3
        points = [
            (screen_x + 8, self.y + offset_y),
            (screen_x + 4, self.y + 6 + offset_y),
            (screen_x + 8, self.y + 12 + offset_y),
            (screen_x + 12, self.y + 6 + offset_y)
        ]
        pygame.draw.polygon(screen, CYAN, points)
        pygame.draw.polygon(screen, WHITE, points, 2)

class Robot:
    def __init__(self, x, y, robot_type="normal"):
        self.x = x
        self.y = y
        self.width = 28
        self.height = 40
        self.vel_x = random.choice([-2, 2])
        self.vel_y = 0
        self.health = 30 if robot_type == "normal" else 60
        self.max_health = self.health
        self.alive = True
        self.attack_timer = 0
        self.patrol_distance = 100
        self.start_x = x
        self.type = robot_type
        self.speed = 1.5 if robot_type == "normal" else 2.5
        
    def update(self, platforms, player):
        if not self.alive:
            return
            
        # Simple AI - patrol and chase player if close
        distance_to_player = abs(self.x - player.x)
        
        if distance_to_player < 200:
            # Chase player
            if player.x > self.x:
                self.vel_x = self.speed
            else:
                self.vel_x = -self.speed
        else:
            # Patrol
            if abs(self.x - self.start_x) > self.patrol_distance:
                self.vel_x *= -1
                
        # Apply gravity
        self.vel_y += GRAVITY
        
        # Update position
        self.x += self.vel_x
        self.y += self.vel_y
        
        # Platform collision
        robot_rect = pygame.Rect(self.x, self.y, self.width, self.height)
        on_ground = False
        
        for platform in platforms:
            if robot_rect.colliderect(platform.rect):
                if self.vel_y > 0 and self.y < platform.rect.top:
                    self.y = platform.rect.top - self.height
                    self.vel_y = 0
                    on_ground = True
                    
        # Turn around at edges
        if not on_ground and self.vel_y >= 0:
            self.vel_x *= -1
            
        # Attack player if close and player is not invulnerable
        if (distance_to_player < 40 and abs(self.y - player.y) < 50 and 
            player.invulnerable == 0 and not (player.punching or player.kicking)):
            self.attack_timer += 1
            if self.attack_timer > 60:  # Attack every second
                player.lose_diamonds(5)
                player.invulnerable = 60  # 1 second invulnerability
                self.attack_timer = 0
        
        # Check if hit by player
        if distance_to_player < PUNCH_RANGE and player.punching:
            self.health -= 15
            self.vel_x = 5 if player.facing_right else -5
            sound_manager.play_sound('robot_hit')
            
        if distance_to_player < KICK_RANGE and player.kicking:
            self.health -= 25
            self.vel_x = 8 if player.facing_right else -8
            self.vel_y = -5
            sound_manager.play_sound('robot_hit')
            
        # Check if jumped on
        if (abs(self.x - player.x) < 30 and 
            player.y + player.height < self.y + 10 and 
            player.vel_y > 0):
            self.health -= 20
            player.vel_y = -8  # Bounce player up
            sound_manager.play_sound('robot_hit')
            # Add cooldown to prevent infinite bouncing
            player.jump_cooldown = 10
            
        if self.health <= 0:
            self.alive = False
    
    def draw(self, screen, camera_x):
        if not self.alive:
            return
            
        screen_x = self.x - camera_x
        if screen_x < -50 or screen_x > SCREEN_WIDTH + 50:
            return
            
        # Robot body
        color = GRAY if self.type == "normal" else (150, 50, 50)
        pygame.draw.rect(screen, color, (screen_x, self.y, self.width, self.height))
        
        # Robot head
        pygame.draw.rect(screen, (150, 150, 150), 
                        (screen_x + 4, self.y - 8, self.width - 8, 12))
        
        # Evil red eyes
        pygame.draw.circle(screen, RED, (int(screen_x + 8), int(self.y - 2)), 3)
        pygame.draw.circle(screen, RED, (int(screen_x + self.width - 8), int(self.y - 2)), 3)
        
        # Health bar
        if self.health < self.max_health:
            bar_width = int((self.health / self.max_health) * self.width)
            pygame.draw.rect(screen, RED, (screen_x, self.y - 15, self.width, 4))
            pygame.draw.rect(screen, GREEN, (screen_x, self.y - 15, bar_width, 4))

class Boss:
    def __init__(self, x, y, level):
        self.x = x
        self.y = y
        self.width = 60
        self.height = 80
        self.vel_x = 0
        self.vel_y = 0
        self.health = 100 + (level * 50)
        self.max_health = self.health
        self.alive = True
        self.attack_timer = 0
        self.level = level
        self.phase = 0
        self.attack_pattern = 0
        self.animation = 0
        self.move_timer = 0
        self.jump_timer = 0
        self.charge_timer = 0
        self.is_charging = False
        
    def update(self, platforms, player):
        if not self.alive:
            return
            
        self.animation += 0.1
        distance_to_player = abs(self.x - player.x)
        
        # Update timers
        self.attack_timer += 1
        self.move_timer += 1
        self.jump_timer += 1
        
        # Boss AI based on level and health percentage
        health_percentage = self.health / self.max_health
        
        if self.level <= 2:
            # Simple aggressive boss
            if self.attack_timer > 60:  # Attack every second
                if distance_to_player < 80:
                    # Close range attack
                    if player.invulnerable == 0 and not (player.punching or player.kicking):
                        player.lose_diamonds(8)
                        player.invulnerable = 60
                        sound_manager.play_sound('robot_hit')
                    self.attack_timer = 0
                elif distance_to_player < 150:
                    # Charge at player
                    self.is_charging = True
                    self.charge_timer = 30
                    if player.x > self.x:
                        self.vel_x = 4
                    else:
                        self.vel_x = -4
                    self.attack_timer = 0
            
            # Normal movement when not attacking
            if not self.is_charging and self.move_timer > 120:
                if player.x > self.x:
                    self.vel_x = 2
                else:
                    self.vel_x = -2
                self.move_timer = 0
                
        else:
            # Advanced boss with multiple attack patterns
            if self.attack_timer > 90:
                self.attack_pattern = (self.attack_pattern + 1) % 4
                self.attack_timer = 0
                
            if self.attack_pattern == 0:  # Aggressive chase
                if player.x > self.x:
                    self.vel_x = 3 + self.level * 0.5
                else:
                    self.vel_x = -(3 + self.level * 0.5)
                    
                # Close combat
                if distance_to_player < 70 and player.invulnerable == 0:
                    if not (player.punching or player.kicking):
                        player.lose_diamonds(10 + self.level * 2)
                        player.invulnerable = 45
                        sound_manager.play_sound('robot_hit')
                        
            elif self.attack_pattern == 1:  # Jump attack
                if self.jump_timer > 60 and distance_to_player < 200:
                    self.vel_y = -15
                    self.jump_timer = 0
                    # Damage player if boss lands on them
                    if (distance_to_player < 50 and 
                        abs(self.y - player.y) < 30 and 
                        player.invulnerable == 0):
                        player.lose_diamonds(15)
                        player.invulnerable = 90
                        sound_manager.play_sound('robot_hit')
                        
            elif self.attack_pattern == 2:  # Charge attack
                self.is_charging = True
                self.charge_timer = 45
                charge_speed = 5 + self.level
                if player.x > self.x:
                    self.vel_x = charge_speed
                else:
                    self.vel_x = -charge_speed
                    
                # Damage during charge
                if (distance_to_player < 60 and 
                    player.invulnerable == 0 and 
                    not (player.punching or player.kicking)):
                    player.lose_diamonds(12 + self.level)
                    player.invulnerable = 60
                    sound_manager.play_sound('robot_hit')
                    
            else:  # Defensive pattern with occasional strikes
                self.vel_x *= 0.8  # Slow down
                if distance_to_player < 100 and self.move_timer > 30:
                    # Quick strike
                    if player.invulnerable == 0:
                        player.lose_diamonds(8)
                        player.invulnerable = 75
                        sound_manager.play_sound('robot_hit')
                    self.move_timer = 0
        
        # Handle charging state
        if self.is_charging:
            self.charge_timer -= 1
            if self.charge_timer <= 0:
                self.is_charging = False
                self.vel_x *= 0.5  # Slow down after charge
        
        # Enraged mode when health is low
        if health_percentage < 0.3:
            self.vel_x *= 1.5  # Move faster when low health
            if self.attack_timer > 45:  # Attack more frequently
                if (distance_to_player < 90 and 
                    player.invulnerable == 0 and 
                    not (player.punching or player.kicking)):
                    player.lose_diamonds(6)
                    player.invulnerable = 30
                    sound_manager.play_sound('robot_hit')
                    self.attack_timer = 0
        
        # Apply gravity
        self.vel_y += GRAVITY
        
        # Update position
        self.x += self.vel_x
        self.y += self.vel_y
        
        # Platform collision
        boss_rect = pygame.Rect(self.x, self.y, self.width, self.height)
        
        for platform in platforms:
            if boss_rect.colliderect(platform.rect):
                if self.vel_y > 0 and self.y < platform.rect.top:
                    self.y = platform.rect.top - self.height
                    self.vel_y = 0
        
        # Keep boss in boss area (don't let it wander too far)
        if self.x < WORLD_WIDTH - 600:
            self.x = WORLD_WIDTH - 600
            self.vel_x = abs(self.vel_x)  # Turn around
        elif self.x > WORLD_WIDTH - 100:
            self.x = WORLD_WIDTH - 100
            self.vel_x = -abs(self.vel_x)  # Turn around
                    
        # Check if hit by player
        if distance_to_player < PUNCH_RANGE and player.punching:
            self.health -= 10
            self.vel_x = 3 if player.facing_right else -3
            sound_manager.play_sound('boss_hit')
            
        if distance_to_player < KICK_RANGE and player.kicking:
            self.health -= 20
            self.vel_x = 5 if player.facing_right else -5
            self.vel_y = -3
            sound_manager.play_sound('boss_hit')
            
        # Check if jumped on (with cooldown to prevent infinite bouncing)
        if (abs(self.x - player.x) < 40 and 
            player.y + player.height < self.y + 15 and 
            player.vel_y > 0 and 
            player.jump_cooldown == 0):
            self.health -= 15
            player.vel_y = -10
            player.jump_cooldown = 15  # Prevent immediate re-bounce
            sound_manager.play_sound('boss_hit')
            
        if self.health <= 0:
            self.alive = False
    
    def draw(self, screen, camera_x):
        if not self.alive:
            return
            
        screen_x = self.x - camera_x
        if screen_x < -100 or screen_x > SCREEN_WIDTH + 100:
            return
            
        # Boss body (larger and more menacing)
        colors = [(100, 0, 100), (150, 0, 0), (0, 100, 100), (100, 100, 0), (150, 50, 150)]
        boss_color = colors[min(self.level - 1, 4)]
        
        # Charging effect - make boss glow red
        if self.is_charging:
            boss_color = (255, 50, 50)
        
        # Enraged effect when health is low
        health_percentage = self.health / self.max_health
        if health_percentage < 0.3:
            # Pulsing red effect when low health
            pulse_intensity = int(abs(math.sin(self.animation * 3)) * 100)
            boss_color = (min(255, boss_color[0] + pulse_intensity), 
                         boss_color[1], boss_color[2])
        
        # Pulsing effect
        pulse = int(math.sin(self.animation) * 3)
        pygame.draw.rect(screen, boss_color, 
                        (screen_x - pulse, self.y - pulse, 
                         self.width + pulse*2, self.height + pulse*2))
        
        # Boss head
        head_color = (200, 200, 200)
        if self.is_charging:
            head_color = (255, 200, 200)
        pygame.draw.rect(screen, head_color, 
                        (screen_x + 10, self.y - 15, self.width - 20, 20))
        
        # Glowing eyes - more intense when attacking
        if self.attack_pattern == 0 or self.is_charging:  # Aggressive mode
            eye_color = (255, 0, 0)
            eye_size = 6
        elif health_percentage < 0.3:  # Enraged mode
            eye_color = (255, 100, 0) if self.animation % 1 < 0.5 else (255, 0, 0)
            eye_size = 7
        else:
            eye_color = (255, 0, 0) if self.animation % 1 < 0.5 else (255, 100, 100)
            eye_size = 5
            
        pygame.draw.circle(screen, eye_color, (int(screen_x + 20), int(self.y - 5)), eye_size)
        pygame.draw.circle(screen, eye_color, (int(screen_x + self.width - 20), int(self.y - 5)), eye_size)
        
        # Attack pattern indicator
        if self.attack_pattern == 1:  # Jump attack mode
            # Show jump preparation
            for i in range(3):
                pygame.draw.circle(screen, (255, 255, 0), 
                                 (int(screen_x + self.width//2), int(self.y + self.height + 5 + i*3)), 
                                 2)
        elif self.attack_pattern == 2 or self.is_charging:  # Charge mode
            # Show charge lines
            for i in range(5):
                line_x = screen_x - 10 - i*5
                pygame.draw.line(screen, (255, 100, 0), 
                               (line_x, self.y + 20), (line_x, self.y + 60), 2)
        
        # Health bar
        bar_width = int((self.health / self.max_health) * self.width)
        bar_color = GREEN
        if health_percentage < 0.5:
            bar_color = YELLOW
        if health_percentage < 0.3:
            bar_color = RED
            
        pygame.draw.rect(screen, RED, (screen_x, self.y - 25, self.width, 6))
        pygame.draw.rect(screen, bar_color, (screen_x, self.y - 25, bar_width, 6))
        
        # Boss level indicator
        font = pygame.font.Font(None, 24)
        level_text = font.render(f"BOSS LV.{self.level}", True, WHITE)
        screen.blit(level_text, (screen_x, self.y - 45))
        
        # Attack mode indicator
        if self.level > 2:
            mode_text = ""
            if self.attack_pattern == 0:
                mode_text = "AGGRESSIVE"
            elif self.attack_pattern == 1:
                mode_text = "JUMP ATTACK"
            elif self.attack_pattern == 2:
                mode_text = "CHARGING"
            else:
                mode_text = "DEFENSIVE"
                
            if health_percentage < 0.3:
                mode_text = "ENRAGED!"
                
            mode_font = pygame.font.Font(None, 18)
            mode_surface = mode_font.render(mode_text, True, YELLOW)
            screen.blit(mode_surface, (screen_x, self.y - 65))

def create_level(level_num):
    platforms = []
    robots = []
    diamonds = []
    boss = None
    
    # Base ground platforms
    for i in range(0, WORLD_WIDTH, 200):
        platforms.append(Platform(i, SCREEN_HEIGHT - 40, 180, 40))
    
    # Boss platform at the very end
    boss_platform_x = WORLD_WIDTH - 300
    platforms.append(Platform(boss_platform_x, SCREEN_HEIGHT - 100, 250, 60))
    
    if level_num == 1:
        # Level 1 - Simple layout
        platforms.extend([
            Platform(300, SCREEN_HEIGHT - 150, 120, 30),
            Platform(600, SCREEN_HEIGHT - 200, 150, 30),
            Platform(1000, SCREEN_HEIGHT - 180, 100, 30),
            Platform(1300, SCREEN_HEIGHT - 280, 120, 30),
            Platform(1600, SCREEN_HEIGHT - 320, 140, 30),
            Platform(2000, SCREEN_HEIGHT - 250, 100, 30),
            Platform(2300, SCREEN_HEIGHT - 400, 120, 30),
        ])
        
        # Robots (not near boss area)
        robots.extend([
            Robot(350, SCREEN_HEIGHT - 80),
            Robot(650, SCREEN_HEIGHT - 80),
            Robot(1050, SCREEN_HEIGHT - 210),
            Robot(1350, SCREEN_HEIGHT - 310),
            Robot(1650, SCREEN_HEIGHT - 350),
            Robot(2050, SCREEN_HEIGHT - 280),
        ])
        
        boss = Boss(boss_platform_x + 50, SCREEN_HEIGHT - 160, 1)
        
    elif level_num == 2:
        # Level 2 - More complex
        platforms.extend([
            Platform(200, SCREEN_HEIGHT - 120, 100, 30),
            Platform(400, SCREEN_HEIGHT - 200, 120, 30),
            Platform(600, SCREEN_HEIGHT - 160, 80, 30),
            Platform(800, SCREEN_HEIGHT - 280, 100, 30),
            Platform(1000, SCREEN_HEIGHT - 220, 120, 30),
            Platform(1200, SCREEN_HEIGHT - 350, 100, 30),
            Platform(1400, SCREEN_HEIGHT - 180, 140, 30),
            Platform(1600, SCREEN_HEIGHT - 400, 120, 30),
            Platform(1800, SCREEN_HEIGHT - 300, 100, 30),
            Platform(2000, SCREEN_HEIGHT - 450, 120, 30),
            Platform(2200, SCREEN_HEIGHT - 250, 100, 30),
        ])
        
        robots.extend([
            Robot(250, SCREEN_HEIGHT - 80),
            Robot(450, SCREEN_HEIGHT - 230),
            Robot(650, SCREEN_HEIGHT - 190),
            Robot(850, SCREEN_HEIGHT - 310),
            Robot(1050, SCREEN_HEIGHT - 250),
            Robot(1250, SCREEN_HEIGHT - 380),
            Robot(1450, SCREEN_HEIGHT - 210),
            Robot(1850, SCREEN_HEIGHT - 330),
            Robot(2050, SCREEN_HEIGHT - 480),
        ])
        
        boss = Boss(boss_platform_x + 50, SCREEN_HEIGHT - 160, 2)
        
    elif level_num == 3:
        # Level 3 - Vertical challenges
        platforms.extend([
            Platform(150, SCREEN_HEIGHT - 100, 80, 30),
            Platform(300, SCREEN_HEIGHT - 180, 100, 30),
            Platform(500, SCREEN_HEIGHT - 260, 80, 30),
            Platform(700, SCREEN_HEIGHT - 340, 100, 30),
            Platform(900, SCREEN_HEIGHT - 420, 80, 30),
            Platform(1100, SCREEN_HEIGHT - 500, 100, 30),
            Platform(1300, SCREEN_HEIGHT - 380, 120, 30),
            Platform(1500, SCREEN_HEIGHT - 280, 100, 30),
            Platform(1700, SCREEN_HEIGHT - 200, 80, 30),
            Platform(1900, SCREEN_HEIGHT - 320, 100, 30),
            Platform(2100, SCREEN_HEIGHT - 450, 120, 30),
            Platform(2300, SCREEN_HEIGHT - 350, 100, 30),
        ])
        
        robots.extend([
            Robot(200, SCREEN_HEIGHT - 130),
            Robot(350, SCREEN_HEIGHT - 210),
            Robot(550, SCREEN_HEIGHT - 290),
            Robot(750, SCREEN_HEIGHT - 370),
            Robot(950, SCREEN_HEIGHT - 450),
            Robot(1150, SCREEN_HEIGHT - 530),
            Robot(1350, SCREEN_HEIGHT - 410),
            Robot(1550, SCREEN_HEIGHT - 310),
            Robot(1950, SCREEN_HEIGHT - 350),
            Robot(2150, SCREEN_HEIGHT - 480),
            Robot(2350, SCREEN_HEIGHT - 380),
        ])
        
        boss = Boss(boss_platform_x + 50, SCREEN_HEIGHT - 160, 3)
        
    elif level_num == 4:
        # Level 4 - Mixed challenges with tougher robots
        platforms.extend([
            Platform(100, SCREEN_HEIGHT - 120, 100, 30),
            Platform(250, SCREEN_HEIGHT - 200, 80, 30),
            Platform(400, SCREEN_HEIGHT - 150, 120, 30),
            Platform(600, SCREEN_HEIGHT - 280, 100, 30),
            Platform(800, SCREEN_HEIGHT - 200, 80, 30),
            Platform(1000, SCREEN_HEIGHT - 350, 120, 30),
            Platform(1200, SCREEN_HEIGHT - 250, 100, 30),
            Platform(1400, SCREEN_HEIGHT - 400, 80, 30),
            Platform(1600, SCREEN_HEIGHT - 180, 120, 30),
            Platform(1800, SCREEN_HEIGHT - 320, 100, 30),
            Platform(2000, SCREEN_HEIGHT - 450, 120, 30),
            Platform(2200, SCREEN_HEIGHT - 280, 100, 30),
            Platform(2400, SCREEN_HEIGHT - 380, 80, 30),
        ])
        
        robots.extend([
            Robot(150, SCREEN_HEIGHT - 80, "tough"),
            Robot(300, SCREEN_HEIGHT - 230, "normal"),
            Robot(450, SCREEN_HEIGHT - 180, "tough"),
            Robot(650, SCREEN_HEIGHT - 310, "normal"),
            Robot(850, SCREEN_HEIGHT - 230, "tough"),
            Robot(1050, SCREEN_HEIGHT - 380, "normal"),
            Robot(1250, SCREEN_HEIGHT - 280, "tough"),
            Robot(1450, SCREEN_HEIGHT - 430, "normal"),
            Robot(1650, SCREEN_HEIGHT - 210, "tough"),
            Robot(1850, SCREEN_HEIGHT - 350, "normal"),
            Robot(2050, SCREEN_HEIGHT - 480, "tough"),
            Robot(2250, SCREEN_HEIGHT - 310, "normal"),
        ])
        
        boss = Boss(boss_platform_x + 50, SCREEN_HEIGHT - 160, 4)
        
    else:  # Level 5 - Final challenge
        # Level 5 - Ultimate challenge
        platforms.extend([
            Platform(80, SCREEN_HEIGHT - 100, 80, 30),
            Platform(200, SCREEN_HEIGHT - 180, 60, 30),
            Platform(320, SCREEN_HEIGHT - 260, 80, 30),
            Platform(480, SCREEN_HEIGHT - 340, 60, 30),
            Platform(600, SCREEN_HEIGHT - 420, 80, 30),
            Platform(750, SCREEN_HEIGHT - 500, 60, 30),
            Platform(900, SCREEN_HEIGHT - 380, 80, 30),
            Platform(1050, SCREEN_HEIGHT - 280, 60, 30),
            Platform(1200, SCREEN_HEIGHT - 200, 80, 30),
            Platform(1350, SCREEN_HEIGHT - 320, 60, 30),
            Platform(1500, SCREEN_HEIGHT - 450, 80, 30),
            Platform(1650, SCREEN_HEIGHT - 350, 60, 30),
            Platform(1800, SCREEN_HEIGHT - 250, 80, 30),
            Platform(1950, SCREEN_HEIGHT - 400, 60, 30),
            Platform(2100, SCREEN_HEIGHT - 300, 80, 30),
            Platform(2250, SCREEN_HEIGHT - 480, 60, 30),
            Platform(2400, SCREEN_HEIGHT - 380, 80, 30),
        ])
        
        robots.extend([
            Robot(130, SCREEN_HEIGHT - 80, "tough"),
            Robot(250, SCREEN_HEIGHT - 210, "tough"),
            Robot(370, SCREEN_HEIGHT - 290, "tough"),
            Robot(530, SCREEN_HEIGHT - 370, "tough"),
            Robot(650, SCREEN_HEIGHT - 450, "tough"),
            Robot(800, SCREEN_HEIGHT - 530, "tough"),
            Robot(950, SCREEN_HEIGHT - 410, "tough"),
            Robot(1100, SCREEN_HEIGHT - 310, "tough"),
            Robot(1250, SCREEN_HEIGHT - 230, "tough"),
            Robot(1400, SCREEN_HEIGHT - 350, "tough"),
            Robot(1550, SCREEN_HEIGHT - 480, "tough"),
            Robot(1700, SCREEN_HEIGHT - 380, "tough"),
            Robot(1850, SCREEN_HEIGHT - 280, "tough"),
            Robot(2000, SCREEN_HEIGHT - 430, "tough"),
            Robot(2150, SCREEN_HEIGHT - 330, "tough"),
            Robot(2300, SCREEN_HEIGHT - 510, "tough"),
        ])
        
        boss = Boss(boss_platform_x + 50, SCREEN_HEIGHT - 160, 5)
    
    # Add diamonds throughout the level (but not in boss area)
    diamond_positions = []
    for platform in platforms[1:-1]:  # Skip ground platforms and boss platform
        if platform.rect.x < WORLD_WIDTH - 500:  # Don't place diamonds near boss
            # Add diamonds on platforms
            for i in range(2):
                diamond_x = platform.rect.x + random.randint(10, platform.rect.width - 20)
                diamond_y = platform.rect.y - 20
                diamond_positions.append((diamond_x, diamond_y))
    
    # Add some floating diamonds (not near boss area)
    for i in range(level_num * 5):
        x = random.randint(100, WORLD_WIDTH - 600)  # Keep away from boss area
        y = random.randint(200, SCREEN_HEIGHT - 200)
        diamond_positions.append((x, y))
    
    for pos in diamond_positions:
        diamonds.append(Diamond(pos[0], pos[1]))
    
    return platforms, robots, diamonds, boss

def main():
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    pygame.display.set_caption("Retro Platform Fighter - Diamond Quest")
    clock = pygame.time.Clock()
    
    # Game state
    current_level = 1
    score = 0
    camera_x = 0
    game_state = "playing"  # "playing", "level_complete", "game_over", "victory"
    transition_timer = 0
    
    # Create game objects
    player = Player(100, SCREEN_HEIGHT - 200)
    platforms, robots, diamonds, boss = create_level(current_level)
    
    # Fonts
    font = pygame.font.Font(None, 36)
    big_font = pygame.font.Font(None, 72)
    
    running = True
    while running:
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_r and (game_state == "game_over" or game_state == "victory"):
                    # Restart game
                    current_level = 1
                    score = 0
                    player = Player(100, SCREEN_HEIGHT - 200)
                    platforms, robots, diamonds, boss = create_level(current_level)
                    game_state = "playing"
                    camera_x = 0
                elif event.key == pygame.K_RETURN and game_state == "level_complete":
                    # Next level
                    current_level += 1
                    if current_level > 5:
                        game_state = "victory"
                    else:
                        player = Player(100, SCREEN_HEIGHT - 200)
                        platforms, robots, diamonds, boss = create_level(current_level)
                        game_state = "playing"
                        camera_x = 0
        
        if game_state == "playing":
            # Update camera to follow player
            target_camera_x = player.x - SCREEN_WIDTH // 2
            target_camera_x = max(0, min(target_camera_x, WORLD_WIDTH - SCREEN_WIDTH))
            camera_x += (target_camera_x - camera_x) * 0.1
            
            # Update game objects
            if player.lives > 0:
                player.update(platforms, camera_x)
                
                # Update diamonds
                for diamond in diamonds[:]:
                    diamond.update(player)
                    if diamond.collected:
                        diamonds.remove(diamond)
                        score += 10
                
                # Update robots
                for robot in robots[:]:
                    robot.update(platforms, player)
                    if not robot.alive:
                        robots.remove(robot)
                        score += 100
                
                # Update boss
                if boss and boss.alive:
                    boss.update(platforms, player)
                    if not boss.alive:
                        score += 500
                        sound_manager.play_sound('level_complete')
                        game_state = "level_complete"
                        transition_timer = 180  # 3 seconds
                
                # Check if player reached boss area without defeating all robots
                if player.x > WORLD_WIDTH - 500 and len([r for r in robots if r.alive]) > 0:
                    # Push player back
                    player.x = WORLD_WIDTH - 500
                    
            else:
                game_state = "game_over"
        
        elif game_state == "level_complete":
            transition_timer -= 1
            if transition_timer <= 0:
                # Auto-advance after showing completion message
                current_level += 1
                if current_level > 5:
                    game_state = "victory"
                else:
                    player = Player(100, SCREEN_HEIGHT - 200)
                    platforms, robots, diamonds, boss = create_level(current_level)
                    game_state = "playing"
                    camera_x = 0
        
        # Draw everything
        screen.fill(BLUE)  # Sky background
        
        if game_state == "playing" or game_state == "level_complete":
            # Draw platforms
            for platform in platforms:
                platform.draw(screen, camera_x)
            
            # Draw diamonds
            for diamond in diamonds:
                diamond.draw(screen, camera_x)
            
            # Draw robots
            for robot in robots:
                robot.draw(screen, camera_x)
            
            # Draw boss
            if boss:
                boss.draw(screen, camera_x)
            
            # Draw player
            if player.lives > 0:
                player.draw(screen, camera_x)
            
            # Draw UI
            diamonds_text = font.render(f"Diamonds: {player.diamonds}", True, WHITE)
            screen.blit(diamonds_text, (10, 10))
            
            lives_text = font.render(f"Lives: {player.lives}", True, WHITE)
            screen.blit(lives_text, (10, 50))
            
            score_text = font.render(f"Score: {score}", True, WHITE)
            screen.blit(score_text, (10, 90))
            
            level_text = font.render(f"Level: {current_level}", True, WHITE)
            screen.blit(level_text, (10, 130))
            
            robots_left = len([r for r in robots if r.alive])
            robots_text = font.render(f"Robots Left: {robots_left}", True, WHITE)
            screen.blit(robots_text, (10, 170))
            
            # Instructions
            instructions = [
                "Arrow Keys/WASD: Move & Jump",
                "X: Punch, Z: Kick",
                "Collect diamonds, defeat robots!",
                "Defeat all robots to fight the boss!",
                "ESC: Quit"
            ]
            
            for i, instruction in enumerate(instructions):
                text = pygame.font.Font(None, 20).render(instruction, True, WHITE)
                screen.blit(text, (SCREEN_WIDTH - 280, 10 + i * 22))
            
            # Level complete message
            if game_state == "level_complete":
                complete_text = big_font.render("LEVEL COMPLETE!", True, YELLOW)
                screen.blit(complete_text, (SCREEN_WIDTH//2 - 200, SCREEN_HEIGHT//2 - 50))
                
                if current_level < 5:
                    next_text = font.render("Press ENTER for next level", True, WHITE)
                    screen.blit(next_text, (SCREEN_WIDTH//2 - 150, SCREEN_HEIGHT//2 + 20))
                else:
                    final_text = font.render("Final level completed!", True, WHITE)
                    screen.blit(final_text, (SCREEN_WIDTH//2 - 120, SCREEN_HEIGHT//2 + 20))
        
        elif game_state == "game_over":
            game_over_text = big_font.render("GAME OVER!", True, RED)
            screen.blit(game_over_text, (SCREEN_WIDTH//2 - 150, SCREEN_HEIGHT//2 - 50))
            
            final_score_text = font.render(f"Final Score: {score}", True, WHITE)
            screen.blit(final_score_text, (SCREEN_WIDTH//2 - 100, SCREEN_HEIGHT//2 + 20))
            
            restart_text = font.render("Press R to restart", True, WHITE)
            screen.blit(restart_text, (SCREEN_WIDTH//2 - 100, SCREEN_HEIGHT//2 + 60))
            
        elif game_state == "victory":
            victory_text = big_font.render("VICTORY!", True, YELLOW)
            screen.blit(victory_text, (SCREEN_WIDTH//2 - 120, SCREEN_HEIGHT//2 - 100))
            
            congrats_text = font.render("You defeated all 5 levels!", True, WHITE)
            screen.blit(congrats_text, (SCREEN_WIDTH//2 - 150, SCREEN_HEIGHT//2 - 30))
            
            final_score_text = font.render(f"Final Score: {score}", True, WHITE)
            screen.blit(final_score_text, (SCREEN_WIDTH//2 - 100, SCREEN_HEIGHT//2 + 10))
            
            restart_text = font.render("Press R to play again", True, WHITE)
            screen.blit(restart_text, (SCREEN_WIDTH//2 - 120, SCREEN_HEIGHT//2 + 50))
        
        pygame.display.flip()
        clock.tick(FPS)
    
    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
