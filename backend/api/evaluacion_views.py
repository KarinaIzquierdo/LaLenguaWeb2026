from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Evaluacion, CustomUser, RespuestaEvaluacion, Notificacion, Evaluation, Clase, Asistencia
from .serializers import EvaluacionSerializer, UserSerializer, RespuestaEvaluacionSerializer
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
import os
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evaluaciones_list_view(request):
    """
    Listar evaluaciones del profesor autenticado
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    evaluaciones = Evaluacion.objects.filter(profesor=request.user).order_by('-created_at')
    serializer = EvaluacionSerializer(evaluaciones, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def evaluacion_create_view(request):
    """
    Crear nueva evaluación (subir archivo)
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # En lugar de copiar request.data, crear un nuevo dict
    data = {
        'profesor': request.user.id,
        'titulo': request.data.get('titulo'),
        'descripcion': request.data.get('descripcion'),
        'tipo': request.data.get('tipo'),
        'estado': request.data.get('estado', 'borrador'),
        'fecha_limite': request.data.get('fecha_limite'),
    }
    
    # Manejar el archivo separadamente
    if 'archivo' in request.FILES:
        data['archivo'] = request.FILES['archivo']
    
    # Manejar estudiantes_asignados
    estudiantes = request.data.get('estudiantes_asignados')
    if estudiantes:
        try:
            if isinstance(estudiantes, str):
                estudiantes = json.loads(estudiantes)
            data['estudiantes_asignados'] = estudiantes
        except json.JSONDecodeError:
            return Response({
                'success': False,
                'message': 'Formato inválido para estudiantes_asignados'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = EvaluacionSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        evaluacion = serializer.save()
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación creada exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    print(f"Validation errors: {serializer.errors}")  # Debug
    print(f"Request data: {request.data}")  # Debug
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def evaluacion_update_view(request, pk):
    """
    Actualizar evaluación existente
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EvaluacionSerializer(evaluacion, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        evaluacion = serializer.save()
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación actualizada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def evaluacion_delete_view(request, pk):
    """
    Eliminar evaluación
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
        evaluacion.delete()
        return Response({
            'success': True,
            'message': 'Evaluación eliminada exitosamente'
        }, status=status.HTTP_200_OK)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluacion_publish_view(request, pk):
    """
    Publicar evaluación (cambiar estado a 'publicada')
    """
    try:
        evaluacion = Evaluacion.objects.get(pk=pk, profesor=request.user)
        # Toggle entre 'borrador' y 'publicada'
        if evaluacion.estado == 'publicada':
            evaluacion.estado = 'borrador'
        else:
            evaluacion.estado = 'publicada'
        evaluacion.save()
        
        return Response({
            'success': True,
            'data': EvaluacionSerializer(evaluacion, context={'request': request}).data,
            'message': 'Evaluación publicada exitosamente'
        }, status=status.HTTP_200_OK)
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_evaluaciones_view(request):
    """
    Listar evaluaciones asignadas al estudiante autenticado
    """
    print(f"DEBUG STUDENT EVALUACIONES: Usuario: {request.user}")
    evaluaciones = Evaluacion.objects.filter(
        estudiantes_asignados=request.user,
        estado='publicada'
    ).order_by('-created_at')
    
    print(f"DEBUG: Encontradas {evaluaciones.count()} evaluaciones")
    for eval in evaluaciones:
        print(f"- ID: {eval.id}, Título: {eval.titulo}, Tipo: {eval.tipo}")
    
    serializer = EvaluacionSerializer(evaluaciones, many=True, context={'request': request})
    print(f"DEBUG: Serializer data: {serializer.data}")
    
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def students_list_view(request):
    """
    Listar todos los estudiantes para asignar evaluaciones
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    students = CustomUser.objects.filter(role='student', is_active=True)
    serializer = UserSerializer(students, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_evaluacion_view(request, pk):
    """
    Descargar archivo de evaluación para estudiantes
    """
    try:
        evaluacion = get_object_or_404(Evaluacion, pk=pk, estudiantes_asignados=request.user, estado='publicada')
        
        if not evaluacion.archivo:
            return Response({
                'success': False,
                'message': 'Esta evaluación no tiene archivo adjunto'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener la ruta del archivo
        file_path = evaluacion.archivo.path
        
        if not os.path.exists(file_path):
            return Response({
                'success': False,
                'message': 'Archivo no encontrado en el servidor'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Leer el archivo y enviarlo como respuesta
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/octet-stream')
            response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
            return response
            
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada o no tienes acceso'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_respuesta_view(request, pk):
    """Subir respuesta de evaluación por parte del estudiante"""
    try:
        evaluacion = get_object_or_404(
            Evaluacion,
            pk=pk,
            estudiantes_asignados=request.user,
            estado='publicada'
        )

        # Verificar si ya existe una respuesta
        respuesta, created = RespuestaEvaluacion.objects.get_or_create(
            evaluacion=evaluacion,
            estudiante=request.user,
            defaults={'completado': False}
        )

        # Construir explícitamente los datos para evitar problemas al copiar archivos del request
        file_obj = request.FILES.get('archivo_respuesta')
        data = {
            'evaluacion': evaluacion.id,
        }
        if file_obj is not None:
            data['archivo_respuesta'] = file_obj

        # Permitir que el estudiante envíe un comentario opcional (se guarda en comentarios_profesor)
        comentarios = request.data.get('comentarios') or request.data.get('comentarios_profesor')
        if comentarios is not None:
            data['comentarios_profesor'] = comentarios

        serializer = RespuestaEvaluacionSerializer(
            respuesta,
            data=data,
            partial=True,
            context={'request': request}
        )

        if serializer.is_valid():
            # Guardar la respuesta marcándola como completada y actualizando fecha_envio
            respuesta = serializer.save(completado=True)
            respuesta.fecha_envio = timezone.now()
            respuesta.save()

            # Crear notificación para el profesor indicando que el estudiante subió la tarea
            try:
                profesor = getattr(evaluacion, 'profesor', None)
                if profesor is not None:
                    Notificacion.objects.create(
                        profesor=profesor,
                        tipo='evaluacion_subida',
                        titulo=f'Nueva respuesta a "{evaluacion.titulo}"',
                        mensaje=(
                            f'El estudiante {request.user.get_full_name() or request.user.username} '
                            f'ha subido su tarea para "{evaluacion.titulo}".'
                        ),
                        prioridad='media',
                        evaluacion_relacionada=evaluacion,
                        estudiante_relacionado=request.user,
                    )
            except Exception as notif_err:
                # No romper el flujo si la notificación falla; solo registrar en logs
                print(f"Error creando notificación de evaluación_subida: {notif_err}")

            return Response({
                'success': True,
                'data': RespuestaEvaluacionSerializer(respuesta, context={'request': request}).data,
                'message': 'Respuesta subida exitosamente'
            }, status=status.HTTP_200_OK)

        # Si el serializer no es válido, devolver errores claros
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada o no tienes acceso'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # Capturar cualquier otro error inesperado para evitar 500 silenciosos
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error interno al subir respuesta: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_respuestas_view(request):
    """
    Listar respuestas del estudiante autenticado
    """
    # Ordenar por fecha de envío en lugar de created_at (campo que no existe)
    respuestas = RespuestaEvaluacion.objects.filter(estudiante=request.user).order_by('-fecha_envio')
    serializer = RespuestaEvaluacionSerializer(respuestas, many=True, context={'request': request})
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profesor_respuestas_view(request, pk):
    """
    Ver respuestas de una evaluación específica (solo profesores)
    """
    if not request.user.is_profesor:
        return Response({
            'success': False, 
            'message': 'Solo los profesores pueden ver las respuestas'
        }, status=403)
    
    try:
        evaluacion = get_object_or_404(Evaluacion, pk=pk, profesor=request.user)
        respuestas = RespuestaEvaluacion.objects.filter(evaluacion=evaluacion)
        serializer = RespuestaEvaluacionSerializer(respuestas, many=True)
        
        return Response({
            'success': True,
            'respuestas': serializer.data
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener respuestas: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def examen_data_view(request, pk):
    """
    Obtener datos del examen para modo seguro
    """
    print(f"DEBUG: Usuario: {request.user}, PK: {pk}")
    try:
        evaluacion = get_object_or_404(
            Evaluacion, 
            pk=pk, 
            estado='published'
        )
        
        # Verificar que el usuario esté asignado a esta evaluación
        if not evaluacion.estudiantes_asignados.filter(id=request.user.id).exists():
            return Response({
                'success': False,
                'message': 'No tienes acceso a esta evaluación'
            }, status=403)
        
        # Verificar si ya respondió (comentado para pruebas)
        # respuesta_existente = RespuestaEvaluacion.objects.filter(
        #     evaluacion=evaluacion,
        #     estudiante=request.user
        # ).first()
        # 
        # if respuesta_existente:
        #     print(f"DEBUG: Usuario {request.user.username} ya respondió esta evaluación")
        #     return Response({
        #         'success': False,
        #         'message': 'Ya has respondido esta evaluación'
        #     }, status=400)
        
        # Simular preguntas del examen (en producción vendría de la base de datos)
        preguntas_ejemplo = [
            {
                'id': '1',
                'texto': '¿Cuál es la capital de Francia?',
                'tipo': 'multiple',
                'opciones': ['Madrid', 'París', 'Londres', 'Roma']
            },
            {
                'id': '2',
                'texto': 'Explica el concepto de herencia en programación orientada a objetos.',
                'tipo': 'abierta'
            },
            {
                'id': '3',
                'texto': 'Python es un lenguaje de programación interpretado.',
                'tipo': 'verdadero_falso'
            }
        ]
        
        return Response({
            'success': True,
            'id': evaluacion.id,
            'titulo': evaluacion.titulo,
            'descripcion': evaluacion.descripcion or 'Sin descripción',
            'tiempo_limite': 60,  # 60 minutos por defecto
            'preguntas': preguntas_ejemplo
        })
        
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada o no tienes acceso'
        }, status=404)
    except Exception as e:
        print(f"DEBUG ERROR ENVIAR: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error al enviar respuestas: {str(e)}'
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_respuestas_view(request, pk):
    """
    Enviar respuestas del examen seguro
    """
    print(f"DEBUG ENVIAR: Usuario: {request.user}, PK: {pk}")
    print(f"DEBUG ENVIAR: Data: {request.data}")
    try:
        evaluacion = get_object_or_404(
            Evaluacion, 
            pk=pk, 
            estado='published'
        )
        
        # Verificar que el usuario esté asignado a esta evaluación
        if not evaluacion.estudiantes_asignados.filter(id=request.user.id).exists():
            return Response({
                'success': False,
                'message': 'No tienes acceso a esta evaluación'
            }, status=403)
        
        # Verificar si ya respondió (comentado para pruebas)
        # respuesta_existente = RespuestaEvaluacion.objects.filter(
        #     evaluacion=evaluacion,
        #     estudiante=request.user
        # ).first()
        # 
        # if respuesta_existente:
        #     print(f"DEBUG: Usuario {request.user.username} ya respondió esta evaluación")
        #     return Response({
        #         'success': False,
        #         'message': 'Ya has respondido esta evaluación'
        #     }, status=400)
        
        data = request.data
        respuestas = data.get('respuestas', {})
        tiempo_usado = data.get('tiempo_usado', 0)
        advertencias = data.get('advertencias', 0)
        envio_automatico = data.get('envio_automatico', False)
        
        # Verificar si ya existe una respuesta para esta evaluación y estudiante
        respuesta, created = RespuestaEvaluacion.objects.get_or_create(
            evaluacion=evaluacion,
            estudiante=request.user,
            defaults={
                'respuestas_json': data,
                'tiempo_empleado': tiempo_usado,
                'advertencias': advertencias,
                'completado': True
            }
        )
        
        # Si ya existía, actualizar los datos
        if not created:
            respuesta.respuestas_json = data
            respuesta.tiempo_empleado = tiempo_usado
            respuesta.advertencias = advertencias
            respuesta.completado = True
            respuesta.save()
        
        return Response({
            'success': True,
            'message': 'Respuestas enviadas exitosamente',
            'respuesta_id': respuesta.id
        })
        
    except Evaluacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Evaluación no encontrada o no tienes acceso'
        }, status=404)
    except Exception as e:
        print(f"DEBUG ERROR ENVIAR RESPUESTAS: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error al enviar respuestas: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reportes_progreso_view(request):
    """
    Obtener reportes de progreso de estudiantes con datos reales.
    Combina asistencias a clases del profesor y evaluaciones asignadas.
    """
    print(f"DEBUG: Usuario actual: {request.user.username}, ID: {request.user.id}, Es profesor: {request.user.is_profesor}")
    
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Evaluaciones del profesor
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=request.user)
    
    # Clases del profesor (el modelo guarda profesor como nombre completo)
    profesor_nombre = f"{request.user.first_name or ''} {request.user.last_name or ''}".strip()
    clases_profesor = Clase.objects.filter(profesor=profesor_nombre) if profesor_nombre else Clase.objects.none()
    
    # Estudiantes con evaluaciones asignadas o con asistencia en clases del profesor
    estudiantes_con_evaluaciones = CustomUser.objects.filter(
        evaluaciones_asignadas__in=evaluaciones_profesor,
        role='student'
    ).distinct()
    
    estudiantes_con_asistencia = CustomUser.objects.filter(
        asistencias__clase__in=clases_profesor,
        role='student'
    ).distinct()
    
    estudiante_ids = set(
        estudiantes_con_evaluaciones.values_list('id', flat=True)
    ) | set(
        estudiantes_con_asistencia.values_list('id', flat=True)
    )
    
    estudiantes = CustomUser.objects.filter(id__in=estudiante_ids)
    print(f"DEBUG: Estudiantes encontrados: {estudiantes.count()}")
    
    reportes_data = []
    
    for estudiante in estudiantes:
        # Datos de evaluaciones
        evaluaciones_estudiante = evaluaciones_profesor.filter(estudiantes_asignados=estudiante)
        total_evaluaciones = evaluaciones_estudiante.count()
        respuestas = RespuestaEvaluacion.objects.filter(
            estudiante=estudiante,
            evaluacion__in=evaluaciones_estudiante
        )
        evaluaciones_completadas = respuestas.filter(completado=True).count()
        
        # Datos de asistencia a clases
        asistencias_estudiante = Asistencia.objects.filter(estudiante=estudiante, clase__in=clases_profesor)
        total_clases = asistencias_estudiante.count()
        clases_presentes = asistencias_estudiante.filter(estado='presente').count()
        
        # Preferir asistencia para progreso y clases completadas (más representativo del día a día)
        if total_clases > 0:
            progreso = (clases_presentes / total_clases * 100) if total_clases > 0 else 0
            clases_completadas = clases_presentes
            clases_totales = total_clases
            ultima_asistencia = asistencias_estudiante.order_by('-fecha').first()
            ultima_actividad = ultima_asistencia.fecha if ultima_asistencia else None
        elif total_evaluaciones > 0:
            progreso = (evaluaciones_completadas / total_evaluaciones * 100) if total_evaluaciones > 0 else 0
            clases_completadas = evaluaciones_completadas
            clases_totales = total_evaluaciones
            ultima_respuesta = respuestas.order_by('-fecha_envio').first()
            ultima_actividad = ultima_respuesta.fecha_envio if ultima_respuesta else None
        else:
            progreso = 0
            clases_completadas = 0
            clases_totales = 0
            ultima_actividad = None
        
        # Calificación promedio real (0-100)
        respuestas_completadas = respuestas.filter(completado=True)
        calificaciones = []
        for respuesta in respuestas_completadas:
            if respuesta.calificacion is not None:
                calificaciones.append(float(respuesta.calificacion))
            elif respuesta.advertencias is not None:
                # Fallback: simular calificación sobre 100 cuando aún no hay calificación del profesor
                calificacion = 100.0 - (respuesta.advertencias * 5.0)
                calificaciones.append(max(0, calificacion))
        
        calificacion_promedio = sum(calificaciones) / len(calificaciones) if calificaciones else 0.0
        
        # Determinar fortalezas y áreas a mejorar
        fortalezas = []
        areas_a_mejorar = []
        
        if calificacion_promedio >= 80:
            fortalezas.append("Excelente desempeño en evaluaciones")
        if evaluaciones_completadas == total_evaluaciones and total_evaluaciones > 0:
            fortalezas.append("Completó todas las evaluaciones asignadas")
        if respuestas.filter(advertencias=0).count() > respuestas.count() / 2:
            fortalezas.append("Buena disciplina durante los exámenes")
        if clases_presentes > 0:
            fortalezas.append(f"Asistencia registrada: {clases_presentes} clase(s)")
        
        if calificacion_promedio < 70:
            areas_a_mejorar.append("Mejorar comprensión del contenido")
        if evaluaciones_completadas < total_evaluaciones:
            areas_a_mejorar.append("Completar evaluaciones pendientes")
        if respuestas.filter(advertencias__gt=0).exists():
            areas_a_mejorar.append("Seguir las reglas del examen")
        
        if not areas_a_mejorar:
            areas_a_mejorar.append("Mantener el buen rendimiento")
        
        # Detalle de asistencias
        asistencias_detalle = [
            {
                'fecha': a.fecha.isoformat() if a.fecha else '',
                'estado': a.get_estado_display() if hasattr(a, 'get_estado_display') else a.estado,
                'clase': a.clase.nombre if a.clase else 'Sin clase'
            }
            for a in asistencias_estudiante.order_by('-fecha')
        ]
        
        # Detalle de evaluaciones asignadas
        evaluaciones_detalle = []
        for ev in evaluaciones_estudiante.order_by('-created_at'):
            resp = respuestas.filter(evaluacion=ev).first()
            if resp and resp.calificacion is not None:
                estado_evaluacion = 'Calificado'
            elif resp and resp.completado:
                estado_evaluacion = 'Completado'
            elif resp and resp.fecha_envio:
                estado_evaluacion = 'Enviado'
            else:
                estado_evaluacion = 'Pendiente'
            evaluaciones_detalle.append({
                'titulo': ev.titulo,
                'tipo': ev.get_tipo_display() if hasattr(ev, 'get_tipo_display') else ev.tipo,
                'estado': estado_evaluacion,
                'calificacion': float(resp.calificacion) if resp and resp.calificacion is not None else None,
                'fecha_envio': resp.fecha_envio.isoformat() if resp and resp.fecha_envio else None
            })
        
        reporte = {
            'id': estudiante.id,
            'nombre': f"{estudiante.first_name} {estudiante.last_name}" if estudiante.first_name else estudiante.username,
            'email': estudiante.email,
            'correo_personal': estudiante.correo_personal,
            'phone': estudiante.phone,
            'country': estudiante.country,
            'city': estudiante.city,
            'birth_date': estudiante.birth_date.isoformat() if estudiante.birth_date else None,
            'cedula': estudiante.cedula,
            'address': estudiante.address,
            'emergency_contact': estudiante.emergency_contact,
            'emergency_phone': estudiante.emergency_phone,
            'learning_goals': estudiante.learning_goals,
            'especializacion': estudiante.especializacion.nombre if estudiante.especializacion else None,
            'nivel': estudiante.level or estudiante.english_level or 'No especificado',
            'progreso': round(progreso, 1),
            'clasesCompletadas': clases_completadas,
            'clasesTotales': clases_totales,
            'ultimaClase': ultima_actividad.isoformat() if ultima_actividad else None,
            'calificacionPromedio': round(calificacion_promedio, 1),
            'fortalezas': fortalezas,
            'areasAMejorar': areas_a_mejorar,
            'asistencias_detalle': asistencias_detalle,
            'evaluaciones_detalle': evaluaciones_detalle
        }
        
        reportes_data.append(reporte)
    
    # Estadísticas generales
    total_estudiantes = len(reportes_data)
    progreso_promedio = sum(r['progreso'] for r in reportes_data) / total_estudiantes if total_estudiantes > 0 else 0
    calificacion_promedio_general = sum(r['calificacionPromedio'] for r in reportes_data) / total_estudiantes if total_estudiantes > 0 else 0
    
    return Response({
        'success': True,
        'data': {
            'estudiantes': reportes_data,
            'estadisticas': {
                'total_estudiantes': total_estudiantes,
                'progreso_promedio': round(progreso_promedio, 1),
                'calificacion_promedio': round(calificacion_promedio_general, 1)
            }
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def student_evaluation_result_view(request):
    """
    Registra el resultado de un quiz del estudiante y actualiza su progreso.
    """
    user = request.user
    data = request.data

    evaluation_type = data.get('evaluation_type')
    score = int(data.get('score', 0))
    total_questions = int(data.get('total_questions', 0))
    correct_answers = int(data.get('correct_answers', 0))

    if evaluation_type not in ['vocabulary', 'grammar', 'comprehension']:
        return Response({
            'success': False,
            'message': 'Tipo de evaluación inválido'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Guardar registro del quiz
    Evaluation.objects.create(
        usuario=user,
        tipo=evaluation_type,
        score=score,
        intentos=1
    )

    # Calcular recompensas basadas en el puntaje
    xp_ganado = max(5, round(score / 100 * 10))
    dulces_ganados = 5

    # Actualizar XP y dulces
    user.total_xp = (getattr(user, 'total_xp', 0) or 0) + xp_ganado
    user.total_dulces = (getattr(user, 'total_dulces', 0) or 0) + dulces_ganados

    # Subir la habilidad correspondiente según el tipo de evaluación
    if score >= 70:
        if evaluation_type == 'vocabulary':
            user.skill_vocabulario = min(3, (getattr(user, 'skill_vocabulario', 0) or 0) + 1)
        elif evaluation_type == 'grammar':
            user.skill_gramatica = min(3, (getattr(user, 'skill_gramatica', 0) or 0) + 1)
        elif evaluation_type == 'comprehension':
            user.skill_conversacion = min(3, (getattr(user, 'skill_conversacion', 0) or 0) + 1)

    user.save(update_fields=['total_xp', 'total_dulces', 'skill_vocabulario', 'skill_gramatica', 'skill_conversacion'])

    return Response({
        'success': True,
        'message': 'Resultado registrado y progreso actualizado',
        'data': {
            'total_xp': user.total_xp,
            'total_dulces': user.total_dulces,
            'xp_ganado': xp_ganado,
            'dulces_ganados': dulces_ganados,
            'skill_vocabulario': user.skill_vocabulario,
            'skill_gramatica': user.skill_gramatica,
            'skill_conversacion': user.skill_conversacion,
        }
    }, status=status.HTTP_201_CREATED)
