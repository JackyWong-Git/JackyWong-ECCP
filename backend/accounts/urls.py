from django.shortcuts import redirect
from django.urls import path

from .views import ECCPLoginView, ECCPLogoutView, ECCPPasswordChangeView, session_view


urlpatterns = [
    path("", lambda _request: redirect("login")),
    path("accounts/login/", ECCPLoginView.as_view(), name="login"),
    path("accounts/logout/", ECCPLogoutView.as_view(), name="logout"),
    path("accounts/password-change/", ECCPPasswordChangeView.as_view(), name="password-change"),
    path("api/auth/session/", session_view, name="auth-session"),
]
