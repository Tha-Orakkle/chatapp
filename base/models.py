from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save, post_delete
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
    friends = models.ManyToManyField('self', symmetrical=True, blank=True)
    
    def __str__(self):
        return f"<User> {self.username} - {self.email}"


class UserProfile(models.Model):
    avatar = models.ImageField(upload_to=user_upload_image_path, null=True, blank=True)
    bio = models.CharField(max_length=158, default="", blank=True)
    telephone = PhoneNumberField(null=True, blank=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')

    def __str__(self):
        return f"[{self.user.username}] {self.bio}"

    # def delete(self, *args, **kwargs):
    #     if self.avatar:
    #         if os.path.isfile(self.avatar.path):
    #             os.remove(self.avatar.path)
    #     super().delete(*args, **kwargs)

    
# signal to create a UserProfile for any new User 
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_delete, sender=UserProfile)
def delete_user_avatar(sender, instance, **kwargs):
    if instance.avatar and os.path.isfile(instance.avatar.path):
        os.remove(instance.avatar.path)
    

class Conversation(models.Model):
    id = models.UUIDField(
        default=uuid.uuid4, editable=False,
        unique=True, null=False, primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='conversations')
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
        ordering = ['-created_at']

    def __str__(self):
        return f"<Message> {self.body if len(self.body) < 50 else self.body[:50]}"
    
