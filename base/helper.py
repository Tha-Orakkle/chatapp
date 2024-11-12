"""Helper Functions"""
from chatapp.settings import MEDIA_ROOT
import os


def user_upload_image_path(instance, filename):
    """returns a new name for the users uplaoded avater(image)"""
    ext = os.path.splitext(filename)[1]
    _filename = f"images/user_{instance.user.id}{ext}"
    full_path = os.path.join(MEDIA_ROOT, _filename)
    if os.path.isfile(full_path):
        os.remove(full_path)
    return _filename
