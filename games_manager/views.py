from django.shortcuts import render
from .models import Game

def index(request):
    """Main page with list of available games"""
    games = Game.objects.filter(is_active=True).order_by('name')
    return render(request, 'games_manager/index.html', {'games': games})

def about(request):
    """About page"""
    return render(request, 'games_manager/about.html')
