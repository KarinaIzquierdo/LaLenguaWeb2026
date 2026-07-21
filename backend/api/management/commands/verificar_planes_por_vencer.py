from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import CustomUser, Venta, Notificacion, NotificacionEstudiante
from api.email_utils import send_plan_expiration_notification


class Command(BaseCommand):
    help = 'Verifica planes por vencer y envía notificaciones a estudiantes y admins'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dias',
            type=int,
            default=7,
            help='Días de anticipación para considerar un plan por vencer (default: 7)'
        )

    def handle(self, *args, **options):
        dias_aviso = options['dias']
        hoy = timezone.now().date()
        fecha_limite = hoy + timedelta(days=dias_aviso)

        planes_por_vencer = Venta.objects.filter(
            estado='pagado',
            fecha_fin_plan__lte=fecha_limite,
            fecha_fin_plan__gte=hoy
        ).select_related('estudiante', 'plan')

        admin_emails = list(
            CustomUser.objects.filter(role='admin')
            .exclude(email='')
            .values_list('email', flat=True)
            .distinct()
        )
        
        usuarios_admin_profesor = CustomUser.objects.filter(
            role__in=['admin', 'profesor']
        )

        total_enviados = 0

        for venta in planes_por_vencer:
            notificacion_existente = NotificacionEstudiante.objects.filter(
                estudiante=venta.estudiante,
                tipo='plan_vencimiento',
                fecha_creacion__gte=timezone.now() - timedelta(hours=24)
            ).exists()

            if not notificacion_existente:
                dias_restantes = (venta.fecha_fin_plan - hoy).days
                fecha_str = venta.fecha_fin_plan.strftime('%d/%m/%Y')

                NotificacionEstudiante.objects.create(
                    estudiante=venta.estudiante,
                    tipo='plan_vencimiento',
                    mensaje=f'Tu plan {venta.plan.nombre} vence en {dias_restantes} días. Renueva pronto para continuar con tus clases.',
                    datos_adicionales={
                        'venta_id': venta.id,
                        'plan_nombre': venta.plan.nombre,
                        'fecha_fin': str(venta.fecha_fin_plan),
                        'dias_restantes': dias_restantes
                    }
                )

                if venta.estudiante.email:
                    send_plan_expiration_notification(
                        venta.estudiante.email,
                        venta.estudiante.get_full_name() or venta.estudiante.username,
                        venta.plan.nombre,
                        fecha_str,
                        dias_restantes,
                        is_admin=False
                    )
                    total_enviados += 1

                for admin_email in admin_emails:
                    send_plan_expiration_notification(
                        admin_email,
                        'Admin',
                        venta.plan.nombre,
                        fecha_str,
                        dias_restantes,
                        is_admin=True
                    )
                    total_enviados += 1
                
                # Notificaciones in-app para admins y profesores
                for usuario in usuarios_admin_profesor:
                    Notificacion.objects.get_or_create(
                        profesor=usuario,
                        tipo='plan_vencimiento',
                        titulo=f'Plan por vencer: {venta.plan.nombre}',
                        mensaje=f'El plan {venta.plan.nombre} de {venta.estudiante.get_full_name() or venta.estudiante.username} vence en {dias_restantes} días ({fecha_str}).',
                        prioridad='alta',
                        defaults={
                            'estudiante_relacionado': venta.estudiante,
                        }
                    )

        self.stdout.write(self.style.SUCCESS(
            f'Verificación completada. {planes_por_vencer.count()} planes por vencer, {total_enviados} notificaciones enviadas.'
        ))
