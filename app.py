#app.py
from flask import Flask, redirect, url_for, render_template, request, jsonify, flash
import os
from config import Config
from models import db, User
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
from flask_migrate import Migrate
from flask_mail import Mail
from celery import Celery, Task as CeleryTask

def make_celery(app):
    class FlaskTask(CeleryTask):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.import_name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config, namespace="CELERY")
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # E-POSTA YAPILANDIRMASI
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME') # Ortam değişkeninden oku
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD') # Ortam değişkeninden oku
    app.config['MAIL_DEFAULT_SENDER'] = ('Görev Yöneticisi', os.environ.get('MAIL_USERNAME'))

    # CELERY YAPILANDIRMASI
    app.config['CELERY_BROKER_URL'] = 'redis://localhost:6379/0'
    app.config['CELERY_RESULT_BACKEND'] = 'redis://localhost:6379/0'
    app.config['CELERY_IMPORTS'] = ('tasks',)

    db.init_app(app)
    migrate = Migrate(app, db)

    login_manager = LoginManager()
    login_manager.login_view = "auth.login" 
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Blueprints
    from auth.routes import auth_bp
    from dashboard.routes import dashboard_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")

    @app.route("/")
    def index():
        if current_user.is_authenticated:
            return redirect(url_for("dashboard.home"))
        return redirect(url_for("auth.welcome"))

    return app

app = create_app()
mail = Mail(app)
celery = make_celery(app)

@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    import tasks # tasks.py dosyasını import et
    # Her saat başı send_reminder_emails görevini çalıştır
    sender.add_periodic_task(
        3600.0, 
        tasks.send_reminder_emails.s(), 
        name='Her saat başı hatırlatıcıları kontrol et'
    )