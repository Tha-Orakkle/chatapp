from django.urls import path, include
from . import views, api_views

urlpatterns = [
    path('', views.index, name='home'),
    path('register/', views.register, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('find-friends/', views.find_users, name='find-friends'),
    path('chat/<str:other_user_id>', views.create_conversation, name='chat')

    # API VIEWS
    path('follow-user/<str:user_id>/', api_views)
]
