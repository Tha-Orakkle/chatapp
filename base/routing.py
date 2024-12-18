from django.urls import path

from .consumers import ChatConsumer, ChatAppConsumer


websocket_urlpatterns = [
    path('ws/chatapp/', ChatAppConsumer.as_asgi()),
    path('ws/chat/<str:user_id>/', ChatConsumer.as_asgi()),
]