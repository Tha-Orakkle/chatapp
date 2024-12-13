from rest_framework import status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination as PNP
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import UserTokenAuthentication
from base.models import User
from .errors import CustomAPIException
from .serializers import UserSerializer


#  Should be updated to paginate the response
class UsersView(APIView):
    """ Returns a list of all users """
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """ Return a list of users """
        queryset = User.objects.exclude(id=request.user.id).order_by('username')
        paginator = PNP()
        paginator.page_size = 5
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)


class FollowORUnfollowUserView(APIView):
    """ Follows or Unfollows a user """
    
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesoetExist:
            return Response({'detail': 'Invalid User ID'}, status=status.HTTP_400_BAD_REQUEST)
        action = request.GET.get('action')
        if action == 'follow':
            request.user.follow(user)
        elif action == 'unfollow':
            request.user.unfollow(user)
        return Response({'status': f"{action}ed"})
        

class FollowingIDsView(APIView):
    """ Returns a list that contains the ID
    of all users followed by a user """
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        following_ids = request.user.following.values_list('id', flat=True)
        return Response(following_ids)
    

class UserFollowingView(APIView):
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """ Returns a list of all the following of a user.
        They form the contacts of the user"""
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
             raise CustomAPIException("Invalid User ID", status.HTTP_400_BAD_REQUEST)
        following = user.following.order_by('username')
        serializer = UserSerializer(following, many=True)
        return Response(serializer.data)
    
        
    
