from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Clase, Evaluation

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'country', 'city', 'level', 
                 'birth_date', 'cedula', 'address', 'emergency_contact', 'emergency_phone', 
                 'english_level', 'learning_goals', 'profile_completed', 'role', 'is_profesor', 'is_active')
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

    class Meta:
        model = CustomUser
        fields = ('first_name', 'last_name', 'email', 'role', 'password')

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo electrónico.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.username = validated_data['email']  # Usar email como username
        user.set_password(password)
        if validated_data['role'] == 'profesor':
            user.is_profesor = True
        user.save()
        return user

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'usuario', 'tipo', 'score', 'intentos', 'fecha', 'detalles']
        read_only_fields = ['id', 'usuario', 'fecha']
