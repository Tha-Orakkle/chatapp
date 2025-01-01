from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from base.backends.authenticate import UserTokenAuthentication
from base.models import Conversation, Message


class MessageView(APIView):
    authentication_classes = [UserTokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, conversation_id, message_id):
        try:
            conversation = request.user.conversations.get(id=conversation_id)
            message = conversation.messages.get(id=message_id)
        except (Conversation.DoesNotExist, Message.DoesNotExist):
            return Response({'detail': 'Invalid Conversation/Message ID'}, status=status.HTTP_400_BAD_REQUEST)
        message.delete()
        return Response({'success': True, 'detail': 'Message deleted successfully'})
        
            
