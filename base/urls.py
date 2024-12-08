from django.urls import path, include
from django.conf.urls.static import static

from . import views
from chatapp import settings

urlpatterns = [
    path('', views.index, name='home'),
    path('register/', views.register, name='register'),
    path('register/user-profile/', views.register_user_profile, name='register-user-profile'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
