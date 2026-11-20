import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  UserRound,
  Heart,
  LogOut,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrarMenu = () => setMenuAbierto(false);

  const cerrarSesion = () => {
    logout();
    cerrarMenu();
    navigate('/');
  };

  const estiloLink = ({ isActive }) =>
    `transition hover:text-orange-400 ${
      isActive ? 'text-orange-400' : 'text-white'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-neutral-950/95 text-white shadow-md backdrop-blur-md">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">

        {/* LOGO */}
        <Link
          to="/"
          onClick={cerrarMenu}
          className="shrink-0 text-lg font-black tracking-tight sm:text-2xl"
        >
          <span>DESCUBRE </span>
          <span className="text-orange-500">CÓRDOBA</span>
        </Link>

        {/* NAVEGACIÓN EN COMPUTADORA */}
        <nav className="hidden items-center gap-5 text-sm font-medium lg:flex">
          <NavLink to="/" end className={estiloLink}>
            Inicio
          </NavLink>

          <NavLink to="/excursiones" className={estiloLink}>
            Catálogo
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={estiloLink}>
                Ingresar
              </NavLink>

              <Link
                to="/registro"
                className="rounded-xl bg-orange-500 px-5 py-3 font-semibold transition hover:bg-orange-600"
              >
                Registrarse
              </Link>
            </>
          ) : (
            <>
              <NavLink to="/perfil" className={estiloLink}>
                <span className="flex items-center gap-2">
                  <UserRound size={17} />
                  Mi perfil
                </span>
              </NavLink>

              <NavLink to="/carrito" className={estiloLink}>
                <span className="flex items-center gap-2">
                  <ShoppingCart size={17} />
                  Carrito
                </span>
              </NavLink>

              {/* Acceso directo a las reservas */}
              <NavLink to="/mis-pedidos" className={estiloLink}>
                <span className="flex items-center gap-2">
                  <CalendarDays size={17} />
                  Mis reservas
                </span>
              </NavLink>

              <NavLink to="/favoritos" className={estiloLink}>
                <span className="flex items-center gap-2">
                  <Heart size={17} />
                  Favoritos
                </span>
              </NavLink>

              <button
                type="button"
                onClick={cerrarSesion}
                className="rounded-xl bg-orange-500 px-5 py-3 font-semibold transition hover:bg-orange-600"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </nav>

        {/* BOTÓN DEL MENÚ EN CELULAR */}
        <button
          type="button"
          className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
        >
          {menuAbierto ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MENÚ DESPLEGABLE PARA CELULAR Y TABLET */}
      {menuAbierto && (
        <nav
          id="menu-movil"
          className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 text-sm font-medium lg:hidden"
        >
          <NavLink to="/" end onClick={cerrarMenu} className={estiloLink}>
            Inicio
          </NavLink>

          <NavLink to="/excursiones" onClick={cerrarMenu} className={estiloLink}>
            Catálogo
          </NavLink>

          {!isAuthenticated ? (
            <>
              <NavLink to="/login" onClick={cerrarMenu} className={estiloLink}>
                Ingresar
              </NavLink>

              <NavLink to="/registro" onClick={cerrarMenu} className={estiloLink}>
                Registrarse
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/perfil" onClick={cerrarMenu} className={estiloLink}>
                Mi perfil
              </NavLink>

              <NavLink to="/carrito" onClick={cerrarMenu} className={estiloLink}>
                Carrito
              </NavLink>

              {/* Acceso a las reservas desde celular */}
              <NavLink to="/mis-pedidos" onClick={cerrarMenu} className={estiloLink}>
                Mis reservas
              </NavLink>

              <NavLink to="/favoritos" onClick={cerrarMenu} className={estiloLink}>
                Favoritos
              </NavLink>

              <button
                type="button"
                onClick={cerrarSesion}
                className="flex items-center gap-2 self-start rounded-xl bg-orange-500 px-5 py-3 font-semibold"
              >
                <LogOut size={17} />
                Cerrar sesión
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
