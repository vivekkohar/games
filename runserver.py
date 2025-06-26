import os
import sys

from retro_game_web.wsgi import application

if __name__ == '__main__':
    from gunicorn.app.wsgiapp import run
    
    sys.argv = ['gunicorn', 'retro_game_web.wsgi:application', '--bind=0.0.0.0:' + os.environ.get('PORT', '8000')]
    run()
