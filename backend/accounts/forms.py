from django import forms
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm
from django.core.exceptions import ValidationError

from .models import EmployeeDirectory, UserProfile


class ECCPAuthenticationForm(AuthenticationForm):
    username = forms.CharField(
        label="账号",
        widget=forms.TextInput(
            attrs={
                "autocomplete": "username",
                "autofocus": True,
                "placeholder": "请输入工号或企业账号",
            }
        ),
    )
    password = forms.CharField(
        label="密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "autocomplete": "current-password",
                "placeholder": "请输入登录密码",
            }
        ),
    )
    remember_me = forms.BooleanField(label="保持登录状态", required=False)


class ECCPPasswordChangeForm(PasswordChangeForm):
    old_password = forms.CharField(
        label="当前密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "current-password", "placeholder": "请输入当前密码"}
        ),
    )
    new_password1 = forms.CharField(
        label="新密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "new-password", "placeholder": "至少 8 位，避免使用工号"}
        ),
    )
    new_password2 = forms.CharField(
        label="确认新密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "new-password", "placeholder": "再次输入新密码"}
        ),
    )


class EmployeeVerificationForm(forms.Form):
    employee_id = forms.CharField(
        label="工号",
        max_length=16,
        widget=forms.TextInput(
            attrs={
                "autocomplete": "off",
                "inputmode": "numeric",
                "placeholder": "请输入员工工号",
            }
        ),
    )
    full_name = forms.CharField(
        label="姓名",
        max_length=80,
        widget=forms.TextInput(
            attrs={"autocomplete": "name", "placeholder": "请输入员工姓名"}
        ),
    )

    def clean_employee_id(self):
        return self.cleaned_data["employee_id"].strip()

    def clean_full_name(self):
        return self.cleaned_data["full_name"].strip()

    def clean(self):
        cleaned_data = super().clean()
        employee_id = cleaned_data.get("employee_id")
        full_name = cleaned_data.get("full_name")
        if not employee_id or not full_name:
            return cleaned_data

        try:
            employee = EmployeeDirectory.objects.get(
                employee_id=employee_id,
                full_name=full_name,
                is_active=True,
                registration_enabled=True,
            )
        except EmployeeDirectory.DoesNotExist as exc:
            raise ValidationError("员工信息验证失败，请确认工号和姓名是否一致。") from exc

        if employee.claimed_by_id or UserProfile.objects.filter(employee_id=employee_id).exists():
            raise ValidationError("该员工已注册，请直接登录或联系管理员处理。")

        self.employee = employee
        return cleaned_data


class EmployeeRegistrationForm(forms.Form):
    password1 = forms.CharField(
        label="设置密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={
                "autocomplete": "new-password",
                "placeholder": "至少 8 位，不能仅使用数字",
            }
        ),
    )
    password2 = forms.CharField(
        label="确认密码",
        strip=False,
        widget=forms.PasswordInput(
            attrs={"autocomplete": "new-password", "placeholder": "再次输入密码"}
        ),
    )
    agreement = forms.BooleanField(label="同意企业信息安全规范")

    def __init__(self, *args, employee=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.employee = employee

    def clean_password1(self):
        password = self.cleaned_data["password1"]
        user_model = get_user_model()
        candidate = user_model(
            username=self.employee.employee_id,
            first_name=self.employee.full_name,
        )
        try:
            password_validation.validate_password(password, candidate)
        except ValidationError as error:
            raise forms.ValidationError(error.messages) from error
        return password

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            self.add_error("password2", "两次输入的密码不一致。")
        return cleaned_data
