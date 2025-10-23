# models.py (DB hatasını gidermek için kontrol edildi)
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    # ... (User modelinin geri kalanı aynı) ...
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=False, unique=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    notes_deleted_count = db.Column(db.Integer, default=0) # YENİ: Silinen not sayacı
    avatar = db.Column(db.String(100), nullable=True) # YENİ: Kullanıcı avatarı dosya adı

    notes = db.relationship('Note', backref='user', cascade="all, delete-orphan")
    tasks = db.relationship('Task', backref='user', cascade="all, delete-orphan")
    badges = db.relationship('Badge', secondary='user_badges', lazy='subquery', backref=db.backref('users', lazy=True))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# ÇOKTAN-ÇOĞA İLİŞKİ TABLOLARI
note_tags = db.Table('note_tags',
    db.Column('note_id', db.Integer, db.ForeignKey('note.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

task_tags = db.Table('task_tags',
    db.Column('task_id', db.Integer, db.ForeignKey('task.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

user_badges = db.Table('user_badges',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('badge_id', db.Integer, db.ForeignKey('badge.id'), primary_key=True),
    db.Column('earned_at', db.DateTime, default=datetime.utcnow)
)



class Note(db.Model):
    id = db.Column(db.Integer, primary_key=True) 
    title = db.Column(db.String(200), nullable=False) 
    content = db.Column(db.Text, nullable=False) 
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False) 
    starred = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # last_updated sütununun varlığını kontrol edin
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = db.relationship('Tag', secondary=note_tags, lazy='subquery',
                           backref=db.backref('notes', lazy=True))


class Task(db.Model):
    # ... (Task modelinin geri kalanı aynı) ...
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    due_date = db.Column(db.DateTime, nullable=True)
    starred = db.Column(db.Boolean, default=False)
    completed = db.Column(db.Boolean, default=False)
    reminded = db.Column(db.Boolean, default=False) 
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    order = db.Column(db.Integer, nullable=True) # nullable=True geçiş sürecini kolaylaştırır
    tags = db.relationship('Tag', secondary=task_tags, lazy='subquery',
                           backref=db.backref('tasks', lazy=True))

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # Bir kullanıcının aynı isimde birden fazla etiket oluşturmasını engelle
    __table_args__ = (db.UniqueConstraint('name', 'user_id', name='_user_tag_uc'),)

class Badge(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=False)
    icon = db.Column(db.String(50), nullable=False) # Bootstrap icon class name (e.g., 'bi-award')
    criteria_key = db.Column(db.String(50), nullable=False, unique=True) # Logic için anahtar (e.g., 'notes_created_1')