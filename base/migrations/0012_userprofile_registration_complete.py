# Generated by Django 5.1.3 on 2025-01-01 21:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0011_alter_message_options_conversation_unread_msg_count_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='registration_complete',
            field=models.BooleanField(default=False),
        ),
    ]
