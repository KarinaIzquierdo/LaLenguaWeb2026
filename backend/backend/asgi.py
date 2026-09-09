"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

# Configurar el entorno de Django antes de cualquier otra cosa
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Obtener la aplicación HTTP básica (la más importante para el login)
try:
    http_application = get_asgi_application()
except Exception as e:
    print(f"❌ Error crítico cargando get_asgi_application: {e}")
    raise e

try:
    from channels.routing import ProtocolTypeRouter, URLRouter
    from channels.auth import AuthMiddlewareStack
    import api.routing

    application = ProtocolTypeRouter({
        "http": http_application,
        "websocket": AuthMiddlewareStack(
            URLRouter(
                api.routing.websocket_urlpatterns
            )
        ),
    })
    print("✅ ASGI configurado correctamente con WebSockets")
except Exception as e:
    print(f"⚠️ Error cargando Channels/WebSockets, usando fallback HTTP: {e}")
    # Si falla el chat, al menos que funcione la web normal
    application = http_application
