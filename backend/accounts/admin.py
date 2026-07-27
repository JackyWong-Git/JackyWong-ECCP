from django.contrib import admin

from .models import EmployeeDirectory, UserProfile


@admin.register(EmployeeDirectory)
class EmployeeDirectoryAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "employee_id",
        "department",
        "section",
        "team",
        "job_title",
        "registration_enabled",
        "claimed_by",
    )
    list_filter = ("registration_enabled", "is_active", "department")
    search_fields = ("full_name", "employee_id", "department", "section", "team")
    autocomplete_fields = ("claimed_by",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = (
        "display_name",
        "employee_id",
        "department",
        "section",
        "team",
        "job_title",
        "access_scope",
        "must_change_password",
        "allow_employee_id_login",
    )
    list_filter = ("department", "section", "team", "access_scope", "must_change_password")
    search_fields = ("display_name", "employee_id", "user__username", "job_title")
    autocomplete_fields = ("user",)
