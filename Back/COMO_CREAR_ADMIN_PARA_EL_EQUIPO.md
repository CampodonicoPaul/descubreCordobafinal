# Administrador inicial para todo el grupo

El ZIP **no contiene usuarios de MySQL**: cada compañero tiene su propia base local. La semilla crea el mismo correo de administrador en cada base donde se ejecute. El proyecto incluye `crearAdmin.js` y `npm run seed:admin`.

1. Crear una base vacía `descubre_cordoba_final` y configurar los datos de MySQL en `.env` (copiar `.env.example`). **No compartir el `.env` ni las claves en GitHub.**
2. Ejecutar `npm install` y `npm start` para que Sequelize cree las tablas. Mantener la base conectada; luego detener o abrir otra terminal en esa carpeta.
3. En `.env`, fijar `ADMIN_SEED_EMAIL` y `ADMIN_SEED_PASSWORD` (contraseña segura, mínimo 12 caracteres). Definir también `JWT_SECRET_CLIENT`, `JWT_SECRET_ADMIN` y `JWT_SECRET` con valores aleatorios. Para generar una clave: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` (repetir tres veces).
4. Ejecutar `npm run seed:admin` desde la carpeta del backend. El script crea el rol `ADMIN` si no existe y agrega un usuario. **No duplica usuarios si lo ejecutan dos veces.** La contraseña se encripta mediante el hook bcrypt del modelo.
5. Iniciar/reiniciar el backend (`npm start`). Entrar en el frontend a `http://localhost:5173/admin/login` y usar el correo y contraseña indicados en el `.env` de cada equipo.

Si quieren que todos utilicen el **mismo login de prueba**, acuerden un correo y una contraseña de desarrollo y colóquenlos en sus `.env` locales (no los suban al repositorio). Para producción, cada administrador debe tener credenciales personales y hay que retirar/cambiar las credenciales de prueba.

Comprobar en Workbench:
```sql
USE descubre_cordoba_final;
SELECT u.id, u.nombre, u.email, r.nombre AS rol
FROM usuarios_admin u LEFT JOIN roles r ON r.id = u.idRol;
```

**Importante:** las claves JWT deben estar configuradas antes de iniciar sesión. Si un admin existente tiene otra contraseña, esta semilla no la reemplaza (para evitar que cambie silenciosamente).
