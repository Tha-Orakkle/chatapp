from django.urls import resolve, reverse
from django.test import SimpleTestCase

from base import views


class TestURLs(SimpleTestCase):
    """Test that all urls are mapped to the
    right endpoint"""

    def test_home_resolves(self):
        """home"""
        url = reverse('home')
        self.assertEqual(resolve(url).func, views.index)

    def test_register_resolves(self):
        """register endpoint"""
        url = reverse('register')
        self.assertEqual(resolve(url).func, views.register)


    def test_login_resolves(self):
        """login endpoint"""
        url = reverse('login')
        self.assertEqual(resolve(url).func, views.login_user)

    def test_logout_resolves(self):
        """logout endpoint"""
        url = reverse('logout')
        self.assertEqual(resolve(url).func, views.logout_user)
