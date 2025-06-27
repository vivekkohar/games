from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseServerError
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import cache_page, never_cache
from django.views.decorators.vary import vary_on_cookie
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie, csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db import transaction
from django.core.cache import cache
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.conf import settings
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db.models import F, Q, Count, Max, Min, Sum
from ratelimit import limits, sleep_and_retry
from .models import RetroGameSession, RetroHighScore, RetroGameState
import json
import logging
import re
from datetime import timedelta, datetime
from typing import Dict, Any, List, Optional, Union
from functools import wraps
import hashlib
import hmac
import time

logger = logging.getLogger(__name__)

# Rate limiting settings
RATE_LIMIT = 100  # 100 requests
RATE_LIMIT_PERIOD = 60  # per minute

# Create a rate limiter function
def get_ratelimit_key(group, request):
    return request.META.get('REMOTE_ADDR', '127.0.0.1')

# Rate limit decorator
def rate_limited_view(view_func):
    """Decorator to add rate limiting to a view."""
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Get the client's IP address
        ip = get_ratelimit_key('api', request)
        
        # Create a cache key
        cache_key = f'ratelimit:{ip}'
        
        # Get current count and last reset time
        now = time.time()
        current = cache.get(cache_key, {'count': 0, 'reset_at': now + RATE_LIMIT_PERIOD})
        
        # Check if we need to reset the counter
        if now > current['reset_at']:
            current = {'count': 0, 'reset_at': now + RATE_LIMIT_PERIOD}
        
        # Check rate limit
        if current['count'] >= RATE_LIMIT:
            return JsonResponse(
                {'error': 'Request was throttled. Please try again later.'},
                status=429,
                headers={'Retry-After': str(int(current['reset_at'] - now))}
            )
            
        # Increment the counter
        current['count'] += 1
        cache.set(cache_key, current, timeout=int(current['reset_at'] - now))
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view

# Moved to the top with other imports

@method_decorator(never_cache, name='dispatch')
class IndexView(View):
    """Retro Platform Fighter game landing page."""
    
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        """Handle GET request for the index page.

        Returns:
            Rendered template with CSRF token
        """
        return render(request, 'retro_platform_fighter/index.html')

@method_decorator(ensure_csrf_cookie, name='dispatch')
class GameView(View):
    """Game canvas page with session management."""
    
    def get(self, request):
        """Handle GET request for the game page.

        Returns:
            Rendered game template with session data or error page
        """
        try:
            # Prevent session fixation
            if not request.session.session_key:
                request.session.create()
            else:
                request.session.cycle_key()
                
            session_key = request.session.session_key
            
            with transaction.atomic():
                # Use select_for_update to prevent race conditions
                game_session, created = RetroGameSession.objects.select_for_update().get_or_create(
                    session_key=session_key,
                    defaults={
                        'current_level': 1,
                        'diamonds': 50,
                        'lives': 3,
                        'score': 0,
                        'player_x': 100.0,
                        'player_y': 500.0,
                        'user': request.user if request.user.is_authenticated else None
                    }
                )
                
                # Get or create game state with select_related for performance
                game_state, _ = RetroGameState.objects.select_related('session').get_or_create(
                    session=game_session,
                    defaults={
                        'robots_defeated': [],
                        'diamonds_collected': [],
                        'boss_defeated': False,
                        'level_completed': False
                    }
                )
            
            context = {
                'game_session': game_session,
                'game_state': game_state,
                'debug': settings.DEBUG
            }
            
            # Set secure cookie flags in production
            response = render(request, 'retro_platform_fighter/game.html', context)
            if not settings.DEBUG:
                response.set_cookie(
                    'sessionid', 
                    secure=True, 
                    httponly=True, 
                    samesite='Lax',
                    max_age=60 * 60 * 24 * 30  # 30 days
                )
            return response
            
        except Exception as e:
            logger.error(f"Error in GameView: {str(e)}", exc_info=True)
            return render(
                request, 
                'retro_platform_fighter/error.html',
                {'error': 'Failed to initialize game session'},
                status=500
            )

