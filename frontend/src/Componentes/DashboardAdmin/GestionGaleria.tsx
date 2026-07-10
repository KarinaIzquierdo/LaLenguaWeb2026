import React, { useState, useEffect } from 'react';
import './GestionGaleria.css';
import { galleryService, type MediaItem } from '../../services/galleryService';

// Función para cargar medios desde el backend
const loadMediaFromBackend = async (): Promise<MediaItem[]> => {
  try {
    return await galleryService.getAllMedia();
  } catch (error) {
    console.error('Error loading media from backend:', error);
    return [];
  }
};

export default function GestionGaleria() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'video' as 'video' | 'image',
    title: '',
    description: '',
    url: '',
    category: 'Videos' as 'Videos' | 'Infografías' | 'Fotos',
    author: 'Admin',
    contentSource: 'file' as 'file',
    file: null as File | null
  });

  // Cargar datos del backend al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await loadMediaFromBackend();
      setMediaItems(data);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Subida de archivo con FormData
      if (!formData.file) {
        alert('Selecciona un archivo para subir.');
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append('type', formData.type);
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('category', formData.category);
      fd.append('author', formData.author);
      // Importante: enviar el archivo real, NO la URL blob de preview
      fd.append('file', formData.file);

      console.log('Sending FormData (file upload)');

      if (editingItem && editingItem.id) {
        await galleryService.updateMedia(editingItem.id, fd);
      } else {
        await galleryService.createMedia(fd);
      }
      
      // Recargar datos del backend
      const updatedData = await loadMediaFromBackend();
      setMediaItems(updatedData);
    } catch (error) {
      console.error('Error saving media:', error);
      alert('Error al guardar el elemento. Por favor intenta de nuevo.');
    }
    
    // Reset form
    setFormData({
      type: 'video',
      title: '',
      description: '',
      url: '',
      category: 'Videos',
      author: 'Admin',
      contentSource: 'file',
      file: null
    });
    setShowForm(false);
    setEditingItem(null);
    setLoading(false);
  };

  const handleEdit = (item: MediaItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      title: item.title,
      description: item.description,
      url: item.url,
      category: item.category,
      author: item.author,
      contentSource: 'file',
      file: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      setLoading(true);
      try {
        await galleryService.deleteMedia(id);
        // Recargar datos del backend
        const updatedData = await loadMediaFromBackend();
        setMediaItems(updatedData);
      } catch (error) {
        console.error('Error deleting media:', error);
        alert('Error al eliminar el elemento. Por favor intenta de nuevo.');
      }
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Crear URL temporal para preview
      const fileUrl = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        file: file,
        url: fileUrl // Usar URL temporal para preview
      }));
    }
  };

  return (
    <div className="gestion-galeria">
      <div className="galeria-header">
        <h1>Gestión de Galería</h1>
        <p className="header-description">Administra el contenido multimedia de la galería</p>
        <button 
          className="btn-primary btn-agregar"
          onClick={() => setShowForm(true)}
        >
          ➕ Agregar Contenido
        </button>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Contenido' : 'Agregar Nuevo Contenido'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({
                    type: 'video',
                    title: '',
                    description: '',
                    url: '',
                    category: 'Videos',
                    author: 'Admin',
                    contentSource: 'file',
                    file: null
                  });
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="galeria-form">
              <div className="form-group">
                <label>Tipo de contenido:</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="video">🎥 Video</option>
                  <option value="image">📷 Imagen</option>
                </select>
              </div>

              <div className="form-group">
                <label>Título:</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Título del contenido"
                  required
                />
              </div>

              <div className="form-group">
                <label>Descripción:</label>
                <textarea 
                  name="description" 
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe el contenido..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Categoría:</label>
                <select 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="Videos">Videos</option>
                  <option value="Infografías">Infografías</option>
                  <option value="Fotos">Fotos</option>
                </select>
              </div>

              <div className="form-group">
                <label>Contenido:</label>
                <div className="file-upload-area">
                  <input 
                    type="file" 
                    name="file"
                    accept={formData.type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileChange}
                    className="file-input"
                    required
                  />
                  <div className="file-upload-hint">
                    {formData.type === 'image' 
                      ? 'Selecciona una imagen (JPG, PNG, GIF, etc.)'
                      : 'Selecciona un video (MP4, AVI, MOV, etc.)'
                    }
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Autor:</label>
                <input 
                  type="text" 
                  name="author" 
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Nombre del autor"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de contenido */}
      <div className="galeria-content">
        <div className="stats-cards">
          <div className="stat-card">
            <h3>{mediaItems.filter(item => item.type === 'video').length}</h3>
            <p>Videos</p>
          </div>
          <div className="stat-card">
            <h3>{mediaItems.filter(item => item.type === 'image').length}</h3>
            <p>Imágenes</p>
          </div>
          <div className="stat-card">
            <h3>{mediaItems.length}</h3>
            <p>Total</p>
          </div>
        </div>

        <div className="media-grid">
          {mediaItems.map(item => (
            <div key={item.id} className="media-card">
              <div className="media-preview">
                {item.type === 'video' ? (
                  <div className="video-preview">
                    <img src={item.thumbnail || item.url} alt={item.title} />
                    <div className="play-overlay">▶</div>
                  </div>
                ) : (
                  <img src={item.url} alt={item.title} />
                )}
                <div className="media-badge">{item.category}</div>
              </div>
              
              <div className="media-info">
                <h3>{item.title}</h3>
                <p className="media-description">{item.description}</p>
                <div className="media-meta">
                  <span>Por {item.author}</span>
                  <span>{item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
                </div>
                
                <div className="media-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(item)}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => item.id && handleDelete(item.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="loading-state">
            <p>Cargando galería...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="empty-state">
            <h3>No hay elementos en la galería</h3>
            <p>Agrega tu primer elemento multimedia haciendo clic en el botón "Agregar Elemento"</p>
          </div>
        ) : null}

      </div>
    </div>
  );
}
