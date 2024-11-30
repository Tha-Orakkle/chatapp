from rest_framework import status
from rest_framework.views import APIView
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from base.backends.authenticate import ExpiredTokenAuthentication
from base.models import User, Conversation
from .serializers import ConversationSerializer, MessageSerializer


class ConversationView(APIView):
    # authentication_classes = [ExpiredTokenAuthentication, TokenAuthentication]
    permission_classes = [AllowAny]
    
    def get(self, request, conversation_id):
        print("=======fetching conversations=========")
        try:
            conversation = request.user.conversations.get(id=conversation_id)
        except Conversation.DoesNotExist as e:
            # raise APIException(detail=e, code=status.HTTP_400_BAD_REQUEST)
            return Response({'detail': 'Invalid conversation id'}, status=status.HTTP_400_BAD_REQUEST)
        messages = conversation.messages.all()
        convo_serializer = ConversationSerializer(conversation)
        msg_serializer = MessageSerializer(messages, many=True)
        print("=======fetching complete=========")
        
        return Response({
            'conversation': convo_serializer.data,
            'messages': msg_serializer.data
        })