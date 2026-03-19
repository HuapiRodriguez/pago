import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PagoExitoso.css';

const PagoExitoso = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [datosPago, setDatosPago] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener datos del pago desde location.state o sessionStorage
    const pago = location.state?.pago || JSON.parse(sessionStorage.getItem('pagoProcesado'));
    
    if (pago) {
      setDatosPago(pago);
      // Limpiar sessionStorage después de obtener datos
      sessionStorage.removeItem('pagoProcesado');
    }
    
    setLoading(false);
  }, [location.state]);

  const handleDescargarComprobante = () => {
    if (!datosPago) return;
    
    const contenido = `
COMPROBANTE DE PAGO EXITOSO
============================
Fecha: ${new Date().toLocaleString('es-AR')}

DATOS DEL EVENTO
Evento ID: ${datosPago.eventId}
Descripción: ${datosPago.description}

DETALLES DEL PAGO
Monto: $${datosPago.transaction_amount.toFixed(2)} ARS
Cuotas: ${datosPago.installments}
Método: ${datosPago.payment_method_id.toUpperCase()}
ID Transacción: ${datosPago.paymentId}
Estado: APROBADO

DATOS DEL COMPRADOR
Email: ${datosPago.payer.email}
Documento: ${datosPago.payer.identification.type} ${datosPago.payer.identification.number}

============================
Gracias por tu compra en EntradaWeb
    `;
    
    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${datosPago.paymentId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleVolverAlHome = () => {
    navigate('/');
  };

  const handleVerMisEntradas = () => {
    navigate('/mis-entradas');
  };

  if (loading) {
    return <div className="pago-exitoso-loading">Cargando...</div>;
  }

  if (!datosPago) {
    return (
      <div className="pago-exitoso-error">
        <h2>Error: No hay datos de pago</h2>
        <button onClick={handleVolverAlHome}>Volver al inicio</button>
      </div>
    );
  }

  return (
    <div className="pago-exitoso-container">
      <div className="pago-exitoso-card">
        {/* Icono de éxito */}
        <div className="pago-exitoso-icon">
          <svg className="checkmark" viewBox="0 0 52 52">
            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
        </div>

        {/* Título */}
        <h1 className="pago-exitoso-title">¡Pago Exitoso!</h1>
        <p className="pago-exitoso-subtitle">Tu transacción ha sido aprobada</p>

        {/* Detalles del pago */}
        <div className="pago-exitoso-detalles">
          <div className="detalle-item">
            <span className="detalle-label">Monto pagado:</span>
            <span className="detalle-valor">${datosPago.transaction_amount.toFixed(2)} ARS</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Evento:</span>
            <span className="detalle-valor">{datosPago.description}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">ID Transacción:</span>
            <span className="detalle-valor codigo">{datosPago.paymentId}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Cuotas:</span>
            <span className="detalle-valor">{datosPago.installments}x sin interés</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Método de pago:</span>
            <span className="detalle-valor">{datosPago.payment_method_id.toUpperCase()}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Email:</span>
            <span className="detalle-valor">{datosPago.payer.email}</span>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="pago-exitoso-info">
          <p>
            Se ha enviado un comprobante a <strong>{datosPago.payer.email}</strong>
          </p>
          <p>
            Tus entradas estarán disponibles en tu cuenta dentro de 5 minutos
          </p>
        </div>

        {/* Botones de acción */}
        <div className="pago-exitoso-acciones">
          <button 
            className="btn btn-primary"
            onClick={handleVerMisEntradas}
          >
            Ver mis entradas
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={handleDescargarComprobante}
          >
            Descargar comprobante
          </button>

          <button 
            className="btn btn-outline"
            onClick={handleVolverAlHome}
          >
            Volver al inicio
          </button>
        </div>

        {/* Footer */}
        <div className="pago-exitoso-footer">
          <p>¿Necesitas ayuda? Contacta a soporte@entradaweb.com.ar</p>
        </div>
      </div>
    </div>
  );
};

export default PagoExitoso;