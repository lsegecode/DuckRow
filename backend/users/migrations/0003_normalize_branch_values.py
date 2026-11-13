from django.db import migrations

VALID_BRANCHES = ('HQ', 'BRANCH', 'ALL')


def normalize_profile_branches(apps, schema_editor):
    """Map any legacy branch code outside the current choices to HQ."""
    UserProfile = apps.get_model('users', 'UserProfile')
    UserProfile.objects.exclude(branch__in=VALID_BRANCHES).update(branch='HQ')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_userprofile_branch'),
    ]

    operations = [
        migrations.RunPython(normalize_profile_branches, migrations.RunPython.noop),
    ]
