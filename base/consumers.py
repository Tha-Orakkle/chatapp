from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import json


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
        await self.channel_layer.group_send(
            self.room_group_name, {
            'type': 'chat_message', 
            'body': text_data_json['body']
        })

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['body'],
        }));