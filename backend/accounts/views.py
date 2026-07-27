from django.conf import settings
from django.contrib.auth import get_user_model, login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView
from django.core import signing
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache

from .forms import (
    ECCPAuthenticationForm,
    ECCPPasswordChangeForm,
    EmployeeRegistrationForm,
    EmployeeVerificationForm,
)
from .models import EmployeeDirectory, UserProfile
from .services import MEMBER_PERMISSION_CODENAMES, ensure_permission_group


REGISTRATION_TOKEN_SALT = "eccp.employee-registration"
REGISTRATION_TOKEN_MAX_AGE = 60 * 10


class ECCPLoginView(LoginView):
    authentication_form = ECCPAuthenticationForm
    template_name = "registration/login.html"
    redirect_authenticated_user = True

    def form_valid(self, form):
        response = super().form_valid(form)
        if not form.cleaned_data.get("remember_me"):
            self.request.session.set_expiry(0)
        return response

    def get_success_url_allowed_hosts(self):
        return super().get_success_url_allowed_hosts() | settings.LOGIN_SUCCESS_ALLOWED_HOSTS


class ECCPLogoutView(LogoutView):
    http_method_names = ["post", "options"]


class ECCPPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    form_class = ECCPPasswordChangeForm
    template_name = "registration/password_change.html"

    def get_success_url(self):
        candidate = self.request.POST.get("next") or self.request.GET.get("next")
        if candidate and url_has_allowed_host_and_scheme(
            candidate,
            allowed_hosts=settings.LOGIN_SUCCESS_ALLOWED_HOSTS | {self.request.get_host()},
            require_https=self.request.is_secure(),
        ):
            return candidate
        return settings.LOGIN_REDIRECT_URL

    def form_valid(self, form):
        response = super().form_valid(form)
        profile = getattr(self.request.user, "eccp_profile", None)
        if profile and profile.must_change_password:
            profile.must_change_password = False
            profile.save(update_fields=["must_change_password"])
        return response

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["next"] = self.request.POST.get("next") or self.request.GET.get("next")
        context["login_url"] = reverse("login")
        return context


def _safe_next_url(request):
    candidate = request.POST.get("next") or request.GET.get("next")
    if candidate and url_has_allowed_host_and_scheme(
        candidate,
        allowed_hosts=settings.LOGIN_SUCCESS_ALLOWED_HOSTS | {request.get_host()},
        require_https=request.is_secure(),
    ):
        return candidate
    return settings.LOGIN_REDIRECT_URL


@never_cache
@require_http_methods(["GET", "POST"])
def register_view(request):
    if request.user.is_authenticated:
        return redirect(_safe_next_url(request))

    next_url = request.POST.get("next") or request.GET.get("next", "")
    verification_form = EmployeeVerificationForm()
    registration_form = None
    employee = None
    token = ""
    step = "verify"
    verification_error = ""

    if request.method == "POST" and request.POST.get("action") == "verify":
        verification_form = EmployeeVerificationForm(request.POST)
        if verification_form.is_valid():
            employee = verification_form.employee
            token = signing.dumps(
                {"employee_id": employee.employee_id, "full_name": employee.full_name},
                salt=REGISTRATION_TOKEN_SALT,
                compress=True,
            )
            registration_form = EmployeeRegistrationForm(employee=employee)
            step = "register"

    if request.method == "POST" and request.POST.get("action") == "register":
        token = request.POST.get("verification_token", "")
        try:
            verified = signing.loads(
                token,
                salt=REGISTRATION_TOKEN_SALT,
                max_age=REGISTRATION_TOKEN_MAX_AGE,
            )
            employee = EmployeeDirectory.objects.get(
                employee_id=verified["employee_id"],
                full_name=verified["full_name"],
                is_active=True,
                registration_enabled=True,
            )
        except (
            signing.BadSignature,
            signing.SignatureExpired,
            EmployeeDirectory.DoesNotExist,
            KeyError,
        ):
            verification_error = "员工验证已失效，请重新验证工号和姓名。"
        else:
            registration_form = EmployeeRegistrationForm(
                request.POST,
                employee=employee,
            )
            step = "register"
            if registration_form.is_valid():
                try:
                    with transaction.atomic():
                        locked_employee = EmployeeDirectory.objects.select_for_update().get(
                            pk=employee.pk
                        )
                        if locked_employee.claimed_by_id or UserProfile.objects.filter(
                            employee_id=locked_employee.employee_id
                        ).exists():
                            raise IntegrityError("Employee account already claimed")

                        user_model = get_user_model()
                        user = user_model.objects.create_user(
                            username=locked_employee.employee_id,
                            password=registration_form.cleaned_data["password1"],
                            first_name=locked_employee.full_name,
                        )
                        UserProfile.objects.create(
                            user=user,
                            employee_id=locked_employee.employee_id,
                            display_name=locked_employee.full_name,
                            department=locked_employee.department,
                            section=locked_employee.section,
                            team=locked_employee.team,
                            job_title=locked_employee.job_title,
                            access_scope="self",
                            must_change_password=False,
                            allow_employee_id_login=True,
                            source_reference=locked_employee.source_reference,
                        )
                        member_group = ensure_permission_group(
                            "ECCP 员工",
                            MEMBER_PERMISSION_CODENAMES,
                        )
                        user.groups.add(member_group)
                        locked_employee.claimed_by = user
                        locked_employee.save(update_fields=["claimed_by", "updated_at"])
                except IntegrityError:
                    registration_form.add_error(
                        None, "该员工账号已被注册，请直接登录或联系管理员。"
                    )
                else:
                    login(request, user, backend="accounts.backends.UsernameOrEmployeeIdBackend")
                    return redirect(_safe_next_url(request))

    return render(
        request,
        "registration/register.html",
        {
            "step": step,
            "verification_form": verification_form,
            "registration_form": registration_form,
            "employee": employee,
            "verification_token": token,
            "verification_error": verification_error,
            "next": next_url,
            "login_url": reverse("login"),
        },
    )


@never_cache
def session_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False}, status=401)

    profile = getattr(request.user, "eccp_profile", None)
    display_name = profile.display_name if profile else request.user.get_full_name() or request.user.get_username()
    permissions = ["*"] if request.user.is_superuser else sorted(request.user.get_all_permissions())
    return JsonResponse(
        {
            "authenticated": True,
            "user": {
                "id": request.user.pk,
                "username": request.user.get_username(),
                "displayName": display_name,
                "email": request.user.email,
                "isStaff": request.user.is_staff,
                "isSuperuser": request.user.is_superuser,
                "employeeId": profile.employee_id if profile else "",
                "department": profile.department if profile else "",
                "section": profile.section if profile else "",
                "team": profile.team if profile else "",
                "jobTitle": profile.job_title if profile else "",
                "organizationLabel": profile.organization_label if profile else "",
                "accessScope": profile.access_scope if profile else "self",
                "mustChangePassword": profile.must_change_password if profile else False,
                "permissions": permissions,
            },
        }
    )
