from datetime import timedelta
from rest_framework import status
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import APIException

from base.models import User
from base.api.v1.errors import AuthFailed


class UserTokenAuthentication(BaseAuthentication):
    
    def authenticate(self, request):
        token_key = request.COOKIES.get('auth_token')
        print(token_key)
        if not token_key:
            return None
        try:
            user, token = self.validate_token(token_key)
        except Exception as e:
            raise AuthFailed(f"Token Validation Failed: {str(e)}", status_code=status.HTTP_401_UNAUTHORIZED)
        if not user or not token:
            raise AuthFailed("Invalid Token or user not found", status_code=status.HTTP_401_UNAUTHORIZED)
        return (user, token)
        
    
    def validate_token(self, token_key):
        try:
            token = Token.objects.get(key=token_key)
            user = User.objects.get(auth_token=token)
        except (Token.DoesNotExist, User.DoesNotExist) as e:
            raise AuthFailed(f"{str(e)}", status_code=status.HTTP_401_UNAUTHORIZED)

        current_time = timezone.now()
        if token.created < current_time - timedelta(minutes=1):
            raise AuthFailed("Token Expired", status_code=status.HTTP_401_UNAUTHORIZED)
        return (user, token)