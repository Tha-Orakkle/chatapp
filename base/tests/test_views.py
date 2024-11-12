from django.test import TestCase, Client
from django.urls import resolve, reverse

from base.models import User, UserProfile

class TestViews(TestCase):
    """tests that views work properly and
    renders the right html"""

    def setUp(self):
        self.client = Client()


    def test_register_GET(self):
        """tests register view GET"""
        url = reverse('register')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'base/register.html')


    def test_register_POST(self):
        """tests register view POST"""
        url = reverse('register')
        data = {
            'username': 'example',
            'email': 'example@email.com',
            'password1': 'illustration123#',
            'password2': 'illustration123#'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(User.objects.count(), 1)


    def test_login_GET(self):
        """tests login view GET"""
        url = reverse('login')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'base/login.html')
