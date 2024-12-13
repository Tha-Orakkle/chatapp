from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import UserTokenAuthentication
from base.models import User, Conversation
from .serializers import ConversationSerializer, MessageSerializer


class ConversationView(APIView):
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        """ Returns conversation and the message history """
        print("=======fetching conversations=========")
        try:
            conversation = request.user.conversations.get(id=conversation_id)
        except Conversation.DoesNotExist as e:
            # raise APIException(detail=e)
            return Response({'detail': 'Invalid conversation id'}, status=status.HTTP_400_BAD_REQUEST)
        messages = conversation.messages.all()
        convo_serializer = ConversationSerializer(conversation)
        msg_serializer = MessageSerializer(messages, many=True)
        print("=======fetching complete=========")
        
        return Response({
            'conversation': convo_serializer.data,
            'messages': msg_serializer.data
        })