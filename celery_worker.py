from app import create_app, celery # Ana uygulama dosyanızın adını ve celery nesnesini import edin

app = create_app()
app.app_context().push()