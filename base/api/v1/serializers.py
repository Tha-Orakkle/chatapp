from rest_framework import serializers

from base.models import Conversation, Message

class ConversationSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Conversation
        field = ['id', 'user', 'conversation_with'] # expecting an error for UserSerialization

class MessageSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Message
        field = '__all__' # expecting error for sender serialization