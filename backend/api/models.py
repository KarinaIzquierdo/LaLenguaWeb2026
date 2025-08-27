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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.username} - {self.first_name} {self.last_name}"
