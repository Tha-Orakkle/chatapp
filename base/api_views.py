from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from base.models import User


@login_required
def follow_or_unfollow(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            'failed': 'An error occured'
        })
    action = request.GET.get('action')
    if action == 'unfollow':
        request.user.unfollow(user)
    elif action == 'follow':
        request.user.follow(user)
    
    return JsonResponse({'status': f"{action}ed"})

