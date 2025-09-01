from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'country', 'city', 'level', 
                 'birth_date', 'cedula', 'address', 'emergency_contact', 'emergency_phone', 
                 'english_level', 'learning_goals', 'profile_completed', 'role', 'is_profesor')
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
