from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import cache_page
from django.utils import timezone
from .models import RetroGameSession, RetroHighScore, RetroGameState
import json
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)

def index(request):
    """Retro Platform Fighter game landing page"""
    return render(request, 'retro_platform_fighter/index.html')

def game_view(request):
    """Game canvas page"""
    try:
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
    
    except Exception as e:
        logger.error(f"Error in game_view: {str(e)}")
        return render(request, 'retro_platform_fighter/index.html', {'error': 'Game initialization failed'})

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
        
        # Update game session with basic validation
        if 'level' in data and 1 <= data['level'] <= 10:
            game_session.current_level = data['level']
        if 'diamonds' in data and 0 <= data['diamonds'] <= 1000:
            game_session.diamonds = data['diamonds']
        if 'lives' in data and 0 <= data['lives'] <= 10:
            game_session.lives = data['lives']
        if 'score' in data and 0 <= data['score'] <= 1000000:
            game_session.score = data['score']
        if 'playerX' in data:
            game_session.player_x = data['playerX']
        if 'playerY' in data:
            game_session.player_y = data['playerY']
        
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
        logger.error(f"Error saving game state: {str(e)}")
        return JsonResponse({'error': 'Failed to save game state'}, status=500)

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
        logger.error(f"Error loading game state: {str(e)}")
        return JsonResponse({'error': 'Failed to load game state'}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def submit_high_score(request):
    """API endpoint to submit high score"""
    try:
        data = json.loads(request.body)
        
        # Basic validation
        player_name = data.get('player_name', 'Anonymous')[:50]
        score = data.get('score', 0)
        level_reached = data.get('level_reached', 1)
        
        if not (0 <= score <= 1000000):
            return JsonResponse({'error': 'Invalid score'}, status=400)
        if not (1 <= level_reached <= 10):
            return JsonResponse({'error': 'Invalid level'}, status=400)
        
        # Clean player name
        import re
        player_name = re.sub(r'[^\w\s-]', '', player_name).strip()
        if not player_name:
            player_name = 'Anonymous'
        
        high_score = RetroHighScore.objects.create(
            user=request.user if request.user.is_authenticated else None,
            player_name=player_name,
            score=score,
            level_reached=level_reached
        )
        
        rank = RetroHighScore.objects.filter(score__gt=score).count() + 1
        
        return JsonResponse({
            'success': True,
            'rank': rank,
            'player_name': player_name
        })
    
    except Exception as e:
        logger.error(f"Error submitting high score: {str(e)}")
        return JsonResponse({'error': 'Failed to submit high score'}, status=500)

@cache_page(60 * 5)  # Cache for 5 minutes
@require_http_methods(["GET"])
def high_scores(request):
    """API endpoint to get high scores"""
    try:
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
    
    except Exception as e:
        logger.error(f"Error fetching high scores: {str(e)}")
        return JsonResponse({'error': 'Failed to fetch high scores'}, status=500)

def leaderboard(request):
    """Leaderboard page"""
    try:
        high_scores = RetroHighScore.objects.all()[:20]  # Top 20 scores
        return render(request, 'retro_platform_fighter/leaderboard.html', {'high_scores': high_scores})
    except Exception as e:
        logger.error(f"Error in leaderboard view: {str(e)}")
        return render(request, 'retro_platform_fighter/index.html', {'error': 'Failed to load leaderboard'})

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
        logger.error(f"Error resetting game: {str(e)}")
        return JsonResponse({'error': 'Failed to reset game'}, status=500)
