export function CodeError(code) {
  switch (code) {
    case "ERR_NETWORK":
      return "Error, intetelo nuevamente";
    case "ERR_BAD_REQUEST":
      return "Error, no fue posible conectar con el servidor";
    case "ERR_BAD_RESPONSE":
      return "Error, valida los datos ingresados";
    default:
      return "Error, intetelo nuevamente";
  }
}
