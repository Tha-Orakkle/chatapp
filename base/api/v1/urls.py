from django.urls import path

from .tokens import TokenGenerationView
from .conversation_views import ConversationView
from .user_views import UsersView, FollowingView, FollowORUnfollowView

urlpatterns = [
    path('token/', TokenGenerationView.as_view()),
    path('conversations/<str:conversation_id>/', ConversationView.as_view()),
    path('users/', UsersView.as_view()),
    
    path('following/', FollowingView.as_view()),
    path('follow_or_unfollow/<str:user_id>/', FollowORUnfollowView.as_view()),
]
