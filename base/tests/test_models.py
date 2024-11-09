from django.test import TestCase

from base.models import User, UserProfile, Message, Conversation

class TestModels(TestCase):
    
    def setUp(self):
        self.user = User.objects.create(
            username='jay',
            password='example123#',
            email='jay@email.com'
        )
    
    def test_user_creation(self):
        user2 = User.objects.create(
            username='horzee',
            password='example123#',
            email='horzee@email.com'
        )
        self.assertTrue(isinstance(user2, User))
        self.assertEqual(type(user2.id).__name__, 'UUID')
        self.assertNotEqual(user2.id, self.user.id)
        
        self.assertEqual(UserProfile.objects.all().count(), 2)
        self.assertTrue(isinstance(user2.profile, UserProfile))
        
    def test_coonversation_creation(self):
        conversation = Conversation.objects.create(user=self.user)
        self.assertEqual(type(conversation.id).__name__, 'UUID')
        self.assertIsInstance(conversation, Conversation)
        self.assertEqual(conversation.user.username, 'jay')
        
        
    def test_message_creation(self):
        user2 = User.objects.create(
            username='horzee',
            password='example123#',
            email='horzee@email.com'
        )
        conversation = Conversation.objects.create(user=self.user)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            receiver=user2,
            body="Hello, how are you doing?"
        )
        self.assertIsInstance(message, Message)
        self.assertNotEqual(message.sender.username, message.receiver.username)
        self.assertEqual(message.conversation, conversation)
    
    def test_message_without_conversation(self):
        user2 = User.objects.create(
            username='horzee',
            password='example123#',
            email='horzee@email.com'
        )

        from django.db.utils import IntegrityError
        try:
            message = Message.objects.create(
            sender=self.user,
            receiver=user2,
            body="Hello, how are you doing?"
            )
        except IntegrityError as e:
            self.assertIsInstance(e, IntegrityError)
            self.assertEqual(str(e), "NOT NULL constraint failed: base_message.conversation_id")
