from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import EmployeeDirectory, UserProfile


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
        self.assertContains(response, reverse("register"))

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


@override_settings(LOGIN_SUCCESS_ALLOWED_HOSTS={"localhost:5000"})
class EmployeeRegistrationTests(TestCase):
    def setUp(self):
        self.employee = EmployeeDirectory.objects.create(
            employee_id="6123456",
            full_name="测试员工",
            department="人事总务部",
            section="员工关系管理科",
            team="企业文化系",
            job_title="科员",
            source_reference="test-roster.xlsx / row 2",
        )

    def verify_employee(self):
        return self.client.post(
            reverse("register"),
            {
                "action": "verify",
                "employee_id": self.employee.employee_id,
                "full_name": self.employee.full_name,
            },
        )

    def test_registration_page_requires_matching_employee_identity(self):
        response = self.client.post(
            reverse("register"),
            {
                "action": "verify",
                "employee_id": self.employee.employee_id,
                "full_name": "错误姓名",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "员工信息验证失败")
        self.assertNotContains(response, self.employee.department)

    def test_verified_employee_can_register_and_login(self):
        verification_response = self.verify_employee()
        self.assertEqual(verification_response.context["step"], "register")
        self.assertContains(verification_response, "身份验证已通过")
        token = verification_response.context["verification_token"]

        response = self.client.post(
            reverse("register"),
            {
                "action": "register",
                "verification_token": token,
                "password1": "Culture-Story-2026!",
                "password2": "Culture-Story-2026!",
                "agreement": "on",
            },
        )
        self.assertRedirects(
            response,
            "http://localhost:5000",
            fetch_redirect_response=False,
        )

        profile = UserProfile.objects.select_related("user").get(
            employee_id=self.employee.employee_id
        )
        self.assertEqual(profile.user.username, self.employee.employee_id)
        self.assertTrue(profile.allow_employee_id_login)
        self.assertFalse(profile.must_change_password)
        self.assertTrue(profile.user.groups.filter(name="ECCP 员工").exists())
        self.employee.refresh_from_db()
        self.assertEqual(self.employee.claimed_by_id, profile.user_id)

    def test_registered_employee_cannot_claim_a_second_account(self):
        user = get_user_model().objects.create_user(
            username=self.employee.employee_id,
            password="Culture-Story-2026!",
        )
        self.employee.claimed_by = user
        self.employee.save()

        response = self.verify_employee()
        self.assertContains(response, "该员工已注册")
        self.assertEqual(response.context["step"], "verify")

    def test_tampered_verification_token_is_rejected(self):
        response = self.client.post(
            reverse("register"),
            {
                "action": "register",
                "verification_token": "tampered-token",
                "password1": "Culture-Story-2026!",
                "password2": "Culture-Story-2026!",
                "agreement": "on",
            },
        )
        self.assertContains(response, "员工验证已失效")
        self.assertEqual(response.context["step"], "verify")


class EmployeeDirectoryImportTests(TestCase):
    def test_imports_employee_workbook_and_links_existing_profile(self):
        from openpyxl import Workbook

        user = get_user_model().objects.create_user(username="existing.member")
        UserProfile.objects.create(
            user=user,
            employee_id="6000001",
            display_name="已有员工",
            department="人事总务部",
        )

        with TemporaryDirectory() as directory:
            workbook_path = Path(directory) / "employees.xlsx"
            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "员工名册"
            sheet.append(["员工ID号", "部门", "科室", "系", "借调/轮岗部门", "姓名", "职务"])
            sheet.append(
                [
                    "6000001",
                    "人事总务部",
                    "员工关系管理科",
                    "企业文化系",
                    "",
                    "已有员工",
                    "科员",
                ]
            )
            sheet.append(["6000002", "销售本部", "", "", "", "新员工", "担当"])
            workbook.save(workbook_path)

            call_command(
                "import_employee_directory",
                workbook_path,
                registration_scope="enterprise-culture",
                verbosity=0,
            )

        existing = EmployeeDirectory.objects.get(employee_id="6000001")
        new_employee = EmployeeDirectory.objects.get(employee_id="6000002")
        self.assertEqual(existing.claimed_by_id, user.id)
        self.assertTrue(existing.registration_enabled)
        self.assertFalse(new_employee.registration_enabled)
