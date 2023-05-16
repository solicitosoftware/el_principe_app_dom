const initialValueNotify = {notificaciones: [], cambios: 0};

const types = {
  add: 'add',
  plus: 'plus',
  clear: 'clear',
};

const notifyReducer = (state, accion) => {
  switch (accion.type) {
    case types.add:
      state.notificaciones.push(accion.data);
      return state;
    case types.plus:
      state.cambios = accion.data;
      return state;
    case types.clear:
      state.cambios = accion.data;
      return state;
    default:
      return state;
  }
};

export {initialValueNotify, types};
export default notifyReducer;
