from django.urls import path
from . import views

app_name = 'retro_platform_fighter'

urlpatterns = [
    path('', views.index, name='index'),
    path('play/', views.game_view, name='game'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
    
    # API endpoints
    path('api/save-state/', views.save_game_state, name='save_state'),
    path('api/load-state/', views.load_game_state, name='load_state'),
    path('api/submit-score/', views.submit_high_score, name='submit_score'),
    path('api/high-scores/', views.high_scores, name='high_scores'),
    path('api/reset-game/', views.reset_game, name='reset_game'),
]
