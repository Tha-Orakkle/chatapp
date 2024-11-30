from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import json

from .models import Conversation, Message, User


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        other_user_id = self.scope['url_route']['kwargs']['user_id']
        room_name = "_".join(sorted([str(self.user.id), other_user_id]))

        self.other_user = await self.get_user(other_user_id)        
        self.room_group_name = f"chat_{room_name}"
        self.conversation = await self.get_conversation()
        
        await self.channel_layer.group_add(
            self.room_group_name, self.channel_name)
        
        await self.accept()
        
        await self.send(text_data=json.dumps({
                'type': 'connection',
                'conversation_id': str(self.conversation.id)
        }))
        print("connection established")
        
    
    async def disconnect(self, code):
        await self.channel_layer.group_discard(
            self.room_group_name, self.channel_name)
        print("connection lost")
        
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        if text_data_json['type'] == 'chat_message':    
            data = {'body': text_data_json['body']}
            message = await self.create_message(data)
            
            await self.channel_layer.group_send(
                self.room_group_name, {
                'type': 'send_message',
                '_type': 'chat_message',
                'message': message.body,
                'created_at': str(message.created_at),
                'sender': str(message.sender.id)
            })

    @sync_to_async
    def create_message(self, data):
        # conversation = Conversation.objects.get(
        #     id=data['conversation_id'])
        convo_other_user, created = Conversation.objects.get_or_create(
            user=self.other_user,
            conversation_with=self.user,
        )
        # message fpr self.user conversation
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user,
            recipient=self.other_user,
            body=data['body'])
        
        # message for self.other_user conversation
        Message.objects.create(
            conversation=convo_other_user,
            sender=message.sender,
            recipient=message.recipient,
            body=data['body'])
        return message

    

    @sync_to_async
    def get_conversation(self):
        conversation, created = self.user.conversations.get_or_create(
            conversation_with=self.other_user,
        )
        return conversation
    
    @sync_to_async
    def get_user(self, uid):
        return User.objects.get(id=uid)
    
    
    # async def chat_message(self, event):
    #     await self.send(text_data=json.dumps({
    #         'type': 'message',
    #         'message': event['message'].body,
    #         'created_at': str(event['message'].created_at),
    #         'sender_id': str(event['message'].sender.id),
    #     }))
        

    async def send_message(self, event):
        _ignore = ['type', '_type']
        await self.send(text_data=json.dumps({
            'type': event['_type'],
            **{k: v for k, v in event.items() if k not in _ignore} #use this to implement a generic send message function
        }))
            