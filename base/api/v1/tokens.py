from datetime import timedelta
from django.utils import timezone
# from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from base.models import User

class TokenGenerationView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        token, created = Token.objects.get_or_create(user=user)
        current_time = timezone.now()
        if not created and token.created < current_time - timedelta(minutes=1):
            token.delete()
            token = Token.objects.create(user=user)
        response =  Response({'token': token.key}, status=status.HTTP_200_OK)
        response.set_cookie('auth_token', token.key, httponly=True, samesite='Lax', max_age=86400)
        return response
