from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import json

from .models import Conversation, Message


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['chat_room']
        self.room_group_name = f"chat_{self.room_name}"
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
        await self.accept()
        print("connection established")
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name)
        print("connection lost")
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        data = {
            'conversation_id': text_data_json['conversation_id'],
            'body': text_data_json['body']
        }

        message = await self.create_message(data)
        
        await self.channel_layer.group_send(
            self.room_group_name, {
            'type': 'chat_message', 
            'message': message,

        })

    @sync_to_async
    def create_message(self, data):
        conversation = Conversation.objects.get(
            id=data['conversation_id'])
        convo_other_user, created = Conversation.objects.get_or_create(
            user=conversation.conversation_with,
            conversation_with=conversation.user,
        )
        message = Message.objects.create(
            conversation=conversation,
            sender=conversation.user,
            recipient=conversation.conversation_with,
            body=data['body'])
        Message.objects.create(
            conversation=convo_other_user,
            sender=message.sender,
            recipient=message.recipient,
            body=data['body'])
        return message

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'message',
            'message': event['message'].body,
            'sender_id': str(event['message'].sender.id),
        }))
