from django.core.files.base import ContentFile
from django.utils import timezone
from dateutil.relativedelta import relativedelta
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
    conversation = serializers.SerializerMethodField()
    sender = serializers.SerializerMethodField()
    recipient = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = '__all__' # expecting error for sender serialization
        
    def get_conversation(self, obj):
        return str(obj.conversation.id)
    
    def get_sender(self, obj):
        return str(obj.sender.id)
    
    def get_recipient(self, obj):
        return str(obj.recipient.id)
    
    def get_created_at(self, obj):
        """ converts date to human-readable string e.g 5 secs ago... """
        now = timezone.now()
        diff = relativedelta(now, obj.created_at)
        
        if diff.years >= 1:
            if diff.years == 1:
                return f"{diff.years} year ago"
            return f"{diff.years} years ago"
        elif diff.months >= 1:
            if diff.months == 1:
                return f"{diff.months} month ago"
            return f"{diff.months} months ago"
        elif diff.days >= 1:
            if diff.days == 1:
                return f"{diff.days} day ago"
            return f"{diff.days} days ago"
        elif diff.hours >= 1:
            if diff.hours == 1:
                return f"{diff.hours} hour ago"
            return f"{diff.hours} hours ago"
        elif diff.minutes >= 1:
            if diff.minutes == 1:
                return f"{diff.minutes} min ago"
            return f"{diff.minutes} mins ago"
        else:
            return f"{diff.seconds} secs ago"
            