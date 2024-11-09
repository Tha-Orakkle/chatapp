from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from django.dispatch import receiver
from phonenumber_field.modelfields  import PhoneNumberField

import uuid
# Create your models here.

class User(AbstractUser):
    id = models.CharField(
        max_length=40, default=uuid.uuid4,
        unique=True, null=False, primary_key=True)
    username = models.CharField(max_length=20, null=False, unique=True)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  
    
    def __str__(self):
        return f"<User> {self.username} - {self.email}"


class UserProfile(models.Model):
    avatar = models.ImageField(upload_to='images/', null=True, blank=True)
    bio = models.CharField(max_length=158, default="", null=False)
    telephone = PhoneNumberField(null=True, blank=True)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='profile')

    def __str__(self):
        return f"[{self.user.username}] {self.bio}"
    
# signal to create a UserProfile for any new User 
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


class Conversation(models.Model):
    id = models.CharField(
        max_length=40, default=uuid.uuid4,
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
    id = models.CharField(
        max_length=40, default=uuid.uuid4,
        unique=True, null=False, primary_key=True)
    body = models.TextField(null=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"<Message> {self.body if len(self.body) < 50 else self.body[:50]}"
    