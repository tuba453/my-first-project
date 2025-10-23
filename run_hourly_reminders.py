# c:\Users\Teracity\Desktop\task_manager\run_hourly_reminders.py
import os
from app import create_app
from tasks import send_reminder_emails

# Flask uygulama bağlamını oluştur
app = create_app()
app.app_context().push()

# Celery görevini çağır
# .delay() görevi Celery broker'ına gönderir
send_reminder_emails.delay()

# Uygulama bağlamını kapat (isteğe bağlı ama iyi bir pratik)
app.app_context().pop()
