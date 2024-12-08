from rest_framework import serializers

from base.models import Conversation, Message, User, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField() # allows for custom method fpor the field

    class Meta:
        model = UserProfile
        fields = ['bio', 'full_name', 'avatar']
        
        
    def get_avatar(self, obj):
        """ returns the avatar url """
        return obj.avatar.url
    

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username',  'email', 'profile']


class ConversationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    conversation_with = UserSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'user', 'conversation_with']

class MessageSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Message
        fields = '__all__' # expecting error for sender serialization