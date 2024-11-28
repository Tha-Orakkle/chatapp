from django.urls import path

from .tokens import TokenGenerationView
from .conversation_views import ConversationView

urlpatterns = [
    path('token/', TokenGenerationView.as_view()),
    path('conversation/<str:user_id>/', ConversationView.as_view()),
]
