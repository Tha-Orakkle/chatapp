from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .forms import MyUserCreationForm
from .models import User

# Create your views here.
@login_required
def index(request):
    context = {'title': 'Home', 'user': request.user}
    return render(request, 'base/index.html', context)
    

def register(request):
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


@login_required
def find_users(request):
    users = User.objects.order_by('username')
    context = {
        'title': 'Find Friends',
        'users': users
    }
    return render(request, 'base/users.html', context)