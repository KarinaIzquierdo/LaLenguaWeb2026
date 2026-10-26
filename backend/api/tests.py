from django.test import TestCase
from django.utils import timezone
from datetime import timedelta

from api.models import (
    CustomUser, Plan, Venta, Suscripcion, Clase, Evaluacion,
    RespuestaEvaluacion, Notificacion, NotificacionEstudiante, NotificacionAdmin,
)
from api.notificacion_admin_views import generar_notificaciones_admin
from api.notificacion_estudiante_views import (
    generar_notificaciones_estudiante, TIPOS_VISIBLES,
)
from api.notificacion_views import generar_notificaciones_automaticas


class NotificacionesAdminTest(TestCase):
    """Fallo en pago (venta pendiente) y suscripción vencida deben notificar al admin."""

    def setUp(self):
        self.hoy = timezone.localdate()
        self.admin = CustomUser.objects.create_user(
            username='admin1', email='admin@test.co', password='x', role='admin')
        self.estudiante = CustomUser.objects.create_user(
            username='est1', email='est@test.co', password='x', role='student',
            first_name='Juan', last_name='Perez')
        self.plan = Plan.objects.create(
            nombre='Plan Básico', tipo='basico', descripcion='test', precio_base=100)

    def test_venta_pendiente_notifica_fallo_pago(self):
        Venta.objects.create(
            estudiante=self.estudiante, plan=self.plan, precio_plan=100,
            precio_total=100, metodo_pago='tarjeta', estado='pendiente')

        generar_notificaciones_admin(self.admin)

        notif = NotificacionAdmin.objects.get(admin=self.admin, tipo='venta_pendiente')
        self.assertIn('Error en el pago del estudiante Juan Perez', notif.mensaje)
        self.assertIn('Requiere gestión', notif.mensaje)
        self.assertEqual(notif.prioridad, 'alta')

    def test_suscripcion_vencida_notifica_y_sincroniza_estado(self):
        """Una suscripción con fecha_fin pasada pero estado='activa' desactualizado
        debe generar 'plan_vencido' y corregir su estado."""
        venta = Venta.objects.create(
            estudiante=self.estudiante, plan=self.plan, precio_plan=100,
            precio_total=100, metodo_pago='efectivo', estado='pagado')
        sub = Suscripcion.objects.create(
            venta=venta, estudiante=self.estudiante, plan=self.plan,
            fecha_inicio=self.hoy - timedelta(days=32),
            fecha_fin=self.hoy - timedelta(days=2),
            estado='activa')

        generar_notificaciones_admin(self.admin)

        sub.refresh_from_db()
        self.assertEqual(sub.estado, 'vencida')
        notif = NotificacionAdmin.objects.get(admin=self.admin, tipo='plan_vencido')
        self.assertIn('venció', notif.mensaje)
        self.assertEqual(notif.prioridad, 'urgente')

    def test_no_se_duplican_notificaciones(self):
        Venta.objects.create(
            estudiante=self.estudiante, plan=self.plan, precio_plan=100,
            precio_total=100, metodo_pago='tarjeta', estado='pendiente')
        generar_notificaciones_admin(self.admin)
        generar_notificaciones_admin(self.admin)
        self.assertEqual(
            NotificacionAdmin.objects.filter(
                admin=self.admin, tipo='venta_pendiente').count(), 1)


