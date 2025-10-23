from celery import shared_task
from flask_mail import Message
from datetime import datetime, timedelta
from flask import current_app
from models import db, Task, User

@shared_task(ignore_result=True)
def send_reminder_emails():
    """
    Vadesi 24 saat içinde dolacak olan ve henüz hatırlatma gönderilmemiş görevleri bulup e-posta gönderir.
    """
    # DÜZELTME: Doğrudan import etmek yerine, 'current_app' proxy'sini kullan.
    app = current_app
    with app.app_context():
        now = datetime.utcnow()
        reminder_window = now + timedelta(hours=24)

        tasks_to_remind = Task.query.filter(
            Task.due_date.isnot(None),
            Task.due_date <= reminder_window,
            Task.due_date > now,
            Task.completed == False,
            Task.reminded == False 
        ).all()

        if not tasks_to_remind:
            print(f"[{now}] Hatırlatılacak görev bulunamadı.")
            return

        print(f"[{now}] {len(tasks_to_remind)} adet görev için hatırlatma gönderiliyor...")

        for task in tasks_to_remind:
            try:
                # DÜZELTME: 'mail' nesnesini app'in eklentilerinden al.
                mail = app.extensions.get('mail')
                if not mail:
                    print("Flask-Mail eklentisi bulunamadı.")
                    continue
                msg = Message(
                    subject=f"Yaklaşan Görev Hatırlatması: {task.title}",
                    recipients=[task.user.email],
                    body=f"Merhaba {task.user.username},\n\n'{task.title}' başlıklı görevinizin son teslim tarihi yaklaşıyor: {task.due_date.strftime('%d-%m-%Y %H:%M')}.\n\nLütfen görevinizi zamanında tamamlamayı unutmayın.\n\nİyi çalışmalar!"
                )
                mail.send(msg)
                task.reminded = True
                db.session.commit() # Her başarılı gönderimden sonra kaydet
                print(f"E-posta gönderildi: {task.user.email} - Görev: {task.title}")
            except Exception as e:
                db.session.rollback() # Hata durumunda işlemi geri al
                print(f"E-posta gönderilirken hata oluştu: {e}")