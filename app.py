#app.py
from flask import Flask, redirect, url_for, render_template, request, jsonify, flash
import os
from config import Config
from models import db, User
from flask_login import LoginManager, current_user, login_user, logout_user, login_required
from flask_migrate import Migrate
from flask_mail import Mail
from celery import Celery, Task as CeleryTask


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # VERİTABANI YAPILANDIRMASI: Render ortamı için önceliklendir
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        # Render'ın "postgres://" ile başlayan URL'sini SQLAlchemy'nin beklediği "postgresql://" formatına çevir.
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    
    # GÜVENLİ DEBUG LOGLARI: Parolayı göstermeden bağlantı dizesini kontrol et
    final_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
    if final_uri:
        # Parolayı gizlemek için URI'yi parçala ve yeniden birleştir
        safe_uri = final_uri.split('@')[0].rsplit(':', 1)[0] + '@' + final_uri.split('@')[1] if '@' in final_uri else final_uri
        print(f"DEBUG: Final SQLALCHEMY_DATABASE_URI (güvenli): {safe_uri}")
    else:
        print("DEBUG: Final SQLALCHEMY_DATABASE_URI bulunamadı!")
        
    # E-POSTA YAPILANDIRMASI
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME') # Ortam değişkeninden oku
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD') # Ortam değişkeninden oku
    app.config['MAIL_DEFAULT_SENDER'] = ('Görev Yöneticisi', os.environ.get('MAIL_USERNAME'))

    # CELERY YAPILANDIRMASI
    app.config.update(
        CELERY_BROKER_URL=os.environ.get('CELERY_BROKER_URL'),
        CELERY_RESULT_BACKEND=os.environ.get('CELERY_RESULT_BACKEND')
    )

    db.init_app(app)
    migrate = Migrate(app, db)
    Mail(app) # Mail nesnesini burada başlat

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

app = create_app()
celery = make_celery(app)