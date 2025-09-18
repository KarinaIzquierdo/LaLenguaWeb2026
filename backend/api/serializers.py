from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion, Evaluacion, RespuestaEvaluacion, Notificacion, Plan, Venta

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'country', 'city', 'level', 
                 'birth_date', 'cedula', 'address', 'emergency_contact', 'emergency_phone', 
                 'english_level', 'learning_goals', 'profile_completed', 'role', 'is_profesor', 'is_active', 'bloque_asignado', 'especializacion')
        read_only_fields = ('id',)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            # Buscar usuario por email (case insensitive)
            try:
                user = CustomUser.objects.get(email__iexact=email)
                # Verificar contraseña
                if user.check_password(password):
                    if user.is_active:
                        data['user'] = user
                    else:
                        raise serializers.ValidationError('La cuenta de usuario está desactivada.')
                else:
                    raise serializers.ValidationError('Email o contraseña incorrectos.')
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError('Email o contraseña incorrectos.')
        else:
            raise serializers.ValidationError('Debe proporcionar email y contraseña.')

        return data


class ClubSerializer(serializers.ModelSerializer):
    profesor_name = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ['id', 'name', 'description', 'profesor', 'profesor_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_profesor_name(self, obj):
        return obj.profesor.get_full_name() or obj.profesor.username


class ClubMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMaterial
        fields = ['id', 'club', 'week', 'title', 'description', 'resource_type', 'url', 'file', 'created_by', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_active']

    def validate(self, attrs):
        rtype = attrs.get('resource_type')
        url = attrs.get('url')
        file = attrs.get('file')
        if rtype == 'url' and not url:
            raise serializers.ValidationError({'url': ['Requerida cuando el recurso es URL.']})
        if rtype == 'file' and not file:
            raise serializers.ValidationError({'file': ['Requerido cuando el recurso es Archivo.']})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('resource_type') == 'file' and not data.get('url') and getattr(instance, 'file', None):
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                data['url'] = request.build_absolute_uri(instance.file.url)
            else:
                data['url'] = getattr(instance.file, 'url', '')
        return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def validate_new_password(self, value):
        # Aquí puedes agregar validaciones adicionales para la nueva contraseña
        if len(value) < 8:
            raise serializers.ValidationError('La nueva contraseña debe tener al menos 8 caracteres.')
        return value

class ClaseSerializer(serializers.ModelSerializer):
    estudiantes = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomUser.objects.all(), required=False)
    estudiantesSeleccionados = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    
    class Meta:
        model = Clase
        fields = ['id', 'nombre', 'profesor', 'fecha', 'hora', 'duracion', 'tema', 'descripcion', 
                 'tipo_clase', 'modalidad', 'meet_link', 'estado', 'estudiantes', 'estudiantesSeleccionados', 
                 'created_at', 'updated_at']
    
    def create(self, validated_data):
        estudiantes_ids = validated_data.pop('estudiantesSeleccionados', [])
        clase = super().create(validated_data)
        
        # Asignar estudiantes por ID
        if estudiantes_ids:
            estudiantes = CustomUser.objects.filter(id__in=estudiantes_ids)
            clase.estudiantes.set(estudiantes)
        
        return clase

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)
    bloque_asignado = serializers.CharField(required=False, allow_blank=True)
    especializacion = serializers.PrimaryKeyRelatedField(queryset=Especializacion.objects.all(), required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'role', 'password', 'bloque_asignado', 'especializacion')

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo electrónico.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        bloque_asignado = validated_data.pop('bloque_asignado', None)
        especializacion = validated_data.pop('especializacion', None)
        user = CustomUser(**validated_data)
        user.username = validated_data['email']  # Usar email como username
        user.set_password(password)
        if validated_data['role'] == 'profesor':
            user.is_profesor = True
        if bloque_asignado:
            user.bloque_asignado = bloque_asignado
        if especializacion:
            user.especializacion = especializacion
        user.save()
        return user

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'usuario', 'tipo', 'score', 'intentos', 'fecha', 'detalles']
        read_only_fields = ['id', 'usuario', 'fecha']


class MediaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaItem
        fields = ['id', 'type', 'title', 'description', 'url', 'file', 'thumbnail', 'author', 'category', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Exigir al menos uno: url o file"""
        url = attrs.get('url')
        file = attrs.get('file')
        if not url and not file:
            raise serializers.ValidationError({'non_field_errors': ['Debe proporcionar una URL o un archivo.']})
        return attrs

    def validate_title(self, value):
        """Validar que el título no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError('El título no puede estar vacío.')
        return value.strip()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Si no hay url pero hay archivo, construir URL absoluta del archivo
        if not data.get('url') and getattr(instance, 'file', None):
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                data['url'] = request.build_absolute_uri(instance.file.url)
            else:
                data['url'] = getattr(instance.file, 'url', '')
        return data


class EvaluacionSerializer(serializers.ModelSerializer):
    estudiantes_asignados = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomUser.objects.all(), required=False)
    profesor_nombre = serializers.CharField(source='profesor.get_full_name', read_only=True)
    estudiantes_count = serializers.SerializerMethodField()
    completadas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Evaluacion
        fields = ['id', 'titulo', 'descripcion', 'tipo', 'estado', 'archivo', 'fecha_limite', 
                 'profesor', 'profesor_nombre', 'estudiantes_asignados', 'estudiantes_count', 
                 'completadas_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_estudiantes_count(self, obj):
        return obj.estudiantes_asignados.count()
    
    def get_completadas_count(self, obj):
        # This would need to be implemented based on your completion tracking logic
        # For now, returning 0 as placeholder
        return 0
    
    def create(self, validated_data):
        estudiantes_data = validated_data.pop('estudiantes_asignados', [])
        evaluacion = Evaluacion.objects.create(**validated_data)
        evaluacion.estudiantes_asignados.set(estudiantes_data)
        return evaluacion
    
    def update(self, instance, validated_data):
        estudiantes_data = validated_data.pop('estudiantes_asignados', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if estudiantes_data is not None:
            instance.estudiantes_asignados.set(estudiantes_data)
        
        return instance


class RespuestaEvaluacionSerializer(serializers.ModelSerializer):
    evaluacion_titulo = serializers.CharField(source='evaluacion.titulo', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    calificado_por_nombre = serializers.CharField(source='calificado_por.get_full_name', read_only=True)
    
    class Meta:
        model = RespuestaEvaluacion
        fields = ['id', 'evaluacion', 'evaluacion_titulo', 'estudiante', 'estudiante_nombre', 
                 'archivo_respuesta', 'respuestas_json', 'tiempo_gastado', 'advertencias',
                 'completado', 'fecha_envio', 'calificacion', 'comentarios_profesor', 
                 'fecha_calificacion', 'calificado_por', 'calificado_por_nombre']
        read_only_fields = ['id', 'estudiante', 'fecha_envio', 'fecha_calificacion', 'calificado_por_nombre']
    
    def create(self, validated_data):
        # Establecer automáticamente el estudiante desde el request
        validated_data['estudiante'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Si se está subiendo un archivo, marcar como completado
        if 'archivo_respuesta' in validated_data and validated_data['archivo_respuesta']:
            validated_data['completado'] = True
        
        return super().update(instance, validated_data)


class NotificacionSerializer(serializers.ModelSerializer):
    profesor_nombre = serializers.CharField(source='profesor.get_full_name', read_only=True)
    clase_nombre = serializers.CharField(source='clase_relacionada.tema', read_only=True)
    evaluacion_titulo = serializers.CharField(source='evaluacion_relacionada.titulo', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante_relacionado.get_full_name', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = ['id', 'tipo', 'titulo', 'mensaje', 'prioridad', 'leida', 
                 'profesor_nombre', 'clase_nombre', 'evaluacion_titulo', 'estudiante_nombre',
                 'tiempo_transcurrido', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"hace {diff.days} día{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"hace {hours} hora{'s' if hours > 1 else ''}"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"hace {minutes} minuto{'s' if minutes > 1 else ''}"
        else:
            return "hace unos segundos"


class EspecializacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especializacion
        fields = ['id', 'nombre', 'descripcion', 'precio_adicional', 'activo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'nombre', 'tipo', 'descripcion', 'precio_base', 'duracion_meses', 
                 'caracteristicas', 'activo', 'color_tema', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VentaSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    especializacion_nombre = serializers.CharField(source='especializacion.nombre', read_only=True)
    vendido_por_nombre = serializers.CharField(source='vendido_por.get_full_name', read_only=True)
    
    class Meta:
        model = Venta
        fields = ['id', 'estudiante', 'estudiante_nombre', 'plan', 'plan_nombre', 
                 'especializacion', 'especializacion_nombre', 'precio_plan', 'precio_especializacion',
                 'descuento', 'precio_total', 'metodo_pago', 'referencia_pago', 'estado',
                 'notas', 'vendido_por', 'vendido_por_nombre', 'fecha_venta', 'fecha_pago',
                 'fecha_inicio_plan', 'fecha_fin_plan', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Calcular precio total automáticamente
        precio_plan = validated_data.get('precio_plan', 0)
        precio_especializacion = validated_data.get('precio_especializacion', 0)
        descuento = validated_data.get('descuento', 0)
        validated_data['precio_total'] = precio_plan + precio_especializacion - descuento
        
        return super().create(validated_data)
