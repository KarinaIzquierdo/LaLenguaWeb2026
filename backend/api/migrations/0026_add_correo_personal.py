# Generated manually to add correo_personal field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_merge_20250918_1334'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='correo_personal',
            field=models.EmailField(blank=True, help_text='Correo personal para recuperación de contraseña', null=True),
        ),
    ]
