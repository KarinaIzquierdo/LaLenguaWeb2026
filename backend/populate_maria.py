import os
import django

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Especializacion, Plan, Suscripcion, Asistencia, Venta, Clase
from django.utils import timezone
from datetime import date, timedelta
import random

def populate_maria_data():
    u = CustomUser.objects.filter(id=26).first()
    if not u:
        print("User Maria not found")
        return

    # Update personal info
    u.phone = "+57 312 456 7890"
    u.cedula = "1098765432"
    u.country = "Colombia"
    u.city = "Bogotá"
    u.address = "Calle 100 #15-20, Edificio El Dorado"
    u.birth_date = date(2000, 5, 15)
    u.learning_goals = "Mejorar mi fluidez conversacional para viajes de negocios y obtener la certificación B2."
    
    # Update gamification
    u.total_xp = 1250
    u.total_dulces = 45
    u.reto_racha_actual = 5
    u.reto_mejor_racha = 12
    
    # Ensure she has a specialization
    esp = Especializacion.objects.filter(activa=True).first()
    if esp:
        u.especializacion = esp
    
    u.save()

    # Create/Update Subscription
    plan = Plan.objects.filter(activo=True).first()
    if plan:
        # Check if she has a sale
        venta = Venta.objects.filter(estudiante=u, plan=plan).first()
        if not venta:
            venta = Venta.objects.create(
                estudiante=u,
                plan=plan,
                precio_plan=plan.precio_base,
                precio_total=plan.precio_base,
                metodo_pago='transferencia',
                estado='pagado',
                fecha_inicio_plan=date.today() - timedelta(days=30),
                fecha_fin_plan=date.today() + timedelta(days=60)
            )

        sub, created = Suscripcion.objects.get_or_create(
            estudiante=u,
            defaults={
                'venta': venta,
                'plan': plan,
                'fecha_inicio': date.today() - timedelta(days=30),
                'fecha_fin': date.today() + timedelta(days=60),
                'estado': 'activa',
                'clases_totales': 24,
                'clases_tomadas': 8,
            }
        )
        if not created:
            sub.venta = venta
            sub.plan = plan
            sub.clases_totales = 24
            sub.clases_tomadas = 8
            sub.save()

    # Add some attendances if none exist
    if not Asistencia.objects.filter(estudiante=u).exists():
        states = ['presente', 'presente', 'presente', 'tardanza', 'presente']
        for i in range(5):
            Asistencia.objects.create(
                estudiante=u,
                fecha=date.today() - timedelta(days=i*2 + 1),
                estado=random.choice(states),
                observaciones="Participación activa en clase"
            )

    # Add some classes
    if not u.clases.exists():
        profesor = CustomUser.objects.filter(role='profesor').first()
        Clase.objects.create(
            nombre="Conversational English I",
            profesor=profesor.get_full_name() if profesor else "Teacher John",
            fecha=date.today() - timedelta(days=2),
            hora="14:00",
            estado="completada"
        ).estudiantes.add(u)
        
        Clase.objects.create(
            nombre="Business Vocabulary",
            profesor=profesor.get_full_name() if profesor else "Teacher John",
            fecha=date.today() + timedelta(days=1),
            hora="10:00",
            estado="programada"
        ).estudiantes.add(u)

    print("Data populated for Maria Garcia")

if __name__ == "__main__":
    populate_maria_data()
