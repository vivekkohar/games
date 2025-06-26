from django.db import models
from django.contrib.auth.models import User
import json

class RetroGameSession(models.Model):
    """Model to store retro platform fighter game session data"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, unique=True)
    current_level = models.IntegerField(default=1)
    diamonds = models.IntegerField(default=50)
    lives = models.IntegerField(default=3)
    score = models.IntegerField(default=0)
    player_x = models.FloatField(default=100)
    player_y = models.FloatField(default=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Retro Fighter Session {self.session_key} - Level {self.current_level}"

class RetroHighScore(models.Model):
    """Model to store high scores for retro platform fighter"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    player_name = models.CharField(max_length=50)
    score = models.IntegerField()
    level_reached = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-score', '-created_at']
    
    def __str__(self):
        return f"{self.player_name}: {self.score} points"

class RetroGameState(models.Model):
    """Model to store detailed game state for save/load functionality"""
    session = models.OneToOneField(RetroGameSession, on_delete=models.CASCADE)
    robots_defeated = models.TextField(default='[]')  # JSON array of defeated robot IDs
    diamonds_collected = models.TextField(default='[]')  # JSON array of collected diamond IDs
    boss_defeated = models.BooleanField(default=False)
    level_completed = models.BooleanField(default=False)
    
    def get_robots_defeated(self):
        return json.loads(self.robots_defeated)
    
    def set_robots_defeated(self, robot_list):
        self.robots_defeated = json.dumps(robot_list)
    
    def get_diamonds_collected(self):
        return json.loads(self.diamonds_collected)
    
    def set_diamonds_collected(self, diamond_list):
        self.diamonds_collected = json.dumps(diamond_list)
