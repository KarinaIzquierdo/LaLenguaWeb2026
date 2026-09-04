from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
from .models import CustomUser, RegistroEliminacion

@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def delete_user_view(request, user_id):
    """
    Eliminar o actualizar usuario por ID
    """
    user = get_object_or_404(CustomUser, id=user_id)
    
    if request.method == 'DELETE':
        try:
            # Obtener datos de la razón de eliminación
            razon = request.data.get('razon', 'otro')
            descripcion_adicional = request.data.get('descripcion_adicional', '')
            deuda_pendiente = request.data.get('deuda_pendiente', 0.00)
            plan_activo = request.data.get('plan_activo', '')
            notas = request.data.get('notas', '')
            
            # Calcular días registrado
            fecha_registro = user.created_at if hasattr(user, 'created_at') else timezone.now()
            dias_registrado = (timezone.now() - fecha_registro).days
            
            # Crear registro de eliminación ANTES de eliminar el usuario
            registro = RegistroEliminacion.objects.create(
                username=user.username,
                email=user.email,
                first_name=user.first_name or '',
                last_name=user.last_name or '',
                phone=user.phone or '',
                cedula=user.cedula or '',
                nivel=user.level or user.english_level or '',
                bloque_asignado=getattr(user, 'bloque_asignado', '') or '',
                especializacion=user.especializacion.nombre if user.especializacion else '',
                fecha_registro=fecha_registro,
                dias_registrado=dias_registrado,
                razon=razon,
                descripcion_adicional=descripcion_adicional,
                plan_activo=plan_activo,
                deuda_pendiente=deuda_pendiente,
                eliminado_por=request.user,
                notas=notas
            )
            
            # Ahora sí eliminar el usuario
            user.delete()
            
            return Response({
                'success': True,
                'message': 'Usuario eliminado exitosamente',
                'registro_id': registro.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al eliminar usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PATCH':
        from django.db import transaction
        try:
            data = request.data
            print(f"DEBUG: PATCH - User: {user_id} - Data: {data}")
            
            # Limpiar datos básicos
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            correo_personal = data.get('correo_personal')
            english_level = data.get('english_level')
            especializacion_val = data.get('especializacion')
            is_active = data.get('is_active')

            with transaction.atomic():
                # Re-obtener el usuario dentro de la transacción para asegurar frescura
                u = CustomUser.objects.select_for_update().get(id=user_id)
                
                if first_name is not None:
                    u.first_name = first_name.strip()
                if last_name is not None:
                    u.last_name = last_name.strip()
                if correo_personal is not None:
                    u.correo_personal = correo_personal.strip()
                if english_level is not None:
                    u.english_level = english_level
                    u.level = english_level
                
                # Manejo robusto de especialización
                if 'especializacion' in data:
                    if especializacion_val is None or especializacion_val == 0 or especializacion_val == "":
                        u.especializacion = None
                        print("DEBUG: Especialización seteada a NULL")
                    else:
                        try:
                            # Intentar tratarlo como ID primero
                            esp_id = int(especializacion_val)
                            u.especializacion_id = esp_id
                            print(f"DEBUG: Especialización ID set a {esp_id}")
                        except (ValueError, TypeError):
                            # Si no es ID, intentar buscar por nombre
                            from .models import Especializacion
                            esp = Especializacion.objects.filter(nombre__iexact=str(especializacion_val)).first()
                            if esp:
                                u.especializacion = esp
                                print(f"DEBUG: Especialización encontrada por nombre: {esp.nombre}")
                
                if is_active is not None:
                    u.is_active = is_active
                
                u.save()
                
                # REFRESCAR EL OBJETO para obtener nombres de relaciones (como especializacion)
                u.refresh_from_db()
                print(f"DEBUG: Cambios guardados y refrescados. Email Personal: {u.correo_personal}, Esp: {u.especializacion.nombre if u.especializacion else 'None'}")

            # Respuesta con datos frescos y nombres reales
            especializacion_nombre = None
            if u.especializacion:
                especializacion_nombre = u.especializacion.nombre

            return Response({
                'success': True,
                'message': 'Usuario actualizado exitosamente',
                'user': {
                    'id': u.id,
                    'first_name': u.first_name,
                    'last_name': u.last_name,
                    'email': u.email,
                    'correo_personal': u.correo_personal,
                    'english_level': u.english_level,
                    'is_active': u.is_active,
                    'especializacion': especializacion_nombre
                }
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"ERROR en PATCH usuario: {str(e)}")
            return Response({
                'success': False,
                'message': f'Error al actualizar usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
