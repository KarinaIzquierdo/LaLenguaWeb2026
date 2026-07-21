# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_customuser_reto_completados_total_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='reto_intentos_fallidos_total',
            field=models.IntegerField(default=0, help_text='Total de intentos fallidos de retos diarios (cada intento cuenta)'),
        ),
    ]
