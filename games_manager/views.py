from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import connection
from .models import Game
import logging

logger = logging.getLogger(__name__)

def index(request):
    """Main page with list of available games"""
    try:
        games = Game.objects.filter(is_active=True).order_by('name')
        return render(request, 'games_manager/index.html', {'games': games})
    except Exception as e:
        logger.error(f"Error in index view: {str(e)}")
        return render(request, 'games_manager/index.html', {'games': [], 'error': 'Failed to load games'})

def about(request):
    """About page"""
    return render(request, 'games_manager/about.html')

@require_http_methods(["GET"])
def health_check(request):
    """Simple health check endpoint"""
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Check if games are available
        game_count = Game.objects.filter(is_active=True).count()
        
        return JsonResponse({
            'status': 'healthy',
            'database': 'connected',
            'active_games': game_count
        })
    
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
