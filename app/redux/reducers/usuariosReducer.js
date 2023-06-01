import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { RUTA_FUNCTIONS } from "../config";
import { CodeError } from "../errors";
import { REACT_APP_FIREBASE_KEY } from "@env";

const endpoints = {
  obtener: "api/getUsuario",
};

const initialState = {
  value: {},
  estado: {
    isLoading: false,
    success: false,
    error: false,
  },
};

const api = axios.create({
  baseURL: RUTA_FUNCTIONS,
});

export const loginUsuarioAsync = createAsyncThunk(
  "usuarios/login",
  async (data) => {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${REACT_APP_FIREBASE_KEY}`,
      {
        email: data.correo,
        password: data.password,
        returnSecureToken: true,
      }
    );
    return response.data;
  }
);

export const obtenerUsuarioAsync = createAsyncThunk(
  "usuarios/obtener",
  async (data) => {
    const response = await api.put(`usuarios/${endpoints.obtener}/${data}`);
    return response.data;
  }
);

export const usuariosReducer = createSlice({
  name: "usuarios",
  initialState,
  reducers: {
    logout: () => {},
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUsuarioAsync.pending, (state) => {
        state.estado = {
          isLoading: true,
          ...state.estado,
        };
      })
      .addCase(loginUsuarioAsync.fulfilled, (state, action) => {
        state.estado = {
          isLoading: false,
          ...state.estado,
        };
      })
      .addCase(loginUsuarioAsync.rejected, (state, action) => {
        state.estado = {
          isLoading: false,
          ...state.estado,
        };
      })

      .addCase(obtenerUsuarioAsync.pending, (state) => {
        state.estado = {
          isLoading: true,
          success: false,
          error: false,
        };
      })
      .addCase(obtenerUsuarioAsync.fulfilled, (state, action) => {
        state.estado = {
          isLoading: false,
          success: false,
          error: false,
        };
        state.value = action.payload;
      })
      .addCase(obtenerUsuarioAsync.rejected, (state, action) => {
        state.estado = {
          isLoading: false,
          success: false,
          error: CodeError(action.error.code),
        };
      });
  },
});

export const { logout } = usuariosReducer.actions;

export const initialUsuarios = (state) => state.usuarios.value;
export const estadoProceso = (state) => state.usuarios.estado;

export default usuariosReducer.reducer;
