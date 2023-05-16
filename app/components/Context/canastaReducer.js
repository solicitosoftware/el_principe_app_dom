const initialValueCanasta = [];

const types = {
  add: 'add',
  delete: 'delete',
  minus: 'minus',
  plus: 'plus',
  clear: 'clear',
};

const canastaReducer = (state, accion) => {
  switch (accion.type) {
    case types.add:
      return [...state, accion.data];
    case types.plus:
      return [...state];
    case types.minus:
      return [...state];
    case types.delete:
      state.splice(accion.data, 1);
      return [...state];
    case types.clear:
      return initialValueCanasta;
    default:
      return state;
  }
};

export {initialValueCanasta, types};
export default canastaReducer;
