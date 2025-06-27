from django.urls import path
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
from . import views

app_name = 'retro_platform_fighter'

urlpatterns = [
    # Game pages
    path('', views.IndexView.as_view(), name='index'),
    path('play/', views.GameView.as_view(), name='game'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    
    # API endpoints - using class-based views with appropriate HTTP methods
    path('api/save-state/', 
         views.SaveGameStateView.as_view(), 
         name='save_state'
    ),
    path('api/load-state/', 
         require_http_methods(['GET'])(views.load_game_state), 
         name='load_state'
    ),
    path('api/submit-score/', 
         views.SubmitHighScoreView.as_view(), 
         name='submit_score'
    ),
    path('api/high-scores/', 
         cache_page(60 * 5)(require_http_methods(['GET'])(views.high_scores)), 
         name='high_scores'
    ),
    path('api/reset-game/', 
         require_http_methods(['POST'])(views.reset_game), 
         name='reset_game'
    ),
]
