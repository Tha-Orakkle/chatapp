from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.urls import reverse, resolve
# import requests
from urllib.parse import urlparse

from .forms import MyUserCreationForm, UserProfileForm
from .models import User, UserProfile, Conversation, Message

API_BASE_URL = "http://127.0.0.1:8000/api/v1/"


@login_required
def index(request):
    if not request.user.profile.registration_complete:
        return redirect('register-user-profile')
    conversations = request.user.conversations
    context = {
        'title': 'Home',
        'conversations': conversations.all(),
        'unread_msg_count': sum(conversations.values_list('unread_msg_count', flat=True))
    }

    return render(request, 'base/index.html', context)
    

def register(request):
    if request.user.is_authenticated:
        return redirect('home')
    form = MyUserCreationForm()
    context = {'title': 'Registration'}
    if request.method == 'POST':
        form = MyUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.email = user.email.strip().lower()
            user.username = user.username.strip().lower()
            user.save()
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)
            return redirect('register-user-profile')
        
        context.update({'form': form})
        return render(request, 'base/register.html', context)
            
    context['form'] = form
    return render(request, 'base/register.html', context)


@login_required
def register_user_profile(request):
    # prev_page_url = request.META.get('HTTP_REFERER')
    # path = urlparse(prev_page_url).path
    # print(path)
    if request.user.profile.registration_complete:
        return redirect('home')
   
    context = {'title': 'User Profile'}
    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=request.user.profile)
        if form.is_valid():
            user_profile = form.save(commit=False)
            user_profile.registration_complete = True
            user_profile.save()
            return redirect('home')
        
        context.update({'form': form})
        return render(request, 'base/register_user_profile.html', context)
        
    context['form'] = UserProfileForm(instance=request.user.profile)
    return render(request, 'base/register_user_profile.html', context)


def login_user(request):
    if request.user.is_authenticated:
        return redirect('home')
    if request.method == 'POST':
        username = request.POST.get('username').strip().lower()
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if not user:
            messages.error(request, "Invalid login credentials")
            return redirect('login')
        
        login(request, user)
        return redirect('home')

    context = {'title': 'Login'}
    return render(request, 'base/login.html', context)


def logout_user(request):
    logout(request)
    response = redirect('login')
    response.delete_cookie('auth_token')
    return response