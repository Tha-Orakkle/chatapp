"""Helper Functions"""
import os


def user_upload_image_path(instance, filename):
    """returns a new name for the users uplaoded avater(image)"""
    ext = os.path.splitext(filename)[1]
    return f"images/user_{instance.user.id}{ext}"
