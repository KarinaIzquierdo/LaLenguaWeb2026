import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser

email = 'ortizizquierdolaurakaria@gmail.com'
try:
    user = CustomUser.objects.get(email=email)
    print(f"Usuario: {user.username}")
    print(f"Email: {user.email}")
    print(f"Nombre: {user.first_name} {user.last_name}")
    print(f"Rol: {user.role}")
except CustomUser.DoesNotExist:
    print("Usuario no encontrado")
