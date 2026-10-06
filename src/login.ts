import usuarios from './usuarios-demo.json';

// Credenciales públicas de demostración. Reemplazar por autenticación del servidor.
export function buscarCuenta(usuario: string, contrasena: string) {
  return usuarios.find(
    (cuenta) =>
      cuenta.usuario.toLowerCase() === usuario.trim().toLowerCase() &&
      cuenta.contrasena === contrasena,
  );
}

export function validarRegistro(usuario: string, contrasena: string, confirmacion: string) {
  const nombre = usuario.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(nombre)) {
    return 'El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.';
  }
  if (usuarios.some((cuenta) => cuenta.usuario.toLowerCase() === nombre.toLowerCase())) {
    return 'Ese nombre de usuario ya está en uso. Elegí otro.';
  }
  if (contrasena.length < 8 || !/[a-zA-Z]/.test(contrasena) || !/[0-9]/.test(contrasena)) {
    return 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
  }
  if (contrasena !== confirmacion) return 'Las contraseñas no coinciden.';
  return '';
}
