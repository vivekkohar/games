from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import cache_page
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone
from django.contrib.sessions.models import Session
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
        
        # Check if session is expired
        if game_session.updated_at < timezone.now() - timedelta(seconds=getattr(settings, 'GAME_SESSION_TIMEOUT', 3600)):
            # Reset expired session
            game_session.current_level = 1
            game_session.diamonds = 50
            game_session.lives = 3
            game_session.score = 0
            game_session.player_x = 100
            game_session.player_y = 500
            game_session.save()
            logger.info(f"Reset expired game session: {session_key}")
        
        # Get or create game state
        game_state, _ = RetroGameState.objects.get_or_create(session=game_session)
        
        context = {
            'game_session': game_session,
            'game_state': game_state
        }
        return render(request, 'retro_platform_fighter/game.html', context)
    
    except Exception as e:
        logger.error(f"Error in game_view: {str(e)}")
        return render(request, 'retro_platform_fighter/error.html', {'error': 'Game initialization failed'})

@csrf_exempt
@require_http_methods(["POST"])
def save_game_state(request):
    """API endpoint to save game state"""
    try:
        # Validate request
        if not request.body:
            return JsonResponse({'error': 'Empty request body'}, status=400)
        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        session_key = request.session.session_key
        if not session_key:
            return JsonResponse({'error': 'No session found'}, status=400)
        
        game_session = get_object_or_404(RetroGameSession, session_key=session_key)
        
        # Validate and sanitize input data
        level = data.get('level', game_session.current_level)
        diamonds = data.get('diamonds', game_session.diamonds)
        lives = data.get('lives', game_session.lives)
        score = data.get('score', game_session.score)
        player_x = data.get('playerX', game_session.player_x)
        player_y = data.get('playerY', game_session.player_y)
        
        # Validate ranges
        if not (1 <= level <= 10):
            return JsonResponse({'error': 'Invalid level'}, status=400)
        if not (0 <= diamonds <= 1000):
            return JsonResponse({'error': 'Invalid diamonds count'}, status=400)
        if not (0 <= lives <= 10):
            return JsonResponse({'error': 'Invalid lives count'}, status=400)
        if not (0 <= score <= 1000000):
            return JsonResponse({'error': 'Invalid score'}, status=400)
        if not (-1000 <= player_x <= 2000):
            return JsonResponse({'error': 'Invalid player X position'}, status=400)
        if not (-1000 <= player_y <= 2000):
            return JsonResponse({'error': 'Invalid player Y position'}, status=400)
        
        # Update game session
        game_session.current_level = level
        game_session.diamonds = diamonds
        game_session.lives = lives
        game_session.score = score
        game_session.player_x = player_x
        game_session.player_y = player_y
        game_session.save()
        
        # Update game state
        game_state, _ = RetroGameState.objects.get_or_create(session=game_session)
        
        if 'robotsDefeated' in data:
            robots_defeated = data['robotsDefeated']
            if isinstance(robots_defeated, list) and len(robots_defeated) <= 100:
                game_state.set_robots_defeated(robots_defeated)
        
        if 'diamondsCollected' in data:
            diamonds_collected = data['diamondsCollected']
            if isinstance(diamonds_collected, list) and len(diamonds_collected) <= 100:
                game_state.set_diamonds_collected(diamonds_collected)
        
        game_state.boss_defeated = bool(data.get('bossDefeated', game_state.boss_defeated))
        game_state.level_completed = bool(data.get('levelCompleted', game_state.level_completed))
        game_state.save()
        
        logger.info(f"Game state saved for session: {session_key}")
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
        # Rate limiting check (simple implementation)
        session_key = request.session.session_key
        if session_key:
            recent_submissions = RetroHighScore.objects.filter(
                created_at__gte=timezone.now() - timedelta(minutes=1)
            ).count()
            if recent_submissions >= 5:
                return JsonResponse({'error': 'Too many submissions. Please wait.'}, status=429)
        
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        # Validate and sanitize input
        player_name = data.get('player_name', 'Anonymous')[:getattr(settings, 'PLAYER_NAME_MAX_LENGTH', 50)]
        score = data.get('score', 0)
        level_reached = data.get('level_reached', 1)
        
        # Validate ranges
        if not (0 <= score <= 1000000):
            return JsonResponse({'error': 'Invalid score'}, status=400)
        if not (1 <= level_reached <= 10):
            return JsonResponse({'error': 'Invalid level'}, status=400)
        
        # Sanitize player name
        import re
        player_name = re.sub(r'[^\w\s-]', '', player_name).strip()
        if not player_name:
            player_name = 'Anonymous'
        
        # Check if we've reached max high scores limit
        max_scores = getattr(settings, 'MAX_HIGH_SCORES', 100)
        if RetroHighScore.objects.count() >= max_scores:
            # Remove lowest score if new score is higher
            lowest_score = RetroHighScore.objects.order_by('score').first()
            if lowest_score and score > lowest_score.score:
                lowest_score.delete()
            elif score <= lowest_score.score:
                return JsonResponse({'error': 'Score too low for leaderboard'}, status=400)
        
        high_score = RetroHighScore.objects.create(
            user=request.user if request.user.is_authenticated else None,
            player_name=player_name,
            score=score,
            level_reached=level_reached
        )
        
        rank = RetroHighScore.objects.filter(score__gt=score).count() + 1
        
        logger.info(f"High score submitted: {player_name} - {score} points")
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
        scores = RetroHighScore.objects.select_related('user').all()[:20]  # Top 20 scores
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
        high_scores = RetroHighScore.objects.select_related('user').all()[:20]  # Top 20 scores
        return render(request, 'retro_platform_fighter/leaderboard.html', {'high_scores': high_scores})
    except Exception as e:
        logger.error(f"Error in leaderboard view: {str(e)}")
        return render(request, 'retro_platform_fighter/error.html', {'error': 'Failed to load leaderboard'})

@csrf_exempt
@require_http_methods(["POST"])
def reset_game(request):
    """API endpoint to reset game session"""
    try:
        session_key = request.session.session_key
        
        if session_key:
            deleted_count, _ = RetroGameSession.objects.filter(session_key=session_key).delete()
            logger.info(f"Reset game session: {session_key} (deleted {deleted_count} records)")
        
        return JsonResponse({'success': True})
    
    except Exception as e:
        logger.error(f"Error resetting game: {str(e)}")
        return JsonResponse({'error': 'Failed to reset game'}, status=500)
