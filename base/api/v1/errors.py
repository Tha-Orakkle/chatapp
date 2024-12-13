from rest_framework.exceptions import APIException


class CustomAPIException(APIException):
    
    def __init__(self, detail, status_code=401):
        self.detail = detail
        self.status_code = status_code