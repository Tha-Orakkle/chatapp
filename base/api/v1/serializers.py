from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image
from phonenumbers import parse, NumberParseException, is_valid_number
from rest_framework import serializers

from chatapp import settings
from base.models import Conversation, Message, User, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'full_name', 'avatar', 'phone_number']
    
    def validate_phone_number(self, value):
        """ Validates phone number """
        try:
            region = getattr(settings, 'PHONENUMBER_DEFAULT_REGION', None)
            parsed_number = parse(str(value), region)
            if not is_valid_number(parsed_number):
                return serializers.ValidationError("Invalid phone number")
        except NumberParseException as e:
            raise serializers.ValidationError("Invalid phone number format")
        return value
    
    def validate_avatar(self, value):
        """ Validates and processes avatar to return a resized image """
        try:
            img = Image.open(value)
        except IOError:
            raise serializers.ValidationError("The uploaded file is not a valid image")
        allowed_formats = ['JPEG', 'PNG', 'WEBP']
        if img.format not in allowed_formats:
            raise serializers.ValidationError("Unsupported image format. Only jpeg, png & webp")
        new_size = (320, 320)
        resized_img = img.resize(new_size, Image.LANCZOS)
        output = BytesIO()
        resized_img.save(output, img.format)
        output.seek(0)
        
        value.file = ContentFile(output.read())
        value.file.name = value.name
        return value
        

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