from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from games.retro_platform_fighter.models import RetroGameSession, RetroHighScore
from django.contrib.sessions.models import Session

class Command(BaseCommand):
    help = 'Clean up old game sessions and expired data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to keep sessions (default: 7)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff_date = timezone.now() - timedelta(days=days)

        self.stdout.write(f"Cleaning up data older than {days} days ({cutoff_date})")

        # Clean up old game sessions
        old_sessions = RetroGameSession.objects.filter(updated_at__lt=cutoff_date)
        session_count = old_sessions.count()

        if dry_run:
            self.stdout.write(f"Would delete {session_count} old game sessions")
        else:
            deleted_sessions, _ = old_sessions.delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted {deleted_sessions} old game sessions")
            )

        # Clean up expired Django sessions
        expired_sessions = Session.objects.filter(expire_date__lt=timezone.now())
        expired_count = expired_sessions.count()

        if dry_run:
            self.stdout.write(f"Would delete {expired_count} expired Django sessions")
        else:
            deleted_expired, _ = expired_sessions.delete()
            self.stdout.write(
                self.style.SUCCESS(f"Deleted {deleted_expired} expired Django sessions")
            )

        # Keep only top high scores (configurable limit)
        from django.conf import settings
        max_scores = getattr(settings, 'MAX_HIGH_SCORES', 100)
        
        total_scores = RetroHighScore.objects.count()
        if total_scores > max_scores:
            excess_scores = total_scores - max_scores
            old_scores = RetroHighScore.objects.order_by('score')[0:excess_scores]
            
            if dry_run:
                self.stdout.write(f"Would delete {excess_scores} low high scores")
            else:
                for score in old_scores:
                    score.delete()
                self.stdout.write(
                    self.style.SUCCESS(f"Deleted {excess_scores} low high scores")
                )

        if dry_run:
            self.stdout.write(
                self.style.WARNING("This was a dry run. No data was actually deleted.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Cleanup completed successfully!")
            )
