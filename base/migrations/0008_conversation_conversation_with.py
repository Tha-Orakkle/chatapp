# Generated by Django 5.1.3 on 2024-11-13 20:30

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0007_remove_user_followers'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='conversation_with',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]