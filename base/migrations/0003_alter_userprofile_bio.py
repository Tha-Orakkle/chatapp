# Generated by Django 5.1.3 on 2024-11-08 11:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0002_alter_userprofile_avatar_alter_userprofile_bio_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='bio',
            field=models.TextField(default=''),
        ),
    ]