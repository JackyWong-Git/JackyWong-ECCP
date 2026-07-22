from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView
from django.http import JsonResponse
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache

from .forms import ECCPAuthenticationForm, ECCPPasswordChangeForm


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
