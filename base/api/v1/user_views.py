from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination as PNP
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import UserTokenAuthentication
from base.models import User
from .serializers import UserSerializer, UserProfileSerializer


#  Should be updated to paginate the response
class UsersView(APIView):
    """ Returns a list of all users """
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id=None):
        """ Return a list of users """
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                following_status = request.user.is_following(user)
            except User.DoesNotExist:
                return Response({'detail': 'Invalid user ID'}, status=status.HTTP_400_BAD_REQUEST)
            serializer = UserSerializer(user)
            return Response({
                'following': following_status, # true if you follow user
                'user': serializer.data
            })
        
        queryset = User.objects.exclude(id=request.user.id).order_by('username')
        paginator = PNP()
        paginator.page_size = 10
        paginated_queryset = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    
    def put(self, request, user_id):
        """ Update a user info including the profile """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "invalid user ID"}, status=status.HTTP_400_BAD_REQUEST)
        
        profile_serializer = UserProfileSerializer(
            user.profile, data=request.data, partial=True)

        if not profile_serializer.is_valid():
            return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if not user_serializer.is_valid():
            return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        profile_serializer.validated_data['full_name'] = profile_serializer.validated_data['full_name'].title().strip()
        profile_serializer.save()
        user_serializer.validated_data['username'] = user_serializer.validated_data['username'].strip().lower()
        user_serializer.save()
        return Response({
            'message': 'Profile updated successfully',
            'data': user_serializer.data
        })
        
        
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
            return Response({"detail": "Invalid User ID"}, status=400)
        following = user.following.order_by('username')
        serializer = UserSerializer(following, many=True)
        return Response(serializer.data)
    

class SearchUserView(APIView):
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_query = request.GET.get('q')
        if user_query:
            users = User.objects.filter(
                Q(username__icontains=user_query) | Q(profile__full_name__icontains=user_query)
            ).exclude(id=request.user.id)
            serializers = UserSerializer(users, many=True)
            return Response({'success': True, 'result': serializers.data})
        return Response({'success': True, 'result': []})
                    
        