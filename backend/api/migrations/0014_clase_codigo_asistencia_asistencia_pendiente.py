# Generated manually - adds attendance code tracking for hybrid attendance verification

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0013_clase_duracion_real_clase_hora_fin_real_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='clase',
            name='codigo_asistencia',
            field=models.CharField(blank=True, help_text='Código único generado al iniciar la clase para marcar asistencia', max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='clase',
            name='codigo_expiracion',
            field=models.DateTimeField(blank=True, help_text='Fecha/hora de expiración del código de asistencia', null=True),
        ),
        migrations.AlterField(
            model_name='asistencia',
            name='estado',
            field=models.CharField(choices=[('presente', 'Presente'), ('ausente', 'Ausente'), ('tardanza', 'Tardanza'), ('justificado', 'Justificado'), ('pendiente', 'Pendiente')], default='ausente', max_length=20),
        ),
        migrations.AlterUniqueTogether(
            name='asistencia',
            unique_together={('estudiante', 'clase')},
        ),
    ]
