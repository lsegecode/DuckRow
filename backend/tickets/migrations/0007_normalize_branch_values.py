from django.db import migrations

VALID_BRANCHES = ('HQ', 'BRANCH')


def normalize_ticket_branches(apps, schema_editor):
    """Map any legacy branch code outside the current choices to HQ."""
    Ticket = apps.get_model('tickets', 'Ticket')
    Ticket.objects.exclude(branch__in=VALID_BRANCHES).update(branch='HQ')


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0006_ticket_branch'),
    ]

    operations = [
        migrations.RunPython(normalize_ticket_branches, migrations.RunPython.noop),
    ]
