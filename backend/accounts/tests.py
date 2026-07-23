from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import UserProfile


@override_settings(LOGIN_SUCCESS_ALLOWED_HOSTS={"localhost:5000"})
class AuthenticationFlowTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="eccp.tester",
            password="Secure-Test-2026!",
            email="tester@example.com",
        )

    def test_login_page_uses_eccp_template(self):
        response = self.client.get(reverse("login"))
        self.assertContains(response, "企业文化内容创作平台")
        self.assertContains(response, 'name="username"')

    def test_login_and_session_endpoint(self):
        response = self.client.post(
            reverse("login"),
            {"username": "eccp.tester", "password": "Secure-Test-2026!"},
        )
        self.assertRedirects(response, "http://localhost:5000", fetch_redirect_response=False)
        session_response = self.client.get(reverse("auth-session"))
        self.assertEqual(session_response.status_code, 200)
        self.assertEqual(session_response.json()["user"]["username"], "eccp.tester")

    def test_anonymous_session_is_rejected(self):
        response = self.client.get(reverse("auth-session"))
        self.assertEqual(response.status_code, 401)

    def test_external_next_url_is_not_used(self):
        response = self.client.post(
            f'{reverse("login")}?next=https://attacker.example/phish',
            {"username": "eccp.tester", "password": "Secure-Test-2026!"},
        )
        self.assertEqual(response["Location"], "http://localhost:5000")


@override_settings(LOGIN_SUCCESS_ALLOWED_HOSTS={"localhost:5000"})
class EnterpriseCulturePermissionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command(
            "import_culture_users",
            superuser_password="Admin-Test-2026!",
            verbosity=0,
        )

    def test_imports_eight_approved_users(self):
        self.assertEqual(UserProfile.objects.filter(user__is_active=True).count(), 8)
        self.assertEqual(UserProfile.objects.filter(team__endswith="企业文化系").count(), 6)

    def test_super_admin_can_login_by_username_and_employee_id(self):
        self.assertTrue(self.client.login(username="binbin_wang", password="Admin-Test-2026!"))
        self.client.logout()
        self.assertTrue(self.client.login(username="6210968", password="Admin-Test-2026!"))

    def test_member_uses_pinyin_username_and_initial_employee_password(self):
        self.assertTrue(self.client.login(username="guoxiaopeng", password="0081306"))
        response = self.client.get(reverse("auth-session"))
        payload = response.json()["user"]
        self.assertTrue(payload["mustChangePassword"])
        self.assertIn("accounts.use_ai_assistant", payload["permissions"])
        self.assertNotIn("accounts.manage_platform", payload["permissions"])

    def test_member_cannot_use_employee_id_as_login_alias(self):
        self.assertFalse(self.client.login(username="0081306", password="0081306"))

    def test_password_change_clears_first_login_requirement(self):
        self.client.login(username="guoxiaopeng", password="0081306")
        response = self.client.post(
            reverse("password-change"),
            {
                "old_password": "0081306",
                "new_password1": "Culture-Secure-2026!",
                "new_password2": "Culture-Secure-2026!",
                "next": "http://localhost:5000",
            },
        )
        self.assertRedirects(response, "http://localhost:5000", fetch_redirect_response=False)
        profile = UserProfile.objects.get(employee_id="0081306")
        self.assertFalse(profile.must_change_password)
