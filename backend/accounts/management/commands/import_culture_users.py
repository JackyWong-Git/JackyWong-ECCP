import json
import os
from pathlib import Path

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import UserProfile


MEMBER_PERMISSION_CODENAMES = {
    "access_workspace",
    "use_ai_assistant",
    "create_content",
    "manage_projects",
    "view_tasks",
    "view_topics",
    "view_knowledge",
    "view_analytics",
}
ADMIN_PERMISSION_CODENAMES = MEMBER_PERMISSION_CODENAMES | {"manage_platform"}


class Command(BaseCommand):
    help = "Import the initial enterprise culture users and assign ECCP permission groups."

    def add_arguments(self, parser):
        default_data = Path(__file__).resolve().parents[2] / "data" / "enterprise_culture_users.json"
        parser.add_argument("--data", type=Path, default=default_data)
        parser.add_argument("--superuser-password", default=os.environ.get("ECCP_SUPERUSER_PASSWORD"))
        parser.add_argument("--reset-passwords", action="store_true")
        parser.add_argument("--dry-run", action="store_true")

    @transaction.atomic
    def handle(self, *args, **options):
        payload = json.loads(options["data"].read_text(encoding="utf-8"))
        users = payload.get("users", [])
        if not users:
            raise CommandError("The enterprise culture user data is empty.")

        member_group, _ = Group.objects.get_or_create(name="企业文化系成员")
        admin_group, _ = Group.objects.get_or_create(name="ECCP 超级管理员")
        permissions = Permission.objects.filter(
            content_type__app_label="accounts",
            codename__in=ADMIN_PERMISSION_CODENAMES,
        )
        permission_map = {permission.codename: permission for permission in permissions}
        missing = ADMIN_PERMISSION_CODENAMES - permission_map.keys()
        if missing:
            raise CommandError(f"Missing ECCP permissions: {', '.join(sorted(missing))}. Run migrations first.")

        member_group.permissions.set(permission_map[name] for name in MEMBER_PERMISSION_CODENAMES)
        admin_group.permissions.set(permission_map[name] for name in ADMIN_PERMISSION_CODENAMES)

        user_model = get_user_model()
        managed_groups = [member_group, admin_group]
        created_count = 0
        updated_count = 0
        active_employee_ids = {record["employee_id"] for record in users}

        for record in users:
            is_admin = record["role"] == "super_admin"
            user, created = user_model.objects.get_or_create(username=record["username"])
            profile_was_missing = not UserProfile.objects.filter(user=user).exists()
            user.first_name = record["name"]
            user.is_staff = is_admin
            user.is_superuser = is_admin
            user.is_active = True

            if is_admin:
                password = options["superuser_password"]
                if created and not password:
                    raise CommandError("ECCP_SUPERUSER_PASSWORD is required when creating the super administrator.")
                if password:
                    user.set_password(password)
            elif created or profile_was_missing or options["reset_passwords"]:
                user.set_password(record["employee_id"])
            user.save()

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.employee_id = record["employee_id"]
            profile.display_name = record["name"]
            profile.department = payload["department"]
            profile.section = payload.get("section", "")
            profile.team = record.get("team", "")
            profile.job_title = record.get("job_title", "")
            profile.access_scope = record["scope"]
            profile.allow_employee_id_login = is_admin
            profile.source_reference = f'{payload["source"]} / Excel row {record["source_row"]}'
            if is_admin:
                profile.must_change_password = False
            elif created or profile_was_missing or options["reset_passwords"]:
                profile.must_change_password = True
            profile.save()

            user.groups.remove(*managed_groups)
            user.groups.add(admin_group if is_admin else member_group)
            created_count += int(created)
            updated_count += int(not created)
            self.stdout.write(f'{"CREATE" if created else "UPDATE"} {profile.display_name} ({user.username})')

        stale_profiles = UserProfile.objects.filter(
            user__groups__in=managed_groups,
        ).exclude(employee_id__in=active_employee_ids).select_related("user").distinct()
        deactivated_count = 0
        for profile in stale_profiles:
            profile.user.groups.remove(*managed_groups)
            profile.user.is_active = False
            profile.user.save(update_fields=["is_active"])
            deactivated_count += 1
            self.stdout.write(f"DEACTIVATE {profile.display_name} ({profile.user.username})")

        if options["dry_run"]:
            transaction.set_rollback(True)
            self.stdout.write(self.style.WARNING("Dry run complete; database changes were rolled back."))
            return

        self.stdout.write(
            self.style.SUCCESS(
                f"Enterprise culture import complete: {created_count} created, {updated_count} updated, "
                f"{deactivated_count} deactivated."
            )
        )
