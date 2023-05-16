// Utilidad para convertir un valor de modena a entero
export function formatearPrecio(val) {
  try {
    const value = val.replace('$', '').replace(/,/g, '');
    return parseInt(value ? value : 0);
  } catch (error) {
    console.error(error);
  }
}

// Utilidad para convertir un valor entero a modena
export function formatoPrecio(val) {
  try {
    if (val > 0) {
      let value = '$' + parseFloat(val).toFixed(0);
      value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return value;
    } else if (val === 0) {
      return '$' + val;
    } else if (val === '') {
      return val;
    }
    return null;
  } catch (error) {
    console.error(error);
  }
}

//Utilidad para capitalizar los textos
export function capitalize(val) {
  if (val) {
    let palabra = val
      .toLowerCase()
      .split(' ')
      .map((frase) => {
        if (frase != '') {
          return frase[0].trim().toUpperCase() + frase.slice(1);
        }
      });
    return palabra.join(' ');
  }
  return val;
}
