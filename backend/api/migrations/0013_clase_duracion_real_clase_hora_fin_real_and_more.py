# Generated manually - adds real start/end tracking fields to Clase

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_historialdocente_chatroom_chatmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='clase',
            name='hora_inicio_real',
            field=models.DateTimeField(blank=True, help_text='Hora real en la que el profesor inició la clase', null=True),
        ),
        migrations.AddField(
            model_name='clase',
            name='hora_fin_real',
            field=models.DateTimeField(blank=True, help_text='Hora real en la que el profesor finalizó la clase', null=True),
        ),
        migrations.AddField(
            model_name='clase',
            name='duracion_real',
            field=models.IntegerField(blank=True, help_text='Duración real en minutos calculada al finalizar', null=True),
        ),
    ]
