from django.contrib.auth.models import Group, Permission
from django.core.exceptions import ImproperlyConfigured


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


def ensure_permission_group(name, codenames):
    group, _ = Group.objects.get_or_create(name=name)
    permissions = Permission.objects.filter(
        content_type__app_label="accounts",
        codename__in=codenames,
    )
    permission_map = {permission.codename: permission for permission in permissions}
    missing = set(codenames) - permission_map.keys()
    if missing:
        raise ImproperlyConfigured(
            f"Missing ECCP permissions: {', '.join(sorted(missing))}. Run migrations first."
        )
    group.permissions.set(permission_map[codename] for codename in codenames)
    return group
