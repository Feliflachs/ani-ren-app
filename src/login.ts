export function validarRegistro(usuario: string, contrasena: string, confirmacion: string) {
  const nombre = usuario.trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(nombre)) {
    return 'El usuario debe tener entre 3 y 20 caracteres: letras, números o guion bajo.';
  }
  if (
    contrasena.length < 8 ||
    contrasena.length > 128 ||
    !/[a-zA-Z]/.test(contrasena) ||
    !/[0-9]/.test(contrasena)
  ) {
    return 'La contraseña debe tener al menos 8 caracteres, una letra y un número.';
  }
  if (contrasena !== confirmacion) return 'Las contraseñas no coinciden.';
  return '';
}
