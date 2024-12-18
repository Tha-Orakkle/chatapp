from django.urls import path

from .tokens import TokenGenerationView
from .conversation_views import ConversationView
from .user_views import (
    UsersView, FollowingIDsView,
    UserFollowingView, FollowORUnfollowUserView)

urlpatterns = [
    path('token/', TokenGenerationView.as_view()),
    path('conversations/<str:conversation_id>/', ConversationView.as_view()),
    path('users/', UsersView.as_view()),
    path('users/<str:user_id>/', UsersView.as_view()),
    
    path('user/<str:user_id>/following/', UserFollowingView.as_view()),
    path('following_ids/', FollowingIDsView.as_view()),
    path('follow_or_unfollow/<str:user_id>/', FollowORUnfollowUserView.as_view()),
]
