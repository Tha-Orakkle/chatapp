from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

from base.models import User


@login_required
def follow_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({
            'failed': 'An error occured'
        })
    request.user.follow(user)
    return JsonResponse({
    'success': 'user successfully followed'
    })

