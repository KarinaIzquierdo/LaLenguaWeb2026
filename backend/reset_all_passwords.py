#!/usr/bin/env python3
"""
Script para sincronizar y resetear contraseñas de todos los usuarios
"""
import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser

def reset_all_passwords():
    DEFAULT_PASSWORDS = {
        'admin': 'Admin1234*',
        'profesor': 'Profesor1234*',
        'student': 'Estudiante1234*'
    }
    
    users = CustomUser.objects.all()
    print(f"\nTotal de usuarios encontrados: {users.count()}")
    print("-" * 75)
    print(f"{'ROL':<12} | {'USERNAME / EMAIL':<38} | {'CONTRASEÑA ASIGNADA'}")
    print("-" * 75)
    
    for u in users:
        role = u.role or ('profesor' if u.is_profesor else ('admin' if u.is_superuser else 'student'))
        u.role = role
        u.is_active = True
        
        # Asignar contraseña estándar según el rol
        pwd = DEFAULT_PASSWORDS.get(role, 'LaLengua2026*')
        u.set_password(pwd)
        u.save()
        
        ident = u.email or u.username
        print(f"{role:<12} | {ident:<38} | {pwd}")

    print("-" * 75)
    print("✅ Todas las contraseñas se actualizaron con éxito.\n")

if __name__ == '__main__':
    reset_all_passwords()
