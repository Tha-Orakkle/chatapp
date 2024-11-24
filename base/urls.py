from django.urls import path, include
from . import views, api_views

urlpatterns = [
    path('', views.index, name='home'),
    path('register/', views.register, name='register'),
    path('register/user-profile/', views.register_user_profile, name='register-user-profile'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('find-users/', views.find_users, name='find-users'),
    path('chat/<str:other_user_id>', views.create_conversation, name='chat'),

    # API VIEWS
    path('follow-or-unfollow/<str:user_id>/', api_views.follow_or_unfollow),
]
