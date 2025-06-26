# 🚀 Production Deployment Checklist

This checklist ensures your Retro Games Collection is production-ready.

## ✅ Security Configuration

### Environment Variables
- [ ] Create `.env` file from `.env.example`
- [ ] Set `DEBUG=False` in production
- [ ] Generate and set a strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain(s)
- [ ] Set `CSRF_TRUSTED_ORIGINS` with your domain(s)
- [ ] Configure `CORS_ALLOWED_ORIGINS` if needed

### Database Security
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Set strong database credentials
- [ ] Enable SSL for database connections
- [ ] Configure database connection pooling

### HTTPS and SSL
- [ ] Enable SSL/TLS certificates
- [ ] Set `SECURE_SSL_REDIRECT=True`
- [ ] Configure HSTS headers
- [ ] Test SSL configuration

## ✅ Performance Optimization

### Static Files
- [ ] Run `python manage.py collectstatic`
- [ ] Configure CDN for static files (optional)
- [ ] Enable gzip compression
- [ ] Set proper cache headers

### Database
- [ ] Run all migrations: `python manage.py migrate`
- [ ] Create database indexes if needed
- [ ] Set up database backups
- [ ] Configure connection pooling

### Caching
- [ ] Create cache table: `python manage.py createcachetable`
- [ ] Configure Redis for caching (optional)
- [ ] Enable view caching where appropriate

## ✅ Monitoring and Logging

### Error Tracking
- [ ] Configure Sentry for error tracking
- [ ] Set up email notifications for errors
- [ ] Configure log rotation
- [ ] Set up monitoring dashboards

### Health Checks
- [ ] Test health check endpoint: `/health/`
- [ ] Set up uptime monitoring
- [ ] Configure alerting for downtime

## ✅ Deployment Process

### Pre-deployment
- [ ] Run security check: `python manage.py check --deploy`
- [ ] Run tests (if available)
- [ ] Backup current database
- [ ] Review code changes

### Deployment
- [ ] Deploy code to production server
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic`
- [ ] Restart application server

### Post-deployment
- [ ] Test critical functionality
- [ ] Check error logs
- [ ] Verify health check endpoint
- [ ] Monitor performance metrics

## ✅ Server Configuration

### Web Server
- [ ] Configure Nginx/Apache as reverse proxy
- [ ] Set up SSL termination
- [ ] Configure rate limiting
- [ ] Set up log rotation

### Application Server
- [ ] Use Gunicorn with multiple workers
- [ ] Configure worker timeout settings
- [ ] Set up process monitoring (systemd/supervisor)
- [ ] Configure graceful shutdowns

### System Security
- [ ] Keep OS and packages updated
- [ ] Configure firewall rules
- [ ] Set up fail2ban for brute force protection
- [ ] Regular security audits

## ✅ Backup and Recovery

### Database Backups
- [ ] Set up automated daily backups
- [ ] Test backup restoration process
- [ ] Store backups in secure location
- [ ] Configure backup retention policy

### Application Backups
- [ ] Backup media files
- [ ] Backup configuration files
- [ ] Document recovery procedures
- [ ] Test disaster recovery plan

## ✅ Maintenance Tasks

### Regular Maintenance
- [ ] Set up automated cleanup: `python manage.py cleanup_old_sessions`
- [ ] Monitor disk space usage
- [ ] Review and rotate logs
- [ ] Update dependencies regularly

### Performance Monitoring
- [ ] Monitor response times
- [ ] Track database query performance
- [ ] Monitor memory and CPU usage
- [ ] Set up alerts for performance issues

## 🚀 Deployment Commands

### Initial Deployment
```bash
# 1. Set up environment
conda activate gamer
cp .env.example .env
# Edit .env with production values

# 2. Deploy
./deploy.sh

# 3. Start production server
./start_production.sh
```

### Regular Updates
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy updates
git pull origin main
./deploy.sh

# 3. Restart server
sudo systemctl restart retro-games
```

## 📊 Monitoring URLs

- Health Check: `https://yourdomain.com/health/`
- Admin Panel: `https://yourdomain.com/admin/`
- Game: `https://yourdomain.com/retro_platform_fighter/`
- Leaderboard: `https://yourdomain.com/retro_platform_fighter/leaderboard/`

## 🔧 Troubleshooting

### Common Issues
1. **Static files not loading**: Run `collectstatic` and check STATIC_ROOT
2. **Database connection errors**: Verify DATABASE_URL and network connectivity
3. **CSRF errors**: Check CSRF_TRUSTED_ORIGINS configuration
4. **Performance issues**: Monitor database queries and enable caching

### Log Locations
- Application logs: `logs/django.log`
- Gunicorn logs: Check systemd journal or configured log files
- Nginx/Apache logs: `/var/log/nginx/` or `/var/log/apache2/`

## 📞 Support

For production support:
- Check logs first: `tail -f logs/django.log`
- Use health check endpoint: `/health/`
- Review this checklist for missed configurations
- Check Django deployment documentation
