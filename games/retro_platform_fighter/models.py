from django.db import models, transaction
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import json
from datetime import timedelta
from django.utils import timezone

class RetroGameSession(models.Model):
    """
    Model to store retro platform fighter game session data.
    
    Attributes:
        user: Optional user associated with the game session
        session_key: Unique session identifier
        current_level: Current game level (1-10)
        diamonds: Number of diamonds collected
        lives: Number of remaining lives
        score: Player's current score
        player_x: Player's x-coordinate
        player_y: Player's y-coordinate
        created_at: When the session was created
        updated_at: When the session was last updated
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        db_index=True
    )
    session_key = models.CharField(max_length=40, unique=True, db_index=True)
    current_level = models.IntegerField(
        default=1,
        validators=[
            MinValueValidator(1, message="Level must be at least 1"),
            MaxValueValidator(10, message="Level cannot exceed 10")
        ]
    )
    diamonds = models.IntegerField(
        default=50,
        validators=[
            MinValueValidator(0, message="Diamonds cannot be negative"),
            MaxValueValidator(1000, message="Maximum diamonds exceeded")
        ]
    )
    lives = models.IntegerField(
        default=3,
        validators=[
            MinValueValidator(0, message="Lives cannot be negative"),
            MaxValueValidator(10, message="Maximum lives exceeded")
        ]
    )
    score = models.IntegerField(
        default=0,
        validators=[
            MinValueValidator(0, message="Score cannot be negative"),
            MaxValueValidator(1000000, message="Maximum score exceeded")
        ]
    )
    player_x = models.FloatField(default=100.0)
    player_y = models.FloatField(default=500.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['score', 'created_at']),
            models.Index(fields=['session_key'], name='session_key_idx'),
        ]
        ordering = ['-created_at']
    
    @classmethod
    def cleanup_old_sessions(cls, days_old=30):
        """Remove game sessions older than the specified number of days."""
        cutoff_date = timezone.now() - timedelta(days=days_old)
        return cls.objects.filter(created_at__lt=cutoff_date).delete()
    
    def __str__(self):
        return f"Retro Fighter Session {self.session_key} - Level {self.current_level}"

class RetroHighScore(models.Model):
    """
    Model to store high scores for retro platform fighter.
    
    Attributes:
        user: Optional user who achieved the score
        player_name: Display name for the score
        score: Achieved score
        level_reached: Highest level reached
        created_at: When the score was achieved
    """
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        db_index=True
    )
    player_name = models.CharField(
        max_length=50,
        help_text="Display name for the high score entry"
    )
    score = models.IntegerField(
        validators=[
            MinValueValidator(0, message="Score cannot be negative"),
            MaxValueValidator(1000000, message="Maximum score exceeded")
        ],
        db_index=True
    )
    level_reached = models.IntegerField(
        validators=[
            MinValueValidator(1, message="Level must be at least 1"),
            MaxValueValidator(10, message="Level cannot exceed 10")
        ]
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['-score', '-created_at']),
        ]
        ordering = ['-score', '-created_at']
        verbose_name = "High Score"
        verbose_name_plural = "High Scores"
    
    class Meta:
        ordering = ['-score', '-created_at']
    
    def __str__(self):
        return f"{self.player_name}: {self.score} points"

class RetroGameState(models.Model):
    """
    Model to store detailed game state for save/load functionality.
    
    Attributes:
        session: Associated game session
        robots_defeated: JSON array of defeated robot IDs
        diamonds_collected: JSON array of collected diamond IDs
        boss_defeated: Whether the boss has been defeated
        level_completed: Whether the current level is completed
    """
    session = models.OneToOneField(
        RetroGameSession, 
        on_delete=models.CASCADE,
        related_name='game_state'
    )
    robots_defeated = models.JSONField(
        default=list,
        help_text="List of defeated robot IDs"
    )
    diamonds_collected = models.JSONField(
        default=list,
        help_text="List of collected diamond IDs"
    )
    boss_defeated = models.BooleanField(
        default=False,
        help_text="Whether the boss has been defeated"
    )
    level_completed = models.BooleanField(
        default=False,
        help_text="Whether the current level is completed"
    )
    
    class Meta:
        verbose_name = "Game State"
        verbose_name_plural = "Game States"
    
    def __str__(self):
        return f"Game State for Session {self.session_id}"
    
    def get_robots_defeated(self) -> list:
        """Get the list of defeated robot IDs."""
        if isinstance(self.robots_defeated, list):
            return self.robots_defeated
        try:
            return json.loads(self.robots_defeated or '[]')
        except (TypeError, json.JSONDecodeError):
            return []
    
    def set_robots_defeated(self, robot_list: list) -> None:
        """Set the list of defeated robot IDs."""
        if not isinstance(robot_list, list):
            raise ValueError("robot_list must be a list")
        self.robots_defeated = robot_list
    
    def get_diamonds_collected(self) -> list:
        """Get the list of collected diamond IDs."""
        if isinstance(self.diamonds_collected, list):
            return self.diamonds_collected
        try:
            return json.loads(self.diamonds_collected or '[]')
        except (TypeError, json.JSONDecodeError):
            return []
    
    def set_diamonds_collected(self, diamond_list: list) -> None:
        """Set the list of collected diamond IDs."""
        if not isinstance(diamond_list, list):
            raise ValueError("diamond_list must be a list")
        self.diamonds_collected = diamond_list
