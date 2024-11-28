from rest_framework import status
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import ExpiredTokenAuthentication
from base.models import User, Conversation
from .serializers import ConversationSerializer, MessageSerializer


class ConversationView(APIView):
    authentication_classes = [ExpiredTokenAuthentication, TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        try:
            other_user = User.objects.get(id=user_id)
            conversation = request.user.conversations.get(conversation_with=other_user)
        except (User.DoesNotExist, Conversation.DoesNotExist) as e:
            raise Response({'detail': e}, status=status.HTTP_400_BAD_REQUEST)
        messages = conversation.messages.all()
        convo_serializer = ConversationSerializer(conversation)
        msg_serializer = MessageSerializer(messages, many=True)
        return Response({
            'conversation': convo_serializer.data,
            'messages': msg_serializer.data
        })
        