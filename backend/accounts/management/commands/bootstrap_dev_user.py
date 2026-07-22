from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create or update the local ECCP development user."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--email", default="")

    def handle(self, *args, **options):
        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(username=options["username"])
        user.email = options["email"]
        user.is_staff = True
        user.set_password(options["password"])
        user.save()
        action = "created" if created else "updated"
        self.stdout.write(self.style.SUCCESS(f"Development user {action}: {user.username}"))
