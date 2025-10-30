from django.db import models
from django.contrib.auth.models import AbstractUser

class Bloque(models.Model):
    """
    Modelo para los bloques de clases (horarios y niveles)
    """
    nombre = models.CharField(max_length=50, help_text="Nombre del turno: Mañana, Tarde, Noche")
    nivel = models.CharField(max_length=10, help_text="Nivel: A1, A2, B1, B2, C1, C2")
    estado = models.CharField(max_length=20, default='configurado', help_text="Estado del bloque")
    grupo_color = models.CharField(max_length=7, default='#FFC107', help_text="Color en formato hexadecimal")
    horario_inicio = models.TimeField(blank=True, null=True, help_text="Hora de inicio del bloque")
    horario_fin = models.TimeField(blank=True, null=True, help_text="Hora de fin del bloque")
    cupo_maximo = models.IntegerField(default=20, help_text="Número máximo de estudiantes")
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nivel', 'nombre']
        verbose_name = 'Bloque'
        verbose_name_plural = 'Bloques'
        unique_together = ['nombre', 'nivel']  # No puede haber dos "A1 - Mañana"
    
    def __str__(self):
        return f"{self.nivel} - {self.nombre}"
    
    @property
    def estudiantes_count(self):
        """Cuenta cuántos estudiantes están asignados a este bloque"""
        return CustomUser.objects.filter(bloque_asignado=str(self)).count()


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado para el sistema de aprendizaje de inglés
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    level = models.CharField(max_length=20, blank=True, null=True)
    
    # Campos adicionales para información completa del usuario
    birth_date = models.DateField(blank=True, null=True)
    cedula = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    english_level = models.CharField(max_length=30, blank=True, null=True)
    learning_goals = models.TextField(blank=True, null=True)
    profile_completed = models.BooleanField(default=False)
    
    # Campo para identificar si es profesor (mantener por compatibilidad)
    is_profesor = models.BooleanField(default=False)
    
    # Roles del sistema
    ROLE_CHOICES = [
        ('student', 'Estudiante'),
        ('profesor', 'Profesor'),
        ('admin', 'Administrador'),
        ('financiero', 'Financiero'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Bloque asignado para estudiantes
    bloque_asignado = models.CharField(max_length=50, blank=True, null=True)
    
    # Especialización asignada (relación con modelo Especializacion)
    especializacion = models.ForeignKey('Especializacion', on_delete=models.SET_NULL, null=True, blank=True, related_name='estudiantes')
    
    # Correo personal para recuperación de contraseña
    correo_personal = models.EmailField(blank=True, null=True, help_text="Correo personal para recuperación de contraseña")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.username} - {self.first_name} {self.last_name}"


class Evaluacion(models.Model):
    """
    Modelo para las evaluaciones subidas por los profesores
    """
    TIPO_CHOICES = [
        ('quiz', 'Quiz'),
        ('examen', 'Examen'),
        ('tarea', 'Tarea'),
    ]
    
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('publicada', 'Publicada'),
        ('archivada', 'Archivada'),
    ]
    
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='quiz')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    archivo = models.FileField(upload_to='evaluaciones/', null=True, blank=True)
    fecha_limite = models.DateTimeField(null=True, blank=True)
    
    # Relaciones
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='evaluaciones_creadas')
    estudiantes_asignados = models.ManyToManyField(CustomUser, related_name='evaluaciones_asignadas', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Evaluación'
        verbose_name_plural = 'Evaluaciones'
    
    def __str__(self):
        return f"{self.titulo} - {self.profesor.username}"
    
    @property
    def estudiantes_count(self):
        return self.estudiantes_asignados.count()
    
    @property
    def completadas_count(self):
        # Aquí se podría agregar lógica para contar evaluaciones completadas
        return 0


class Profesor(models.Model):
    """
    Modelo para información específica de profesores
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profesor_profile')
    especialidad = models.CharField(max_length=100, blank=True, null=True)
    biografia = models.TextField(blank=True, null=True)
    experiencia_anos = models.IntegerField(default=0)
    certificaciones = models.JSONField(default=list, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    disponibilidad = models.JSONField(default=dict, blank=True)  # Horarios disponibles
    tarifa_por_hora = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Prof. {self.user.first_name} {self.user.last_name} - {self.especialidad}"


class Clase(models.Model):
    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('activa', 'Activa'),
        ('completada', 'Completada'),
    ]
    
    nombre = models.CharField(max_length=100)
    profesor = models.CharField(max_length=100)
    fecha = models.DateField()
    hora = models.CharField(max_length=20, default='08:00')
    duracion = models.IntegerField(default=60, help_text="Duración en minutos")
    tema = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField(blank=True)
    tipo_clase = models.CharField(max_length=20, choices=[('individual', 'Individual'), ('grupal', 'Grupal')], default='individual')
    modalidad = models.CharField(max_length=20, choices=[('virtual', 'Virtual'), ('presencial', 'Presencial')], default='virtual')
    meet_link = models.URLField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='programada')
    estudiantes = models.ManyToManyField(CustomUser, related_name='clases', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - {self.profesor} ({self.fecha})"


class Evaluation(models.Model):
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='evaluations')
    tipo = models.CharField(max_length=30)  # e.g. 'vocabulary', 'grammar', 'comprehension'
    score = models.IntegerField(default=0)
    intentos = models.IntegerField(default=0)
    fecha = models.DateTimeField(auto_now_add=True)
    detalles = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.tipo} ({self.score}%)"


class MediaItem(models.Model):
    """
    Modelo para elementos multimedia de la galería
    """
    TYPE_CHOICES = [
        ('video', 'Video'),
        ('image', 'Imagen'),
    ]
    
    CATEGORY_CHOICES = [
        ('Videos', 'Videos'),
        ('Infografías', 'Infografías'),
        ('Fotos', 'Fotos'),
    ]
    
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    url = models.URLField(blank=True, null=True)
    # Archivo físico opcional; si se proporciona, podremos derivar la URL pública
    file = models.FileField(upload_to='gallery/', blank=True, null=True)
    thumbnail = models.URLField(blank=True, null=True)
    author = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Elemento Multimedia'
        verbose_name_plural = 'Elementos Multimedia'
    
    def __str__(self):
        return f"{self.title} ({self.type}) - {self.author}"


class Club(models.Model):
    """
    Club dirigido por un profesor con lista de estudiantes asignados
    """
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='clubs_dirigidos')
    students = models.ManyToManyField(CustomUser, related_name='clubs', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Prof: {self.profesor.get_full_name() or self.profesor.username})"


class ClubMaterial(models.Model):
    """
    Material semanal para un club. Puede ser URL o archivo subido
    """
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='materials')
    week = models.CharField(max_length=16)  # p.ej. 2025-W37
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=10, choices=[('url', 'URL'), ('file', 'Archivo')])
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='clubs/', blank=True, null=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='materials_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.week}"


class Especializacion(models.Model):
    """
    Modelo para las especializaciones de inglés disponibles
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    duracion = models.CharField(max_length=50)  # ej: "8 semanas", "3 meses"
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name = 'Especialización'
        verbose_name_plural = 'Especializaciones'
    
    def __str__(self):
        return f"{self.nombre} - {self.duracion}"


class RespuestaEvaluacion(models.Model):
    """
    Modelo para almacenar las respuestas de los estudiantes a las evaluaciones
    """
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='respuestas_evaluacion')
    evaluacion = models.ForeignKey(Evaluacion, on_delete=models.CASCADE, related_name='respuestas')
    archivo_respuesta = models.FileField(upload_to='respuestas/', null=True, blank=True)
    respuestas_json = models.JSONField(default=dict)
    tiempo_gastado = models.IntegerField(default=0, help_text="Tiempo en segundos")
    advertencias = models.IntegerField(default=0)
    completado = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    # Campos para calificación del profesor
    calificacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Calificación sobre 100")
    comentarios_profesor = models.TextField(blank=True, null=True, help_text="Comentarios del profesor")
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    calificado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='calificaciones_realizadas')

    class Meta:
        unique_together = ('estudiante', 'evaluacion')
        verbose_name = 'Respuesta de Evaluación'

    def __str__(self):
        return f"Respuesta de {self.estudiante.username} para {self.evaluacion.titulo}"


