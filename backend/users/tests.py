from django.test import TestCase
from django.contrib.auth.models import User
from users.models import Area, UserProfile

class UserProfileTests(TestCase):
    def setUp(self):
        self.area_it = Area.objects.create(name='IT')
        self.area_hr = Area.objects.create(name='Human Resources')

    def test_profile_signal_creation(self):
        """Test that profile is auto-created when a User is created."""
        user = User.objects.create_user(username='testuser', password='password123')
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.role, 'CLIENT')

    def test_profile_role_and_areas(self):
        """Test updating roles and area memberships on profile."""
        user = User.objects.create_user(username='resolver', password='password123')
        profile = user.profile
        profile.role = 'RESOLVER'
        profile.areas.add(self.area_it)
        profile.save()

        self.assertEqual(user.profile.role, 'RESOLVER')
        self.assertIn(self.area_it, user.profile.areas.all())
        self.assertNotIn(self.area_hr, user.profile.areas.all())
