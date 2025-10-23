# auth/routes.py
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from models import db, User
from flask_login import current_user, login_user, logout_user, login_required

auth_bp = Blueprint('auth', __name__, template_folder="../templates")

# YENİ: Karşılama Ekranı
@auth_bp.route('/welcome')
def welcome():
    return render_template('welcome.html')

# Giriş yap
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.home'))
    
    if request.method == 'POST':
        # Formdan gelen alan adı hala 'username' (kullanıcı adı VEYA e-posta)
        username_or_email = request.form.get('username')
        password = request.form.get('password')
        
        user = None
        # 1. Gelen değer bir e-posta adresi mi gibi duruyor?
        if "@" in username_or_email:
            # E-posta sütununda ara
            user = User.query.filter_by(email=username_or_email).first()
        
        # 2. Eğer kullanıcı hala bulunamadıysa (veya e-posta formatında değilse) kullanıcı adı sütununda ara
        if user is None:
            user = User.query.filter_by(username=username_or_email).first()
            
        # 3. Kullanıcı bulunduysa ve şifre doğruysa
        if user and user.check_password(password):
            login_user(user)
            session['show_welcome_modal'] = True # YENİ: Modal göstermek için işaretçi
            flash(f"Hoş geldin, {user.username}!", "success")
            return redirect(url_for('dashboard.home'))
        
        # 4. Giriş başarısız
        flash("Giriş başarısız. Kullanıcı adı/e-posta veya şifre hatalı!", "danger")
        return redirect(url_for('auth.login'))
        
    return render_template('login.html')


# Kayıt ol
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        existing_user = User.query.filter(
            (User.username == username) | (User.email == email)
        ).first()

        if existing_user:
            flash("Bu kullanıcı adı veya e-posta zaten kullanımda.", "warning")
            return redirect(url_for('auth.register'))

        new_user = User(username=username, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()
        
        flash("Başarıyla kayıt oldunuz! Lütfen giriş yapın.", "success")
        return redirect(url_for('auth.login'))

    return render_template('register.html')


# Çıkış yap
@auth_bp.route('/logout')
@login_required
def logout():
    # Mevcut "Hoş geldin" gibi eski flash mesajlarını temizle
    session.pop('_flashes', None)
    logout_user()
    flash("Görüşmek üzere! Tekrar bekleriz.", "success")
    return redirect(url_for('auth.login'))

# Hesap Silme İşlemi
@auth_bp.route('/delete_account_with_password', methods=['POST'])
@login_required
def delete_account_with_password():
    password = request.form.get('password')
    
    if not current_user.check_password(password):
        return jsonify({"success": False, "message": "Şifre hatalı. Hesap silinemedi."}), 401

    # Şifre doğru, hesabı sil
    try:
        session.pop('_flashes', None) # Flask oturumundan mesajları sil
        db.session.delete(current_user)
        db.session.commit()
        logout_user()
        # Başarılı silme durumunda JS'e yönlendirme bilgisi verilir
        return jsonify({"success": True, "message": "Hesabınız başarıyla silinmiştir.", "redirect_page": True})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Hesap silinirken bir hata oluştu: {str(e)}."}), 500
    
@auth_bp.route('/account_deleted_page')
def account_deleted_page():
    # Bu, sadece account_deleted.html içeriğini (layoutsuz) döner
    return render_template('account_deleted.html')   