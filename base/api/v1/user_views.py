from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import UserTokenAuthentication
from base.models import User
from .serializers import UserSerializer


#  Should be updated to paginate the response
class UsersView(APIView):
    """ Returns a list of all users """
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """ Return a list of users """
        users = User.objects.exclude(id=request.user.id).order_by('username')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
    

class FollowingView(APIView):
    """ Returns a list that contains the ID
    of all followers of a user """
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        following = request.user.following.values_list('id', flat=True)
        return Response(following)
    
    
class FollowORUnfollowView(APIView):
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
        