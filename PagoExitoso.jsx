import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import './PagoExitoso.css';

const PagoExitoso = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [datosPago, setDatosPago] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener pago desde Mercado Pago API
  const fetchPaymentFromMercadoPago = async (paymentId) => {
    try {
      const token = process.env.REACT_APP_MP_ACCESS_TOKEN;
      
      if (!token) {
        throw new Error('Token de Mercado Pago no configurado');
      }

      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error al obtener pago: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching payment:', err);
      throw err;
    }
  };

  // Función para buscar pagos
  const searchPayments = async (filters = {}) => {
    try {
      const token = process.env.REACT_APP_MP_ACCESS_TOKEN;
      
      if (!token) {
        throw new Error('Token de Mercado Pago no configurado');
      }

      const params = new URLSearchParams({
        sort: filters.sort || 'date_created',
        criteria: filters.criteria || 'desc',
        limit: filters.limit || 30,
        ...filters
      });

      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error al buscar pagos: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error searching payments:', err);
      throw err;
    }
  };

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Intentar obtener datos del pago desde location.state o sessionStorage
        let pago = location.state?.pago || JSON.parse(sessionStorage.getItem('pagoProcesado'));
        
        // Si no hay datos locales, intentar obtener de parámetros de URL o Mercado Pago API
        if (!pago) {
          const paymentIdFromParams = searchParams.get('payment_id');
          const externalRefFromParams = searchParams.get('external_reference');

          if (paymentIdFromParams) {
            // Obtener detalles del pago desde Mercado Pago
            pago = await fetchPaymentFromMercadoPago(paymentIdFromParams);
          } else if (externalRefFromParams) {
            // Buscar pago por referencia externa
            const searchResult = await searchPayments({
              external_reference: externalRefFromParams,
              status: 'approved'
            });
            
            if (searchResult.results && searchResult.results.length > 0) {
              pago = searchResult.results[0];
            } else {
              throw new Error('No se encontró el pago con esa referencia');
            }
          }
        }

        if (pago) {
          // Enriquecer datos si es necesario
          if (!pago.paymentId && pago.id) {
            pago.paymentId = pago.id;
          }
          
          setDatosPago(pago);
          // Limpiar sessionStorage después de obtener datos
          sessionStorage.removeItem('pagoProcesado');
        } else {
          setError('No hay datos de pago disponibles');
        }
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError(err.message || 'Error al cargar los datos del pago');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [location.state, searchParams]);

  const handleDescargarComprobante = () => {
    if (!datosPago) return;
    
    const contenido = `
COMPROBANTE DE PAGO EXITOSO
============================
Fecha: ${new Date().toLocaleString('es-AR')}

DATOS DEL EVENTO
Evento ID: ${datosPago.eventId || 'N/A'}
Descripción: ${datosPago.description || datosPago.additional_info?.items?.[0]?.title || 'N/A'}

DETALLES DEL PAGO
Monto: $${(datosPago.transaction_amount || datosPago.amount).toFixed(2)} ARS
Cuotas: ${datosPago.installments || 1}
Método: ${(datosPago.payment_method_id || datosPago.payment_method?.id || 'N/A').toUpperCase()}
ID Transacción: ${datosPago.paymentId || datosPago.id}
Estado: ${(datosPago.status || 'APROBADO').toUpperCase()}

DATOS DEL COMPRADOR
Email: ${datosPago.payer?.email || 'N/A'}
Documento: ${datosPago.payer?.identification?.type || 'N/A'} ${datosPago.payer?.identification?.number || 'N/A'}

============================
Gracias por tu compra en EntradaWeb
    `;
    
    // Crear blob y descargar
    const blob = new Blob([contenido], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-${datosPago.paymentId || datosPago.id}.txt`;
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

  if (error) {
    return (
      <div className="pago-exitoso-error">
        <h2>Error: {error}</h2>
        <button onClick={handleVolverAlHome}>Volver al inicio</button>
      </div>
    );
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
            <span className="detalle-valor">${(datosPago.transaction_amount || datosPago.amount).toFixed(2)} ARS</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Evento:</span>
            <span className="detalle-valor">{datosPago.description || datosPago.additional_info?.items?.[0]?.title || 'N/A'}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">ID Transacción:</span>
            <span className="detalle-valor codigo">{datosPago.paymentId || datosPago.id}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Cuotas:</span>
            <span className="detalle-valor">{datosPago.installments || 1}x sin interés</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Método de pago:</span>
            <span className="detalle-valor">{(datosPago.payment_method_id || datosPago.payment_method?.id || 'N/A').toUpperCase()}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Email:</span>
            <span className="detalle-valor">{datosPago.payer?.email || 'N/A'}</span>
          </div>

          <div className="detalle-item">
            <span className="detalle-label">Estado:</span>
            <span className="detalle-valor">{(datosPago.status || 'APROBADO').toUpperCase()}</span>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="pago-exitoso-info">
          <p>
            Se ha enviado un comprobante a <strong>{datosPago.payer?.email || 'tu email'}</strong>
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