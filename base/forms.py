from django.contrib.auth.forms import UserCreationForm
from django.core.files.base import ContentFile
from django import forms
from phonenumbers import parse, NumberParseException, is_valid_number
from PIL import Image
from io import BytesIO

from .models import User, UserProfile

class MyUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'placeholder': 'Enter username'}),
            'email': forms.TextInput(attrs={'placeholder': 'Enter email address'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].widget.attrs['placeholder'] = 'Enter password'
        self.fields['password2'].widget.attrs['placeholder'] = 'Confirm password'
    
    
class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'full_name', 'phone_number', 'bio']
        widgets = {
            'full_name': forms.TextInput(attrs={'placeholder': 'e.g. Alan Poe', 'required': 'required'}),
            'phone_number': forms.TextInput(attrs={'placeholder': '+2348120001234 or 08120001234 (for NG)'}),
            'bio': forms.Textarea(attrs={
                'placeholder': 'say something about yourself. Please keep it short, save the full digest for chats.', 
                'rows': "4"}),
            'avatar': forms.FileInput(attrs={'accept': 'image/*', 'class': 'avatar-input'})
        }
        
    def clean_phone_number(self):
        phone = self.cleaned_data.get('phone_number')
        if phone:
            try:
                parsed_number = parse(str(phone), None)
                
                if not is_valid_number(parsed_number):
                    raise forms.ValidationError("The phone number is not valid.")
            except NumberParseException:
                raise forms.ValidationError("Invalid phone number format")
        return phone
        
    def clean_avatar(self):
        avatar = self.cleaned_data.get('avatar')

        if avatar and avatar.name != 'default/default.png':
            # open uploaded image using Pillow                
            try:
                img = Image.open(avatar)
            except IOError:
                raise forms.ValidationError("The uploaded file is not a valid image")

            allowed_formats = ['JPEG', 'PNG', 'WEBP']
            if img.format not in allowed_formats:
                raise forms.ValidationError(
                    f"Unsupported image format. Allowed formats are: {','.join(allowed_formats)}.")

            # resizing image to 320x320
            new_size = (320, 320)
            resized_img = img.resize(new_size, Image.LANCZOS)

            # saving resized image to memory
            output = BytesIO()
            resized_img.save(output, format=img.format)
            output.seek(0)
            #replacing the original image with the resized version
            avatar.file = ContentFile(output.read())
            avatar.file.name = avatar.name
        return avatar
        
            
