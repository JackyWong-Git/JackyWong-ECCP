from django import forms
from django.contrib.auth.forms import AuthenticationForm, PasswordChangeForm


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
