# 📚 API de Clases Programadas para Android

## ✅ Endpoint Implementado

### **GET** `/api/classes/`

Endpoint para obtener todas las clases programadas del usuario autenticado.

---

## 🔐 Autenticación

**Requiere:** Token JWT en el header

```
Authorization: Bearer <token>
```

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

```json
{
  "success": true,
  "total": 3,
  "clases": [
    {
      "id": 1,
      "nombre": "English Conversation",
      "profesor": "Prof. María García",
      "fecha": "2025-10-15",
      "hora": "10:00",
      "duracion": 60,
      "tema": "Business English",
      "descripcion": "Práctica de conversación en contextos empresariales",
      "tipo_clase": "individual",
      "modalidad": "virtual",
      "meet_link": "https://meet.google.com/abc-defg-hij",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    },
    {
      "id": 2,
      "nombre": "Grammar Workshop",
      "profesor": "Prof. John Smith",
      "fecha": "2025-10-16",
      "hora": "14:00",
      "duracion": 90,
      "tema": "Present Perfect Tense",
      "descripcion": "Taller intensivo de gramática",
      "tipo_clase": "grupal",
      "modalidad": "virtual",
      "meet_link": "https://meet.google.com/xyz-uvwx-yz",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    },
    {
      "id": 3,
      "nombre": "Pronunciation Practice",
      "profesor": "Prof. Sarah Johnson",
      "fecha": "2025-10-17",
      "hora": "16:00",
      "duracion": 45,
      "tema": "American Accent",
      "descripcion": "Ejercicios de pronunciación",
      "tipo_clase": "individual",
      "modalidad": "presencial",
      "meet_link": "",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    }
  ]
}
```

### **Sin clases (200 OK):**

```json
{
  "success": true,
  "total": 0,
  "clases": []
}
```

### **Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error al obtener clases: [descripción del error]",
  "clases": []
}
```

### **Error de autenticación (401 Unauthorized):**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 📊 Campos de Clase

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único de la clase |
| `nombre` | String | Nombre de la clase |
| `profesor` | String | Nombre del profesor |
| `fecha` | String (ISO) | Fecha de la clase (YYYY-MM-DD) |
| `hora` | String | Hora de inicio (HH:MM) |
| `duracion` | Integer | Duración en minutos |
| `tema` | String | Tema específico de la clase |
| `descripcion` | String | Descripción detallada |
| `tipo_clase` | String | "individual" o "grupal" |
| `modalidad` | String | "virtual" o "presencial" |
| `meet_link` | String | URL de Google Meet (si es virtual) |
| `estado` | String | "programada", "activa" o "completada" |
| `created_at` | String (ISO) | Fecha de creación |

---

## 🔧 Implementación en Android (Kotlin)

### **1. Crear modelo de datos:**

```kotlin
data class Clase(
    val id: Int,
    val nombre: String,
    val profesor: String,
    val fecha: String,
    val hora: String,
    val duracion: Int,
    val tema: String,
    val descripcion: String,
    @SerializedName("tipo_clase")
    val tipoClase: String,
    val modalidad: String,
    @SerializedName("meet_link")
    val meetLink: String,
    val estado: String,
    @SerializedName("created_at")
    val createdAt: String
)

data class ClassesResponse(
    val success: Boolean,
    val total: Int,
    val clases: List<Clase>
)
```

### **2. Agregar función en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @GET("classes/")
    suspend fun getUserClasses(
        @Header("Authorization") token: String
    ): ClassesResponse
}
```

### **3. Implementar en Repository:**

```kotlin
class ClassesRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getUserClasses(): Result<List<Clase>> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            val response = apiService.getUserClasses("Bearer $token")
            
            if (response.success) {
                Result.Success(response.clases)
            } else {
                Result.Error("Error al obtener clases")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

### **4. Crear ViewModel:**

```kotlin
class ClassesViewModel(
    private val classesRepository: ClassesRepository
) : ViewModel() {
    
    private val _classes = MutableStateFlow<List<Clase>>(emptyList())
    val classes: StateFlow<List<Clase>> = _classes.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        loadClasses()
    }
    
    fun loadClasses() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            when (val result = classesRepository.getUserClasses()) {
                is Result.Success -> {
                    _classes.value = result.data
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadClasses()
    }
}
```

### **5. Implementar UI en ClassesScreen.kt:**

```kotlin
@Composable
fun ClassesScreen(
    viewModel: ClassesViewModel = hiltViewModel()
) {
    val classes by viewModel.classes.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clases Programadas") }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = error ?: "Error desconocido",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("Reintentar")
                        }
                    }
                }
                classes.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.EventBusy,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No tienes clases programadas",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(classes) { clase ->
                            ClassCard(clase = clase)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClassCard(clase: Clase) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Nombre de la clase
            Text(
                text = clase.nombre,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Profesor
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = clase.profesor,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Fecha y hora
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${clase.fecha} - ${clase.hora}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Tema
            if (clase.tema.isNotEmpty()) {
                Text(
                    text = "Tema: ${clase.tema}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Badges
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Tipo de clase
                Badge(text = clase.tipoClase)
                
                // Modalidad
                Badge(text = clase.modalidad)
                
                // Estado
                Badge(
                    text = clase.estado,
                    containerColor = when (clase.estado) {
                        "programada" -> Color(0xFF2196F3)
                        "activa" -> Color(0xFF4CAF50)
                        "completada" -> Color(0xFF9E9E9E)
                        else -> Color.Gray
                    }
                )
            }
            
            // Link de Meet (si existe)
            if (clase.meetLink.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = { /* Abrir link */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.VideoCall,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Unirse a la clase")
                }
            }
        }
    }
}

@Composable
fun Badge(
    text: String,
    containerColor: Color = MaterialTheme.colorScheme.primaryContainer
) {
    Surface(
        color = containerColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
}
```

---

## 🧪 Probar con cURL

```bash
# 1. Hacer login y obtener token
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "adrian@thelanguage.co", "password": "12345678"}'

# 2. Obtener clases (usa el token del paso 1)
curl -X GET http://localhost:8000/api/classes/ \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

## 📝 Notas importantes

1. **Las clases se ordenan** por fecha y hora (más próximas primero)
2. **Solo se devuelven las clases del usuario autenticado**
3. **El campo `meet_link` puede estar vacío** si la clase es presencial
4. **El estado puede ser:** "programada", "activa" o "completada"
5. **Implementa pull-to-refresh** para actualizar la lista

---

## 🎯 Funcionalidades sugeridas

- ✅ **Mostrar lista de clases** ordenadas por fecha
- ✅ **Filtrar por estado** (programadas, completadas)
- ✅ **Botón para unirse** a clases virtuales (abrir Meet link)
- ✅ **Pull to refresh** para actualizar
- ✅ **Notificaciones** antes de cada clase
- ✅ **Calendario visual** de clases
