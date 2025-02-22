from django.urls import path

from .tokens import TokenGenerationView
from .conversation_views import ConversationView
from .message_views import MessageView
from .user_views import (
    UsersView, FollowingIDsView,
    UserFollowingView, FollowORUnfollowUserView,
    SearchUserView)

urlpatterns = [
    path('token/', TokenGenerationView.as_view()),
    path('users/', UsersView.as_view()),
    path('users/search/', SearchUserView.as_view()),
    path('users/<str:user_id>/', UsersView.as_view()),
    
    path('user/<str:user_id>/following/', UserFollowingView.as_view()),
    path('following_ids/', FollowingIDsView.as_view()),
    path('follow_or_unfollow/<str:user_id>/', FollowORUnfollowUserView.as_view()),
    
    path('conversations/<str:conversation_id>/', ConversationView.as_view()),
    path('conversation/<str:conversation_id>/message/<str:message_id>/', MessageView.as_view()),
]
