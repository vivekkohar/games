from django.db import migrations

def add_default_games(apps, schema_editor):
    Game = apps.get_model('games_manager', 'Game')
    
    # Add Retro Platform Fighter
    Game.objects.create(
        name='Retro Platform Fighter',
        slug='retro-platform-fighter',
        description='A classic 2D platformer game with combat mechanics, diamond collection, and boss battles. Fight your way through 5 progressive levels, defeat robots, and collect diamonds to survive!',
        url_path='retro_platform_fighter/',
        is_active=True
    )
    
    # Add Tetris (coming soon)
    Game.objects.create(
        name='Tetris',
        slug='tetris',
        description='The classic block-stacking puzzle game. Arrange falling blocks to create complete lines.',
        url_path='tetris/',
        is_active=False
    )
    
    # Add Snake (coming soon)
    Game.objects.create(
        name='Snake',
        slug='snake',
        description='Control a growing snake, eat food, and avoid collisions in this classic arcade game.',
        url_path='snake/',
        is_active=False
    )

def remove_default_games(apps, schema_editor):
    Game = apps.get_model('games_manager', 'Game')
    Game.objects.filter(slug__in=['retro-platform-fighter', 'tetris', 'snake']).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('games_manager', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_default_games, remove_default_games),
    ]
