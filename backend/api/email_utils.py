"""
Utilidades para envío de emails con Django
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def send_welcome_email(user_email, user_name, user_role, temporary_password, login_url='http://localhost:5173'):
    """
    Envía un email de bienvenida al usuario recién registrado
    
    Args:
        user_email (str): Correo personal del usuario
        user_name (str): Nombre completo del usuario
        user_role (str): Rol del usuario (Estudiante, Profesor, Admin, etc.)
        temporary_password (str): Contraseña temporal asignada
        login_url (str): URL para iniciar sesión
    
    Returns:
        bool: True si el email se envió correctamente, False en caso contrario
    """
    try:
        # Contexto para las plantillas
        context = {
            'user_name': user_name,
            'user_email': user_email,
            'user_role': user_role,
            'user_password': temporary_password,
            'login_url': login_url,
        }
        
        # Renderizar plantillas HTML y texto
        html_content = render_to_string('emails/welcome_email.html', context)
        text_content = render_to_string('emails/welcome_email.txt', context)
        
        # Crear el email
        subject = '🦩 ¡Bienvenido a The Language! - Tus credenciales de acceso'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user_email]
        
        # Crear mensaje con ambas versiones (HTML y texto plano)
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar email
        email.send(fail_silently=False)
        
        print(f"✅ Email de bienvenida enviado exitosamente a: {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error al enviar email de bienvenida a {user_email}: {str(e)}")
        return False


def send_password_reset_email(user_email, user_name, reset_link):
    """
    Envía un email con el enlace para restablecer la contraseña
    
    Args:
        user_email (str): Correo personal del usuario
        user_name (str): Nombre del usuario
        reset_link (str): Enlace completo para restablecer contraseña
    
    Returns:
        bool: True si el email se envió correctamente, False en caso contrario
    """
    try:
        subject = '🔐 Recuperación de Contraseña - The Language'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user_email]
        
        # Contenido del email en texto plano
        text_content = f"""
Hola {user_name},

Has solicitado recuperar tu contraseña para The Language.

Haz clic en el siguiente enlace para crear una nueva contraseña:
{reset_link}

Este enlace expirará en 1 hora por seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
El equipo de The Language
        """
        
        # Contenido HTML
        html_content = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: white; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; margin: 20px 0; }}
        .warning {{ background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{user_name}</strong>,</p>
            <p>Has solicitado recuperar tu contraseña para The Language.</p>
            <center>
                <a href="{reset_link}" class="button">Restablecer Contraseña</a>
            </center>
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
            </div>
            <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            <p>Saludos,<br><strong>El equipo de The Language</strong></p>
        </div>
    </div>
</body>
</html>
        """
        
        # Crear mensaje con ambas versiones
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar email
        email.send(fail_silently=False)
        
        print(f"✅ Email de recuperación enviado exitosamente a: {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error al enviar email de recuperación a {user_email}: {str(e)}")
        return False
