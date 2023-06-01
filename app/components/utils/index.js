export const diffMinutos = (despacho, entrega) => {
  const milisegundosPorMinuto = 60 * 1000;
  const diferencia = entrega.getTime() - despacho.getTime();
  const minutos = Math.floor(diferencia / milisegundosPorMinuto);
  const minutosRound = Math.abs(minutos) % 60;
  const horas = Math.floor(minutos / 60);
  return horas > 0
    ? minutosRound > 0
      ? `${horas} h ${minutosRound} min`
      : `${horas} h`
    : `${minutosRound} min`;
};
