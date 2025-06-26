from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.sessions.models import Session
from .models import RetroGameSession, RetroHighScore, RetroGameState
import json
import uuid

def index(request):
    """Retro Platform Fighter game landing page"""
    return render(request, 'retro_platform_fighter/index.html')

def game_view(request):
    """Game canvas page"""
    # Get or create game session
    session_key = request.session.session_key
    if not session_key:
        request.session.create()
        session_key = request.session.session_key
    
    game_session, created = RetroGameSession.objects.get_or_create(
        session_key=session_key,
        defaults={
            'current_level': 1,
            'diamonds': 50,
            'lives': 3,
            'score': 0,
            'player_x': 100,
            'player_y': 500
        }
    )
    
    # Get or create game state
    game_state, _ = RetroGameState.objects.get_or_create(session=game_session)
    
    context = {
        'game_session': game_session,
        'game_state': game_state
    }
    return render(request, 'retro_platform_fighter/game.html', context)

@csrf_exempt
@require_http_methods(["POST"])
def save_game_state(request):
    """API endpoint to save game state"""
    try:
        data = json.loads(request.body)
        session_key = request.session.session_key
        
        if not session_key:
            return JsonResponse({'error': 'No session found'}, status=400)
        
        game_session = get_object_or_404(RetroGameSession, session_key=session_key)
        
        # Update game session
        game_session.current_level = data.get('level', game_session.current_level)
        game_session.diamonds = data.get('diamonds', game_session.diamonds)
        game_session.lives = data.get('lives', game_session.lives)
        game_session.score = data.get('score', game_session.score)
        game_session.player_x = data.get('playerX', game_session.player_x)
        game_session.player_y = data.get('playerY', game_session.player_y)
        game_session.save()
        
        # Update game state
        game_state, _ = RetroGameState.objects.get_or_create(session=game_session)
        if 'robotsDefeated' in data:
            game_state.set_robots_defeated(data['robotsDefeated'])
        if 'diamondsCollected' in data:
            game_state.set_diamonds_collected(data['diamondsCollected'])
        game_state.boss_defeated = data.get('bossDefeated', game_state.boss_defeated)
        game_state.level_completed = data.get('levelCompleted', game_state.level_completed)
        game_state.save()
        
        return JsonResponse({'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def load_game_state(request):
    """API endpoint to load game state"""
    try:
        session_key = request.session.session_key
        
        if not session_key:
            return JsonResponse({'error': 'No session found'}, status=400)
        
        game_session = get_object_or_404(RetroGameSession, session_key=session_key)
        game_state, _ = RetroGameState.objects.get_or_create(session=game_session)
        
        data = {
            'level': game_session.current_level,
            'diamonds': game_session.diamonds,
            'lives': game_session.lives,
            'score': game_session.score,
            'playerX': game_session.player_x,
            'playerY': game_session.player_y,
            'robotsDefeated': game_state.get_robots_defeated(),
            'diamondsCollected': game_state.get_diamonds_collected(),
            'bossDefeated': game_state.boss_defeated,
            'levelCompleted': game_state.level_completed
        }
        
        return JsonResponse(data)
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def submit_high_score(request):
    """API endpoint to submit high score"""
    try:
        data = json.loads(request.body)
        player_name = data.get('player_name', 'Anonymous')
        score = data.get('score', 0)
        level_reached = data.get('level_reached', 1)
        
        high_score = RetroHighScore.objects.create(
            user=request.user if request.user.is_authenticated else None,
            player_name=player_name,
            score=score,
            level_reached=level_reached
        )
        
        return JsonResponse({
            'success': True,
            'rank': RetroHighScore.objects.filter(score__gt=score).count() + 1
        })
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def high_scores(request):
    """API endpoint to get high scores"""
    scores = RetroHighScore.objects.all()[:10]  # Top 10 scores
    scores_data = [
        {
            'player_name': score.player_name,
            'score': score.score,
            'level_reached': score.level_reached,
            'created_at': score.created_at.isoformat()
        }
        for score in scores
    ]
    return JsonResponse({'high_scores': scores_data})

def leaderboard(request):
    """Leaderboard page"""
    high_scores = RetroHighScore.objects.all()[:20]  # Top 20 scores
    return render(request, 'retro_platform_fighter/leaderboard.html', {'high_scores': high_scores})

@csrf_exempt
@require_http_methods(["POST"])
def reset_game(request):
    """API endpoint to reset game session"""
    try:
        session_key = request.session.session_key
        
        if session_key:
            RetroGameSession.objects.filter(session_key=session_key).delete()
        
        return JsonResponse({'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
