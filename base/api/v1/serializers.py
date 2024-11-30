from rest_framework import serializers

from base.models import Conversation, Message, User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username',  'email', 'full_name']

    def get_full_name(self, obj):
        full_name = obj.profile.full_name
        return full_name


class ConversationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    conversation_with = UserSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'conversation_with'] # expecting an error for UserSerialization

class MessageSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Message
        fields = '__all__' # expecting error for sender serialization