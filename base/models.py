from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from phonenumber_field.modelfields  import PhoneNumberField

import uuid
import os

from .helper import user_upload_image_path


class User(AbstractUser):
    id = models.UUIDField(
        default=uuid.uuid4, editable=False,
        unique=True, null=False, primary_key=True)
    username = models.CharField(max_length=20, null=False, unique=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    following = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name='followers')
    
    def __str__(self):
        """Str representation of model"""
        return f"<User> {self.username} - {self.email}"
    
    def is_following(self, user):
        """checks if user is following the passed user"""
        user = self.following.filter(id=user.id)
        if user:
            return True
        return False
    
    def follow(self, user):
        """follows a user"""
        if not self.is_following(user):
            self.following.add(user)
            user.followers.add(self)
            user.save()
            self.save()
    
    
    def unfollow(self, user):
        """unfollows a user"""
        if self.is_following(user):
            self.following.remove(user)
            user.followers.remove(self)
            user.save()
            self.save()


class UserProfile(models.Model):
    avatar = models.ImageField(upload_to=user_upload_image_path, 
                               default='default/default.png',
                               null=True, blank=True)
    full_name = models.CharField(max_length=68, default="", blank=True)
    bio = models.TextField(default="", blank=True)
    # bio = models.CharField(max_length=158, default="", blank=True)
    phone_number = PhoneNumberField(unique=True, null=True, blank=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')

    def __str__(self):
        return f"[{self.user.username}] {self.bio}"


# ======================
# SIGNALS TO BE TRIGGERED DURING CREATION AND UPDATE USER/USERPROFILE
# ======================

# signal to create a UserProfile for any new User that is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

# signal to delete a user's avatar from the file system when User is deleted 
@receiver(post_delete, sender=UserProfile)
def delete_user_avatar(sender, instance, **kwargs):
    if instance.avatar and os.path.isfile(instance.avatar.path):
        if os.path.basename(instance.avatar.url) != 'default.png':
            os.remove(instance.avatar.path)
    

class Conversation(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, editable=False,
        unique=True, null=False, primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='conversations')
    conversation_with = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at', '-created_at']
        
    def __str__(self):
        return f"<Conversation>: {self.id}"


class Message(models.Model):
    """Message Model Representation"""
    id = models.UUIDField(
        default=uuid.uuid4, editable=False,
        unique=True, null=False, primary_key=True)
    body = models.TextField(null=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"<Message> {self.body if len(self.body) < 50 else self.body[:50]}"
    
