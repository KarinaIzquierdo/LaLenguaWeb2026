import re
from collections import defaultdict

from django.core.management.base import BaseCommand

from api.models import Notificacion, NotificacionEstudiante, NotificacionAdmin


def _normalizar_mensaje(mensaje):
    return re.sub(r'\d+', '#', (mensaje or '').strip().lower())


def _clave_datos(datos):
    if not isinstance(datos, dict):
        return None
    partes = []
    for k in sorted(datos.keys()):
        if k.endswith('_id') or k in ('mission_key', 'reto_id', 'evaluacion_id'):
            partes.append(f'{k}={datos[k]}')
    return '|'.join(partes) or None


def _clave_profesor(n):
    relaciones = (n.clase_relacionada_id, n.evaluacion_relacionada_id, n.estudiante_relacionado_id)
    if any(relaciones):
        return (n.profesor_id, n.tipo, *relaciones)
    return (n.profesor_id, n.tipo, _normalizar_mensaje(n.mensaje))


def _clave_estudiante(n):
    datos = _clave_datos(n.datos_adicionales)
    return (n.estudiante_id, n.tipo, datos or _normalizar_mensaje(n.mensaje))


def _clave_admin(n):
    datos = _clave_datos(n.datos_adicionales)
    return (n.admin_id, n.tipo, datos or _normalizar_mensaje(n.mensaje))


class Command(BaseCommand):
    help = (
        'Elimina notificaciones duplicadas (misma persona, mismo tipo y mismo objeto). '
        'Conserva la más reciente de cada grupo.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Solo muestra cuántas se borrarían, sin borrar nada',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        total = 0
        total += self._limpiar(Notificacion, 'created_at', _clave_profesor, 'Profesores', dry_run)
        total += self._limpiar(NotificacionEstudiante, 'fecha_creacion', _clave_estudiante, 'Estudiantes', dry_run)
        total += self._limpiar(NotificacionAdmin, 'created_at', _clave_admin, 'Administradores', dry_run)

        if dry_run:
            self.stdout.write(self.style.WARNING(f'[dry-run] Se borrarían {total} notificaciones duplicadas en total.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Listo: se borraron {total} notificaciones duplicadas en total.'))

    def _limpiar(self, modelo, campo_fecha, fn_clave, etiqueta, dry_run):
        grupos = defaultdict(list)
        for n in modelo.objects.order_by(f'-{campo_fecha}', '-id').iterator():
            grupos[fn_clave(n)].append(n)

        ids_borrar = []
        ids_marcar_no_leida = []
        for items in grupos.values():
            if len(items) < 2:
                continue
            conservar, duplicados = items[0], items[1:]
            if conservar.leida and any(not d.leida for d in duplicados):
                ids_marcar_no_leida.append(conservar.id)
            ids_borrar.extend(d.id for d in duplicados)

        antes = modelo.objects.count()
        if ids_borrar and not dry_run:
            modelo.objects.filter(id__in=ids_borrar).delete()
            if ids_marcar_no_leida:
                modelo.objects.filter(id__in=ids_marcar_no_leida).update(leida=False)

        self.stdout.write(
            f'{etiqueta}: {antes} notificaciones, {len(ids_borrar)} duplicadas'
            + (' (no borradas, dry-run)' if dry_run else ' borradas')
        )
        return len(ids_borrar)
