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
    nombre = models.CharField(max_length=100)
    profesor = models.CharField(max_length=100)
    fecha = models.DateField()
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
