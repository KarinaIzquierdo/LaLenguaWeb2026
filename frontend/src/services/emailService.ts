import emailjs from '@emailjs/browser';

// Tipos TypeScript
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  level: string;
  reason: string;
  source: string;
  contactMethod: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Configuración de EmailJS
const EMAILJS_CONFIG = {
  serviceId: 'service_yypcyqc', // Tu Service ID
  templateId: 'template_kqcqa2b', // Tu plantilla contactenos
  publicKey: '5IX1jA4A1wE1BoI8J', // Tu Public Key
  recipientEmail: 'the.languagess@gmail.com'
};

// Inicializar EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

/**
 * Envía un email usando EmailJS con los datos del formulario
 * @param {FormData} formData - Datos del formulario de contacto
 * @returns {Promise<EmailResponse>} - Promesa que resuelve cuando el email se envía
 */
export const sendContactEmail = async (formData: FormData): Promise<EmailResponse> => {
  try {
    // Preparar los datos para la plantilla
    const templateParams = {
      to_email: EMAILJS_CONFIG.recipientEmail,
      from_name: `${formData.firstName} ${formData.lastName}`,
      from_email: formData.email,
      phone: formData.phone,
      country: formData.country,
      city: formData.city,
      level: formData.level,
      reason: formData.reason,
      source: formData.source,
      contact_method: formData.contactMethod,
      message: `
        Nuevo contacto desde La Lengua:
        
        Nombre: ${formData.firstName} ${formData.lastName}
        Email: ${formData.email}
        Teléfono: ${formData.phone}
        País: ${formData.country}
        Ciudad: ${formData.city}
        Programa: ${formData.level}
        Motivo: ${formData.reason}
        Se enteró por: ${formData.source}
        Prefiere contacto por: ${formData.contactMethod}
      `
    };

    // Enviar el email
    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams
    );

    console.log('Email enviado exitosamente:', response);
    return { success: true, message: 'Email enviado correctamente' };

  } catch (error) {
    console.error('Error al enviar email:', error);
    return { 
      success: false, 
      message: 'Error al enviar el email. Por favor, intenta nuevamente.' 
    };
  }
};

/**
 * Valida que todos los campos requeridos estén completos
 * @param {FormData} formData - Datos del formulario
 * @returns {ValidationResult} - Resultado de la validación
 */
export const validateFormData = (formData: FormData): ValidationResult => {
  const requiredFields = ['firstName', 'lastName', 'email'];
  const missingFields = [];

  requiredFields.forEach(field => {
    const fieldValue = formData[field as keyof FormData];
    if (!fieldValue || fieldValue.trim() === '') {
      missingFields.push(field);
    }
  });

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    return {
      isValid: false,
      message: 'Por favor, ingresa un email válido'
    };
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: 'Por favor, completa todos los campos requeridos'
    };
  }

  return { isValid: true };
};