class Notificacion(models.Model):
    """
    Modelo para notificaciones del sistema dirigidas a profesores
    """
    TIPO_CHOICES = [
        ('clase_proxima', 'Clase Próxima'),
        ('evaluacion_subida', 'Evaluación Subida'),
        ('evaluacion_pendiente', 'Evaluación Pendiente'),
        ('estudiante_sin_evaluar', 'Estudiante Sin Evaluar'),
        ('clase_hoy', 'Clase Hoy'),
        ('evaluacion_vencida', 'Evaluación Vencida'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    leida = models.BooleanField(default=False)
    
    # Referencias opcionales a objetos relacionados
    clase_relacionada = models.ForeignKey(Clase, on_delete=models.CASCADE, null=True, blank=True)
    evaluacion_relacionada = models.ForeignKey(Evaluacion, on_delete=models.CASCADE, null=True, blank=True)
    estudiante_relacionado = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True, related_name='notificaciones_sobre_mi')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
    
    def __str__(self):
        return f"{self.titulo} - {self.profesor.username}"


class Plan(models.Model):
    """
    Modelo para los planes de precios disponibles
    """
    TIPO_CHOICES = [
        ('basico', 'Plan Básico'),
        ('especializado', 'Plan con Especialización'),
        ('premium', 'Plan Premium'),
    ]
    
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_meses = models.IntegerField(default=1)
    caracteristicas = models.JSONField(default=list)  # Lista de características incluidas
    activo = models.BooleanField(default=True)
    color_tema = models.CharField(max_length=7, default='#2563eb')  # Color hex para la tarjeta
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['precio_base']
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio_base}"


class Venta(models.Model):
    """
    Modelo para registrar las ventas realizadas
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('cancelado', 'Cancelado'),
        ('reembolsado', 'Reembolsado'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('paypal', 'PayPal'),
        ('otro', 'Otro'),
    ]
    
    # Información del cliente
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='ventas')
    
    # Información del plan
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='ventas')
    especializacion = models.ForeignKey(Especializacion, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas')
    
    # Información financiera
    precio_plan = models.DecimalField(max_digits=10, decimal_places=2)
    precio_especializacion = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Información de pago
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    referencia_pago = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Información adicional
    notas = models.TextField(blank=True, null=True)
    vendido_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas_realizadas')
    
    # Fechas
    fecha_venta = models.DateTimeField(auto_now_add=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    fecha_inicio_plan = models.DateField(null=True, blank=True)
    fecha_fin_plan = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
    
    def __str__(self):
        return f"Venta #{self.id} - {self.estudiante.username} - ${self.precio_total}"
    
    @property
    def dias_restantes(self):
        """Calcula los días restantes del plan"""
        if self.fecha_fin_plan:
            from datetime import date
            return (self.fecha_fin_plan - date.today()).days
        return None
