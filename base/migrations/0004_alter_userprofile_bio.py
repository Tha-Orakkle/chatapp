# Generated by Django 5.1.3 on 2024-11-09 13:59

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0003_alter_userprofile_bio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='bio',
            field=models.CharField(default='', max_length=158),
        ),
    ]
