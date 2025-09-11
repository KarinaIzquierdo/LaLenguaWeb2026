from django.db import models
from django.contrib.auth.models import AbstractUser

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
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Bloque asignado para estudiantes
    bloque_asignado = models.CharField(max_length=50, blank=True, null=True)
    
    # Especialización asignada (relación con modelo Especializacion)
    especializacion = models.ForeignKey('Especializacion', on_delete=models.SET_NULL, null=True, blank=True, related_name='estudiantes')
    
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

    class Meta:
        unique_together = ('estudiante', 'evaluacion')
        verbose_name = 'Respuesta de Evaluación'

    def __str__(self):
        return f"Respuesta de {self.estudiante.username} para {self.evaluacion.titulo}"