class SaveGameStateView(View):
    """API endpoint to save game state with transaction support."""
    
    @method_decorator(csrf_protect)
    @method_decorator(rate_limited_view)
    @method_decorator(require_http_methods(["POST"]))
    def post(self, request):
        """
        Handle POST request to save game state.
        
        Request body should contain:
            - level: Current level (1-10)
            - diamonds: Number of diamonds (0-1000)
            - lives: Number of lives (0-10)
            - score: Current score (0-1000000)
            - playerX: Player's X position
            - playerY: Player's Y position
            - robotsDefeated: List of defeated robot IDs
            - diamondsCollected: List of collected diamond IDs
            - bossDefeated: Boolean indicating if boss is defeated
            - levelCompleted: Boolean indicating if level is completed
            
        Returns:
            JSON response with success status or error message
        """
        try:
            # Validate session
            if not request.session.session_key:
                return JsonResponse(
                    {'error': 'Invalid session'}, 
                    status=401
                )
                
            # Parse and validate request data
            try:
                data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.warning(f"Invalid JSON in save_game_state: {str(e)}")
                return JsonResponse(
                    {'error': 'Invalid JSON data'}, 
                    status=400
                )
                
            # Start transaction
            with transaction.atomic():
                # Get or create game session with row-level locking
                game_session = RetroGameSession.objects.select_for_update().get(
                    session_key=request.session.session_key
                )
                
                # Update game session with validation
                self._update_game_session(game_session, data)
                
                # Update game state
                game_state, _ = RetroGameState.objects.select_for_update().get_or_create(
                    session=game_session,
                    defaults={'robots_defeated': [], 'diamonds_collected': []}
                )
                self._update_game_state(game_state, data)
                
                # Save changes
                game_session.save()
                game_state.save()
                
                # Update cache
                cache_key = f'game_state_{game_session.id}'
                cache.set(cache_key, {
                    'level': game_session.current_level,
                    'score': game_session.score,
                    'diamonds': game_session.diamonds,
                    'lives': game_session.lives,
                    'updated_at': timezone.now().isoformat()
                }, timeout=60 * 60 * 24)  # Cache for 24 hours
                
                return JsonResponse({'success': True})
                
        except RetroGameSession.DoesNotExist:
            return JsonResponse(
                {'error': 'Game session not found'}, 
                status=404
            )
        except Exception as e:
            logger.error(f"Error in save_game_state: {str(e)}", exc_info=True)
            return JsonResponse(
                {'error': 'Internal server error'}, 
                status=500
            )
    
    def _update_game_session(self, game_session: RetroGameSession, data: Dict[str, Any]) -> None:
        """Update game session with validated data."""
        if 'level' in data and 1 <= data['level'] <= 10:
            game_session.current_level = data['level']
        if 'diamonds' in data and 0 <= data['diamonds'] <= 1000:
            game_session.diamonds = data['diamonds']
        if 'lives' in data and 0 <= data['lives'] <= 10:
            game_session.lives = data['lives']
        if 'score' in data and 0 <= data['score'] <= 1000000:
            game_session.score = data['score']
        if 'playerX' in data:
            game_session.player_x = float(data['playerX'])
        if 'playerY' in data:
            game_session.player_y = float(data['playerY'])
    
    def _update_game_state(self, game_state: 'RetroGameState', data: Dict[str, Any]) -> None:
        """Update game state with validated data."""
        if 'robotsDefeated' in data and isinstance(data['robotsDefeated'], list):
            game_state.set_robots_defeated(data['robotsDefeated'])
        if 'diamondsCollected' in data and isinstance(data['diamondsCollected'], list):
            game_state.set_diamonds_collected(data['diamondsCollected'])
        if 'bossDefeated' in data and isinstance(data['bossDefeated'], bool):
            game_state.boss_defeated = data['bossDefeated']
        if 'levelCompleted' in data and isinstance(data['levelCompleted'], bool):
            game_state.level_completed = data['levelCompleted']

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

