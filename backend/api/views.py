from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from .models import CustomUser, Profesor, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion, Evaluacion, Notificacion, RespuestaEvaluacion
from .serializers import (
    UserSerializer, LoginSerializer, ChangePasswordSerializer, ClaseSerializer,
    UserRegisterSerializer, EvaluationSerializer, MediaItemSerializer,
    ClubSerializer, ClubMaterialSerializer, EvaluacionSerializer, NotificacionSerializer,
)
from .especializacion_serializer import EspecializacionSerializer
from django.shortcuts import get_object_or_404

def home_view(request):
    """
    Página de inicio del API de Lengua
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lengua API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                text-align: center;
                max-width: 800px;
                padding: 40px 20px;
            }
            .logo {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle {
                font-size: 1.2rem;
                margin-bottom: 40px;
                opacity: 0.9;
            }
            .api-info {
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            }
            .endpoint {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                font-family: monospace;
                font-size: 0.9rem;
            }
            .status {
                display: inline-block;
                background: #28a745;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.8rem;
                margin-bottom: 20px;
            }
            .footer {
                margin-top: 40px;
                opacity: 0.7;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📚 Lengua API</div>
            <div class="subtitle">Sistema de Aprendizaje de Inglés</div>
            <div class="status">🟢 API Funcionando</div>
            
            <div class="api-info">
                <h3>🔗 Endpoints Principales</h3>
                <div class="endpoint">POST /api/login/ - Login móvil</div>
                <div class="endpoint">POST /api/auth/login/ - Login web</div>
                <div class="endpoint">GET /api/auth/profile/ - Perfil usuario</div>
                <div class="endpoint">GET /api/clases/ - Lista de clases</div>
                <div class="endpoint">GET /api/mobile/info/ - Info para móviles</div>
            </div>
            
            <div class="api-info">
                <h3>📱 Plataformas Soportadas</h3>
                <p>✅ Aplicación Web React</p>
                <p>✅ Aplicación Móvil Android</p>
                <p>✅ APIs REST completas</p>
            </div>
            
            <div class="footer">
                <p>© 2025 Lengua - Sistema de Aprendizaje</p>
                <p>Desarrollado con Django REST Framework</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

def favicon_view(request):
    """
    Favicon simple para evitar errores 404
    """
    # SVG favicon simple
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#667eea"/>
        <text x="50" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">L</text>
    </svg>'''
    return HttpResponse(svg_content, content_type="image/svg+xml")

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint unificado para autenticar usuarios de todos los roles y generar tokens JWT
    """
    print(f"Login request data: {request.data}")  # Debug
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Serializar datos del usuario con rol incluido
        user_serializer = UserSerializer(user)
        user_data = user_serializer.data
        
        # Asegurar que el rol esté correctamente asignado
        if user.is_profesor and user.role == 'student':
            user.role = 'profesor'
            user.save()
        
        return Response({
            'success': True,
            'token': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'message': 'Login exitoso'
        }, status=status.HTTP_200_OK)
    
    print(f"Login validation errors: {serializer.errors}")  # Debug
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def mobile_login_view(request):
    """
    Endpoint específico para aplicaciones móviles Android
    Acepta username/password y devuelve solo el token
    """
    print(f"Mobile login request data: {request.data}")  # Debug
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username y password son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar usuario por email (username es el email)
    try:
        user = CustomUser.objects.get(email__iexact=username)
        if user.check_password(password):
            if user.is_active:
                # Generar token JWT
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Respuesta simple que espera Android
                return Response({
                    'token': str(access_token)
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Cuenta desactivada'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({
            'error': 'Credenciales inválidas'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_profile_view(request):
    """
    Endpoint específico para obtener perfil de usuario en aplicaciones móviles
    Devuelve formato simple y directo
    """
    user = request.user
    
    # Asegurar que TODOS los campos sean strings, nunca None/null
    first_name = user.first_name if user.first_name else ''
    last_name = user.last_name if user.last_name else ''
    full_name = f"{first_name} {last_name}".strip()
    if not full_name:
        full_name = user.username if user.username else ''
    
    return Response({
        'id': user.id,
        'username': user.username if user.username else '',
        'email': user.email if user.email else '',
        'first_name': first_name,
        'last_name': last_name,
        'phone': user.phone if user.phone else '',
        'country': user.country if user.country else '',
        'city': user.city if user.city else '',
        'role': user.role if user.role else 'student',
        'english_level': user.english_level if user.english_level else '',
        'full_name': full_name,
        
        # Campos adicionales para perfil completo - NUNCA null
        'birth_date': user.birth_date.isoformat() if user.birth_date else '',
        'address': user.address if user.address else '',
        'learning_goals': user.learning_goals if user.learning_goals else '',
        'profile_completed': user.profile_completed if user.profile_completed is not None else False,
        'bloque_asignado': user.bloque_asignado if user.bloque_asignado else '',
        'created_at': user.created_at.isoformat() if user.created_at else '',
        'correo_personal': user.correo_personal if user.correo_personal else ''
    }, status=status.HTTP_200_OK)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mobile_update_profile_view(request):
    """
    Endpoint específico para actualizar perfil desde aplicaciones móviles
    Acepta formato simple con snake_case
    """
    user = request.user
    data = request.data
    
    try:
        # Actualizar campos - Soportar snake_case (formato móvil)
        if 'first_name' in data:
            user.first_name = data.get('first_name', '')
        
        if 'last_name' in data:
            user.last_name = data.get('last_name', '')
        
        if 'phone' in data:
            user.phone = data.get('phone', '')
        
        if 'country' in data:
            user.country = data.get('country', '')
        
        if 'city' in data:
            user.city = data.get('city', '')
        
        if 'english_level' in data:
            user.english_level = data.get('english_level', '')
        
        if 'birth_date' in data:
            birth_value = data.get('birth_date')
            if birth_value:
                user.birth_date = birth_value
        
        if 'cedula' in data:
            user.cedula = data.get('cedula', '')
        
        if 'address' in data:
            user.address = data.get('address', '')
        
        if 'emergency_contact' in data:
            user.emergency_contact = data.get('emergency_contact', '')
        
        if 'emergency_phone' in data:
            user.emergency_phone = data.get('emergency_phone', '')
        
        if 'learning_goals' in data:
            user.learning_goals = data.get('learning_goals', '')
        
        if 'correo_personal' in data:
            user.correo_personal = data.get('correo_personal', '')
        
        # Marcar perfil como completado
        user.profile_completed = True
        user.save()
        
        # Devolver el perfil actualizado
        first_name = user.first_name if user.first_name else ''
        last_name = user.last_name if user.last_name else ''
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            full_name = user.username if user.username else ''
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username if user.username else '',
                'email': user.email if user.email else '',
                'first_name': first_name,
                'last_name': last_name,
                'phone': user.phone if user.phone else '',
                'country': user.country if user.country else '',
                'city': user.city if user.city else '',
                'role': user.role if user.role else 'student',
                'english_level': user.english_level if user.english_level else '',
                'full_name': full_name,
                'birth_date': user.birth_date.isoformat() if user.birth_date else '',
                'address': user.address if user.address else '',
                'learning_goals': user.learning_goals if user.learning_goals else '',
                'profile_completed': user.profile_completed if user.profile_completed is not None else False,
                'bloque_asignado': user.bloque_asignado if user.bloque_asignado else '',
                'created_at': user.created_at.isoformat() if user.created_at else '',
                'correo_personal': user.correo_personal if user.correo_personal else ''
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

# ==================== RESET DE CONTRASEÑA (PÚBLICO) ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_view(request):
    """
    Solicita un restablecimiento de contraseña enviando un token.
    - Entrada: { email }
    - Salida: { success, message, reset_link? } (reset_link incluido solo en dev para conveniencia)
    """
    email = (request.data.get('email') or '').strip().lower()
    # Respuesta genérica para evitar enumeración de usuarios
    generic_response = Response({
        'success': True,
        'message': 'Si el correo existe, se han enviado instrucciones.'
    }, status=status.HTTP_200_OK)

    if not email:
        return Response({
            'success': False,
            'message': 'Email requerido'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Buscar primero por email institucional
        user = CustomUser.objects.get(email__iexact=email)
    except CustomUser.DoesNotExist:
        try:
            # Buscar por correo personal
            user = CustomUser.objects.get(correo_personal__iexact=email)
        except CustomUser.DoesNotExist:
            # Intentar mapear por parte local a dominios institucionales
            try:
                local_part = email.split('@')[0]
                candidate_emails = [
                    f"{local_part}@thelanguage.co",
                    f"{local_part}@soy.thelanguage.co",
                ]
                user = CustomUser.objects.filter(email__in=candidate_emails).first()
                if not user:
                    return generic_response
            except Exception:
                return generic_response

    try:
        token_generator = PasswordResetTokenGenerator()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        # Formato token combinado para el frontend: uid.token
        combined = f"{uid}.{token}"
        # Enviar email de recuperación
        from django.core.mail import send_mail
        from django.conf import settings
        
        # Determinar el correo de destino
        email_destino = user.correo_personal if user.correo_personal else user.email
        
        # Link completo para el frontend
        reset_link = f"http://localhost:3000/new-password?token={combined}"
        
        # Contenido del email
        subject = 'Recuperación de Contraseña - The Language'
        message = f"""
Hola {user.first_name or user.username},

Has solicitado recuperar tu contraseña para The Language.

Haz clic en el siguiente enlace para crear una nueva contraseña:
{reset_link}

Este enlace expirará en 1 hora por seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
El equipo de The Language
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email_destino],
                fail_silently=False,
            )
            return Response({
                'success': True,
                'message': 'Se han enviado instrucciones a tu correo.',
            }, status=status.HTTP_200_OK)
        except Exception as email_error:
            # Si falla el envío, devolver el token para desarrollo
            return Response({
                'success': True,
                'message': 'Se han enviado instrucciones a tu correo.',
                'token': combined,  # Solo para desarrollo
                'reset_link': reset_link,  # Solo para desarrollo
                'email_error': str(email_error)  # Solo para desarrollo
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'No se pudo generar el token: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    Confirma el restablecimiento con token y nueva contraseña.
    - Entrada: { token: "<uid>.<token>", new_password }
    """
    combined = (request.data.get('token') or '').strip()
    new_password = request.data.get('new_password') or ''

    if not combined or '.' not in combined:
        return Response({ 'success': False, 'message': 'Token inválido' }, status=status.HTTP_400_BAD_REQUEST)
    if not new_password or len(new_password) < 8:
        return Response({ 'success': False, 'message': 'Contraseña inválida (mínimo 8 caracteres)' }, status=status.HTTP_400_BAD_REQUEST)

    uidb64, token = combined.split('.', 1)
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = CustomUser.objects.get(pk=uid)
    except Exception:
        return Response({ 'success': False, 'message': 'Token inválido' }, status=status.HTTP_400_BAD_REQUEST)

    token_generator = PasswordResetTokenGenerator()
    if not token_generator.check_token(user, token):
        return Response({ 'success': False, 'message': 'Token inválido o expirado' }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({ 'success': True, 'message': 'Contraseña actualizada correctamente.' }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token_view(request):
    """
    Endpoint para verificar si el token JWT es válido
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Endpoint para cambiar la contraseña del usuario autenticado
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al cambiar contraseña',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Endpoint para obtener el perfil del usuario autenticado
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Endpoint para actualizar la información adicional del usuario
    """
    user = request.user
    data = request.data
    
    try:
        # Actualizar campos del usuario - Soportar camelCase y snake_case
        # Nombre
        if 'firstName' in data or 'first_name' in data:
            user.first_name = data.get('firstName') or data.get('first_name', '')
        
        # Apellido
        if 'lastName' in data or 'last_name' in data:
            user.last_name = data.get('lastName') or data.get('last_name', '')
        
        # Fecha de nacimiento
        if 'birthDate' in data or 'birth_date' in data:
            birth_value = data.get('birthDate') or data.get('birth_date')
            if birth_value:
                user.birth_date = birth_value
        
        # Cédula
        if 'cedula' in data:
            user.cedula = data.get('cedula', '')
        
        # Teléfono
        if 'phone' in data:
            user.phone = data.get('phone', '')
        
        # Dirección
        if 'address' in data:
            user.address = data.get('address', '')
        
        # Ciudad
        if 'city' in data:
            user.city = data.get('city', '')
        
        # País
        if 'country' in data:
            user.country = data.get('country', '')
        
        # Contacto de emergencia
        if 'emergencyContact' in data or 'emergency_contact' in data:
            user.emergency_contact = data.get('emergencyContact') or data.get('emergency_contact', '')
        
        # Teléfono de emergencia
        if 'emergencyPhone' in data or 'emergency_phone' in data:
            user.emergency_phone = data.get('emergencyPhone') or data.get('emergency_phone', '')
        
        # ✅ NIVEL DE INGLÉS - Soportar ambos formatos
        if 'englishLevel' in data or 'english_level' in data:
            user.english_level = data.get('englishLevel') or data.get('english_level', '')
        
        # ✅ OBJETIVOS DE APRENDIZAJE - Soportar ambos formatos
        if 'learningGoals' in data or 'learning_goals' in data:
            user.learning_goals = data.get('learningGoals') or data.get('learning_goals', '')
        
        # ✅ CORREO PERSONAL - Agregar soporte
        if 'correoPersonal' in data or 'correo_personal' in data:
            user.correo_personal = data.get('correoPersonal') or data.get('correo_personal', '')
        
        # Marcar perfil como completado
        user.profile_completed = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== ENDPOINTS PARA PROFESORES ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def profesor_login_view(request):
    """
    Endpoint para autenticar profesores y generar tokens JWT
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Verificar que el usuario sea profesor
        if not user.is_profesor:
            return Response({
                'success': False,
                'message': 'Este usuario no tiene permisos de profesor'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Obtener información del profesor
        try:
            profesor_profile = user.profesor_profile
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': profesor_profile.especialidad,
                'is_profesor': True,
                'telefono': profesor_profile.telefono,
                'biografia': profesor_profile.biografia,
                'experiencia': profesor_profile.experiencia_anos,
                'certificaciones': profesor_profile.certificaciones
            }
        except Profesor.DoesNotExist:
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': 'No especificada',
                'is_profesor': True
            }
        
        return Response({
            'success': True,
            'access': str(access_token),
            'refresh': str(refresh),
            'user': profesor_data,
            'message': 'Login de profesor exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_verify_token_view(request):
    """
    Endpoint para verificar si el token JWT de profesor es válido
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Token no válido para profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'success': True,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'is_profesor': True
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profesor_profile_view(request):
    """
    Endpoint para obtener el perfil del profesor autenticado
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        profesor_profile = user.profesor_profile
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': profesor_profile.especialidad,
            'biografia': profesor_profile.biografia,
            'experiencia_anos': profesor_profile.experiencia_anos,
            'certificaciones': profesor_profile.certificaciones,
            'telefono': profesor_profile.telefono,
            'disponibilidad': profesor_profile.disponibilidad,
            'tarifa_por_hora': str(profesor_profile.tarifa_por_hora),
            'is_profesor': True
        }
    except Profesor.DoesNotExist:
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': 'No especificada',
            'is_profesor': True
        }
    
    return Response({
        'success': True,
        'user': profesor_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_change_password_view(request):
    """
    Endpoint para cambiar la contraseña del profesor autenticado
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al cambiar contraseña',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ==================== ENDPOINTS PARA CLASES ====================

class ClaseViewSet(viewsets.ModelViewSet):
    queryset = Clase.objects.all()
    serializer_class = ClaseSerializer

    def get_queryset(self):
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            return Clase.objects.filter(estudiantes__id=usuario_id)
        return super().get_queryset().order_by('-created_at')
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """
        Endpoint para cambiar el estado de una clase (programada -> activa -> completada)
        """
        clase = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in ['programada', 'activa', 'completada']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        clase.estado = nuevo_estado
        clase.save()
        
        serializer = self.get_serializer(clase)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint para registrar un nuevo usuario (estudiante, profesor o admin)
    """
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Si se proporciona bloque_asignado, asignarlo al usuario
        if 'bloque_asignado' in request.data and request.data['bloque_asignado']:
            user.bloque_asignado = request.data['bloque_asignado']
            user.save()
            
            # Enviar respuesta con información del bloque para sincronización frontend
            print(f"Usuario {user.id} registrado con bloque: {user.bloque_asignado}")
        
        user_serializer = UserSerializer(user)
        return Response({
            'success': True,
            'user': user_serializer.data,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_evaluations_view(request):
    """
    List evaluations/quizzes for the current user
    """
    evaluations = Evaluation.objects.filter(usuario=request.user)
    serializer = EvaluationSerializer(evaluations, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_active_view(request, user_id):
    """
    Endpoint para activar o desactivar un usuario por su id
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'success': True,
            'is_active': user.is_active,
            'message': f'Usuario {"activado" if user.is_active else "desactivado"} correctamente.'
        }, status=status.HTTP_200_OK)
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Usuario no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    Endpoint para listar todos los usuarios
    """
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


# ==================== ENDPOINTS PARA GALERÍA ====================

class MediaItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de elementos multimedia
    """
    queryset = MediaItem.objects.filter(is_active=True)
    serializer_class = MediaItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Solo lectura para todos, escritura solo para admin
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Guardar el elemento multimedia
        """
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Soft delete - marcar como inactivo en lugar de eliminar
        """
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([AllowAny])
def gallery_list_view(request):
    """
    Endpoint público para obtener todos los elementos de la galería
    """
    media_items = MediaItem.objects.filter(is_active=True).order_by('-created_at')
    serializer = MediaItemSerializer(media_items, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


# ==================== ENDPOINTS PARA CLUBS (CLB) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clubs_list_view(request):
    """
    Listar clubs visibles para el usuario actual.
    - Si es profesor: clubs donde es profesor.
    - Si es estudiante: clubs a los que pertenece.
    - Si es admin: todos.
    """
    user = request.user
    if getattr(user, 'role', None) == 'admin':
        qs = Club.objects.all()
    elif getattr(user, 'is_profesor', False) or getattr(user, 'role', None) == 'profesor':
        qs = Club.objects.filter(profesor=user)
    else:
        qs = Club.objects.filter(students=user)

    serializer = ClubSerializer(qs.order_by('-updated_at'), many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_create_view(request):
    """Crear club (solo admin o profesor)."""
    user = request.user
    data = request.data.copy()
    # Si es profesor, fijar profesor = user
    if getattr(user, 'role', None) != 'admin':
        data['profesor'] = str(user.id)

    serializer = ClubSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        club = serializer.save()
        return Response({'success': True, 'data': ClubSerializer(club, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_students_list_view(request, club_id):
    """Listar estudiantes asignados a un club (profesor del club, admin o el propio estudiante podrá verse)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin' or user in club.students.all()):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    students = club.students.all()
    # Limitar campos en respuesta
    data = UserSerializer(students, many=True).data
    return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_add_student_view(request, club_id):
    """Agregar estudiante por email al club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    email = request.data.get('email')
    student = None
    if user_id:
        try:
            student = CustomUser.objects.get(pk=int(user_id))
        except (ValueError, CustomUser.DoesNotExist):
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    elif email:
        try:
            student = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'success': False, 'message': 'Debe proporcionar user_id o email'}, status=status.HTTP_400_BAD_REQUEST)

    club.students.add(student)
    return Response({'success': True, 'message': 'Estudiante agregado'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def club_remove_student_view(request, club_id, user_id):
    """Remover estudiante del club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    try:
        student = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    club.students.remove(student)
    return Response({'success': True, 'message': 'Estudiante removido'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_materials_list_view(request, club_id):
    """Listar materiales activos de un club visible para el usuario."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    # Permisos básicos de lectura
    if not (user == club.profesor or user in club.students.all() or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    mats = club.materials.filter(is_active=True)
    serializer = ClubMaterialSerializer(mats, many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def club_material_create_view(request, club_id):
    """Crear material en un club (profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    data['club'] = str(club.id)
    serializer = ClubMaterialSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        mat = serializer.save(created_by=user, is_active=True)
        return Response({'success': True, 'data': ClubMaterialSerializer(mat, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_create_view(request):
    """
    Endpoint para crear un nuevo elemento multimedia
    """
    serializer = MediaItemSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        # Asegurar que los nuevos elementos queden activos por defecto
        serializer.save(is_active=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Elemento creado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_update_view(request, pk):
    """
    Endpoint para actualizar un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = MediaItemSerializer(media_item, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Elemento actualizado exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def gallery_delete_view(request, pk):
    """
    Endpoint para eliminar (soft delete) un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
        media_item.is_active = False
        media_item.save()
        return Response({
            'success': True,
            'message': 'Elemento eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
