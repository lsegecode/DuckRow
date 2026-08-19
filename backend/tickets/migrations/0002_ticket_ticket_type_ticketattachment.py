# Generated for DuckRow ticket types and attachments

import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tickets', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ticket',
            name='ticket_type',
            field=models.CharField(choices=[('BUG', 'Bug'), ('FEATURE', 'Feature')], default='BUG', max_length=10),
        ),
        migrations.CreateModel(
            name='TicketAttachment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('file', models.FileField(upload_to='ticket_attachments/%Y/%m/')),
                ('file_name', models.CharField(blank=True, max_length=255)),
                ('file_size', models.PositiveIntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('ticket', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attachments', to='tickets.ticket')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
    ]
