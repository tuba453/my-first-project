# config.py
import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me'
    # Bu satır sadece yerel geliştirme için bir yedektir. Render'da app.py tarafından ezilecektir.
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'notes.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
