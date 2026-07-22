from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend

from .models import UserProfile


class UsernameOrEmployeeIdBackend(ModelBackend):
    """Authenticate by username, with an explicitly enabled employee ID alias."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None

        user_model = get_user_model()
        try:
            user = user_model._default_manager.get(username__iexact=username)
        except user_model.DoesNotExist:
            try:
                profile = UserProfile.objects.select_related("user").get(
                    employee_id=username,
                    allow_employee_id_login=True,
                )
                user = profile.user
            except UserProfile.DoesNotExist:
                user_model().set_password(password)
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
