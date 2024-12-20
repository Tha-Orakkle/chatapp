from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import json

from .models import Conversation, Message, User
from base.api.v1.serializers import UserSerializer, MessageSerializer


class ChatAppConsumer(AsyncWebsocketConsumer):
    """ Consumer to handle notifications and other things related """
    async def connect(self):
        self.user = self.scope['user']
        self.room_group_name = str(self.user.id)
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )   
        await self.accept()
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'status': 'connected successfully'
        }))
        print(f'chatapp connection {self.room_group_name} established')
        
        
    async def send_notification(self, event):
        serialized_data = await self.get_user_message_serialized_data(
            event['from'], event['message']
        )
        print(f"SERIALIZED_DATA: \n\n{serialized_data}\n\n")
        await self.send(text_data=json.dumps({
            'type': 'chat_notification',
            **serialized_data
        }))
        
        
    @sync_to_async
    def get_user_message_serialized_data(self, user, message):
        serialized_data = {
            'from': UserSerializer(user).data,
            'message': MessageSerializer(message).data
        }
        return serialized_data


class ChatConsumer(AsyncWebsocketConsumer):
    """ Consumer for the connection between two users fo real-time communication """
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
                'status': 'connected successfully',
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
            message, message2 = await self.create_message(data)
            
            await self.channel_layer.group_send(
                self.room_group_name, {
                'type': 'send_message',
                'message': message,
            })
            
            print(f"OTHER_USER_ID: {str(self.other_user.id)}")            
            await self.channel_layer.group_send(
                str(self.other_user.id), {
                    'type': 'send_notification',
                    'from': self.user,
                    'message': message2
                }
            )
    

    @sync_to_async
    def create_message(self, data):
        convo_other_user, created = Conversation.objects.get_or_create(
            user=self.other_user,
            conversation_with=self.user,
        )
        
        # message for self.user conversation
        message = Message.objects.create(
            conversation=self.conversation,
            sender=self.user,
            recipient=self.other_user,
            body=data['body'])
        
        # message for self.other_user conversation
        message2 = Message.objects.create(
            conversation=convo_other_user,
            sender=message.sender,
            recipient=message.recipient,
            body=data['body'])
        return message, message2


    @sync_to_async
    def get_conversation(self):
        conversation, created = self.user.conversations.get_or_create(
            conversation_with=self.other_user,
        )
        return conversation
    
    
    @sync_to_async
    def get_user(self, uid):
        return User.objects.get(id=uid)
    
    
    @sync_to_async
    def get_message_serialized_data(self, message):
        return {'message': MessageSerializer(message).data}
    
    async def send_message(self, event):
        serialized_data = await self.get_message_serialized_data(event['message'])
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            **serialized_data
        }))
