from django.urls import path
from . import views

app_name = 'games_manager'

urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('health/', views.health_check, name='health_check'),
]
