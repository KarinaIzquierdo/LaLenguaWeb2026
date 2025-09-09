from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion

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
    estudiantes = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomUser.objects.all())
    class Meta:
        model = Clase
        fields = ['id', 'nombre', 'profesor', 'fecha', 'estudiantes', 'created_at', 'updated_at']

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
