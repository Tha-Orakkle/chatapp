import os
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chatapp.settings')

from base.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddleware(
        URLRouter(websocket_urlpatterns)
    )
})
