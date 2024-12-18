"""Helper Functions"""
from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image
from phonenumbers import parse, NumberParseException, is_valid_number

import os
import glob

from chatapp.settings import MEDIA_ROOT


def user_upload_image_path(instance, filename):
    """returns a new name for the users uplaoded avater(image)"""
    ext = os.path.splitext(filename)[1]
    _filename = f"images/user_{instance.user.id}{ext}"
    full_path = os.path.join(MEDIA_ROOT, _filename)
    files = glob.glob(os.path.splitext(full_path)[0] + "*")
    for file in files:
        if os.path.isfile(file):
            os.remove(file)
    return _filename
