from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
# from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.authtoken.models import Token


from base.models import User

class TokenGenerationView(APIView):
    
    def post(self, request):
        user_id = request.data.get('user_id')
        try:
            user = User.objects.get(id=user_id)
        except User.UserDoesNotExist:
            return Response({'detail': 'Invalid user_id'}, status=status.HTTP_400_BAD_REQUEST)
        token, created = Token.objects.get_or_create(user=user)
        current_time = timezone.now()
        if not created and token.created < current_time - timedelta(hours=12):
            token.delete()
            token = Token.objects.create(user=user)
        response =  Response({'token': token.key}, status=status.HTTP_200_OK)
        response.set_cookie('token', token.key, httponly=True, samesite='Lax', max_age=86400)
        return response
