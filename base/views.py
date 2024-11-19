from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .forms import MyUserCreationForm
from .models import User, UserProfile, Conversation, Message

# Create your views here.
@login_required
def index(request):
    context = {
        'title': 'Home',
        'conversations': request.user.conversations.all()
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
            return redirect('home')
        
        context.update({'form': form})
        return render(request, 'base/register.html', context)
            
    context['form'] = form
    return render(request, 'base/register.html', context)


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
    return redirect('login')

# this will be refactored to be a search result
@login_required
def find_users(request):
    following = request.user.following
    exclude_id = list(following.values_list('id', flat=True)) + [request.user.id]
    users = User.objects.exclude(id__in=exclude_id) 
    context = {
        'title': 'Find Friends',
        'following': following.all(),
        'users': users
    }
    return render(request, 'base/users.html', context)

@login_required
def create_conversation(request, other_user_id):
    """creates conversation with other user"""
    try:
        other_user = User.objects.get(id=other_user_id)
    except User.DoesNotExist:
        other_user = None
    
    conversation, created = Conversation.objects.get_or_create(
        user=request.user, conversation_with=other_user,
        defaults={
            'user': request.user,
            'conversation_with': other_user,
        })
    if not conversation:
        messages.error(request, "An error occured")
        return redirect(request.META.get('HTTP_REFERER'))
    
    chat_room_name = "_".join(sorted([str(request.user.id), other_user_id]))
    
    context = {
        'title': 'chat room',
        'conversation': conversation,
        'chat_room_name': chat_room_name
    }
    return render(request, 'base/chat_room.html', context)