import { combineReducers, configureStore } from "@reduxjs/toolkit";
import usuariosReducer from "./reducers/usuariosReducer";
import loginReducer from "./reducers/loginReducer";
import pedidosReducer from "./reducers/pedidosReducer";

const combinedReducer = combineReducers({
  usuarios: usuariosReducer,
  pedidos: pedidosReducer,
  login: loginReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "usuarios/logout") {
    state = undefined;
  }
  return combinedReducer(state, action);
};

export default configureStore({
  reducer: rootReducer,
});
