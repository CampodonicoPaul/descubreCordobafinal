
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Instagram, MessageCircle, Mail, MapPin } from 'lucide-react';

function Footer() {
  const [contactos,setContactos] = useState({whatsapp:'3546571278',email:'descubre.cordoba@gmail.com'});
  const instagram = 'descubre.cordoba';
  useEffect(()=>{fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/empresa/contacto`).then(r=>r.json()).then(r=>{if(r?.data)setContactos({whatsapp:r.data.whatsapp || '',email:r.data.email || ''});}).catch(()=>{});},[]);
  const numeroContacto=String(contactos.whatsapp||'').replace(/\D/g,'');
  const whatsapp=numeroContacto.length===10 ? `549${numeroContacto}` : numeroContacto;
  const email=contactos.email;

  const mensaje = encodeURIComponent(
    '¡Hola! Quisiera consultar sobre las excursiones de Descubre Córdoba.'
  );

  const linkWhatsApp = whatsapp
    ? `https://wa.me/${whatsapp}?text=${mensaje}`
    : null;

  const linkInstagram = instagram
    ? `https://www.instagram.com/${instagram}/`
    : null;

  return (
    <footer
      id="contacto"
      className="mt-auto bg-neutral-950 text-white"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-3 lg:py-16">

        {/* MARCA */}
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            DESCUBRE{' '}
            <span className="text-orange-500">CÓRDOBA</span>
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-7 text-neutral-400">
            Descubrí paisajes increíbles, experiencias únicas
            y aventuras inolvidables en Córdoba.
            Tu próximo viaje comienza acá.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm text-neutral-400">
            <MapPin size={17} className="text-orange-500" />
            Córdoba, Argentina
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div>
          <h3 className="text-base font-semibold">
            Explorar
          </h3>

          <nav className="mt-5 flex flex-col items-start gap-3 text-sm text-neutral-400">
            <Link to="/" className="hover:text-orange-400">
              Inicio
            </Link>

            <Link to="/excursiones" className="hover:text-orange-400">
              Excursiones
            </Link>

           <a
  href="/#preguntas-frecuentes"
  className="hover:text-orange-400"
>
  Preguntas frecuentes
</a>

            <Link to="/registro" className="hover:text-orange-400">
              Crear mi cuenta
            </Link>
          </nav>
        </div>

        {/* CONTACTO */}
        <div>
          <h3 className="text-base font-semibold">
            ¿Necesitás ayuda?
          </h3>

          <p className="mt-4 text-sm leading-6 text-neutral-400">
            Contactanos para consultar sobre excursiones,
            fechas disponibles y reservas.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {linkWhatsApp && (
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
            )}

            {linkInstagram && (
              <a
                href={linkInstagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-4 py-3 text-sm font-semibold transition hover:border-orange-400 hover:text-orange-400"
              >
                <Instagram size={18} />
                Instagram
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-600 px-4 py-3 text-sm font-semibold transition hover:text-orange-400"
              >
                <Mail size={18} />
                Email
              </a>
            )}
          </div>
        </div>
      </div>

      {/* PARTE INFERIOR */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-center text-xs text-neutral-500 sm:px-8 md:flex-row">
          <p>
            © {new Date().getFullYear()} Descubre Córdoba.
            Todos los derechos reservados.
          </p>

          <p>
            Naturaleza · Aventura · Experiencias
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
