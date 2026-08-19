# Generated for DuckRow assigned_at and resolved_at timestamps

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0002_ticket_ticket_type_ticketattachment'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='assigned_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ticket',
            name='resolved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