class SubmitHighScoreView(View):
    """API endpoint to submit and process high scores with rate limiting."""
    
    MAX_SCORE = 1000000
    MAX_PLAYER_NAME_LENGTH = 50
    
    @method_decorator(csrf_protect)
    @method_decorator(rate_limited_view)
    @method_decorator(require_http_methods(["POST"]))
    def post(self, request):
        """
        Handle POST request to submit a high score.
        
        Request body should contain:
            - player_name: Display name (1-50 chars)
            - score: Score value (0-1000000)
            - level_reached: Level reached (1-10)
            
        Returns:
            JSON response with rank and success status or error message
        """
        try:
            # Parse and validate request data
            try:
                data = json.loads(request.body.decode('utf-8'))
            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.warning(f"Invalid JSON in submit_high_score: {str(e)}")
                return JsonResponse(
                    {'error': 'Invalid JSON data'}, 
                    status=400
                )
                
            # Validate input
            validation_errors = self._validate_high_score_data(data)
            if validation_errors:
                return JsonResponse(
                    {'error': 'Validation failed', 'details': validation_errors}, 
                    status=400
                )
                
            # Process high score in transaction
            with transaction.atomic():
                # Clean and prepare data
                player_name = self._clean_player_name(data.get('player_name', 'Anonymous'))
                score = int(data['score'])
                level_reached = int(data.get('level_reached', 1))
                
                # Create high score
                high_score = RetroHighScore.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    player_name=player_name,
                    score=score,
                    level_reached=level_reached
                )
                
                # Calculate rank efficiently
                rank = RetroHighScore.objects.filter(score__gt=score).count() + 1
                
                # Update leaderboard cache
                self._update_leaderboard_cache()
                
                return JsonResponse({
                    'success': True,
                    'rank': rank,
                    'player_name': player_name,
                    'score': score,
                    'level_reached': level_reached
                })
                
        except Exception as e:
            logger.error(f"Error in submit_high_score: {str(e)}", exc_info=True)
            return JsonResponse(
                {'error': 'Internal server error'}, 
                status=500
            )
    
    def _validate_high_score_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate high score submission data."""
        errors = []
        
        # Validate score
        try:
            score = int(data.get('score', 0))
            if not (0 <= score <= self.MAX_SCORE):
                errors.append(f'Score must be between 0 and {self.MAX_SCORE}')
        except (ValueError, TypeError):
            errors.append('Invalid score format')
            
        # Validate level_reached
        try:
            level = int(data.get('level_reached', 1))
            if not (1 <= level <= 10):
                errors.append('Level must be between 1 and 10')
        except (ValueError, TypeError):
            errors.append('Invalid level format')
            
        # Validate player_name
        player_name = data.get('player_name', '')
        if not isinstance(player_name, str) or not player_name.strip():
            player_name = 'Anonymous'
        elif len(player_name) > self.MAX_PLAYER_NAME_LENGTH:
            errors.append(f'Player name must be {self.MAX_PLAYER_NAME_LENGTH} characters or less')
            
        return errors
    
    def _clean_player_name(self, name: str) -> str:
        """Clean and sanitize player name."""
        if not name or not isinstance(name, str):
            return 'Anonymous'
            
        # Remove potentially dangerous characters
        name = re.sub(r'[^\w\s\-\'\"]', '', name).strip()
        return name[:self.MAX_PLAYER_NAME_LENGTH] or 'Anonymous'
    
    def _update_leaderboard_cache(self) -> None:
        """Update the leaderboard cache with fresh data."""
        cache_key = 'leaderboard_top_10'
        top_scores = list(RetroHighScore.objects
            .order_by('-score', 'created_at')
            .values('player_name', 'score', 'level_reached', 'created_at')
            [:10])
        
        # Cache for 5 minutes
        cache.set(cache_key, top_scores, timeout=300)

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