class NotificacionesEstudianteTest(TestCase):
    """Solo 3 tipos visibles: recordatorio de clase, tarea asignada y nota."""

    def setUp(self):
        self.hoy = timezone.localdate()
        self.ahora = timezone.now()
        self.estudiante = CustomUser.objects.create_user(
            username='est2', email='est2@test.co', password='x', role='student')
        self.profesor = CustomUser.objects.create_user(
            username='prof2', email='prof2@test.co', password='x', role='profesor',
            first_name='Laura', last_name='Gomez')

    def test_clase_pronto_dentro_de_ventana(self):
        # clase.hora guarda hora LOCAL (America/Bogota), no UTC
        inicio_local = timezone.localtime(self.ahora + timedelta(minutes=15))
        clase = Clase.objects.create(
            nombre='Inglés B1', tema='Speaking', profesor='Laura Gomez',
            fecha=inicio_local.date(),
            hora=inicio_local.strftime('%H:%M'),
            estado='programada', meet_link='https://meet.google.com/abc')
        clase.estudiantes.add(self.estudiante)

        generar_notificaciones_estudiante(self.estudiante)

        notif = NotificacionEstudiante.objects.get(
            estudiante=self.estudiante, tipo='clase_pronto')
        self.assertIn('empieza en', notif.mensaje)
        self.assertEqual(notif.datos_adicionales['meet_link'], clase.meet_link)

    def test_clase_lejos_no_notifica(self):
        inicio_local = timezone.localtime(self.ahora + timedelta(hours=3))
        clase = Clase.objects.create(
            nombre='Inglés B1', tema='Speaking', profesor='Laura Gomez',
            fecha=inicio_local.date(),
            hora=inicio_local.strftime('%H:%M'),
            estado='programada')
        clase.estudiantes.add(self.estudiante)

        generar_notificaciones_estudiante(self.estudiante)

        self.assertFalse(NotificacionEstudiante.objects.filter(
            estudiante=self.estudiante, tipo='clase_pronto').exists())

    def test_evaluacion_publicada_notifica(self):
        ev = Evaluacion.objects.create(
            titulo='Quiz Vocabulario', tipo='tarea', estado='publicada',
            profesor=self.profesor, fecha_limite=self.ahora + timedelta(days=5))
        ev.estudiantes_asignados.add(self.estudiante)

        generar_notificaciones_estudiante(self.estudiante)

        notif = NotificacionEstudiante.objects.get(
            estudiante=self.estudiante, tipo='evaluacion_asignada')
        self.assertIn('Quiz Vocabulario', notif.mensaje)
        self.assertIn('fecha límite', notif.mensaje)

    def test_evaluacion_borrador_no_notifica(self):
        ev = Evaluacion.objects.create(
            titulo='Borrador', tipo='tarea', estado='borrador', profesor=self.profesor)
        ev.estudiantes_asignados.add(self.estudiante)

        generar_notificaciones_estudiante(self.estudiante)

        self.assertFalse(NotificacionEstudiante.objects.filter(
            estudiante=self.estudiante, tipo='evaluacion_asignada').exists())

    def test_calificacion_notifica(self):
        ev = Evaluacion.objects.create(
            titulo='Quiz Vocabulario', tipo='examen', estado='publicada',
            profesor=self.profesor)
        ev.estudiantes_asignados.add(self.estudiante)
        RespuestaEvaluacion.objects.create(
            evaluacion=ev, estudiante=self.estudiante, completado=True,
            calificacion=85, fecha_calificacion=self.ahora)

        generar_notificaciones_estudiante(self.estudiante)

        notif = NotificacionEstudiante.objects.get(
            estudiante=self.estudiante, tipo='calificacion_disponible')
        self.assertIn('calificó', notif.mensaje)
        self.assertIn('85/100', notif.mensaje)

    def test_tipos_no_visibles_se_ocultan(self):
        NotificacionEstudiante.objects.create(
            estudiante=self.estudiante, tipo='mision_disponible', mensaje='vieja')
        visibles = NotificacionEstudiante.objects.filter(
            estudiante=self.estudiante, tipo__in=TIPOS_VISIBLES)
        self.assertFalse(visibles.filter(tipo='mision_disponible').exists())


class NotificacionesProfesorTest(TestCase):
    """El profesor solo recibe avisos de tareas entregadas para revisión."""

    def setUp(self):
        self.profesor = CustomUser.objects.create_user(
            username='prof3', email='prof3@test.co', password='x', role='profesor')
        self.estudiante = CustomUser.objects.create_user(
            username='est3', email='est3@test.co', password='x', role='student',
            first_name='Maria', last_name='Lopez')
        self.ev = Evaluacion.objects.create(
            titulo='Ensayo', tipo='tarea', estado='publicada', profesor=self.profesor)

    def test_tarea_entregada_notifica_al_profesor(self):
        RespuestaEvaluacion.objects.create(
            evaluacion=self.ev, estudiante=self.estudiante, completado=True)

        generar_notificaciones_automaticas(self.profesor.id)

        notif = Notificacion.objects.get(
            profesor=self.profesor, tipo='evaluacion_subida')
        self.assertIn('Maria Lopez', notif.mensaje)
        self.assertIn('ha enviado su tarea para revisión', notif.mensaje)

    def test_respuesta_incompleta_no_notifica(self):
        RespuestaEvaluacion.objects.create(
            evaluacion=self.ev, estudiante=self.estudiante, completado=False)

        generar_notificaciones_automaticas(self.profesor.id)

        self.assertFalse(Notificacion.objects.filter(
            profesor=self.profesor).exists())
