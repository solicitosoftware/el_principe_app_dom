import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { RUTA_FUNCTIONS } from "../config";
import { CodeError } from "../errors";

const endpoints = {
  actualizarEntrega: "api/updateEntregaPedido",
};

const initialState = {
  value: [],
  estado: {
    isLoading: false,
    success: false,
    error: false,
  },
};

const api = axios.create({
  baseURL: RUTA_FUNCTIONS,
});

export const actualizarEntregaPedidoAsync = createAsyncThunk(
  "pedidos/actualizarEntrega",
  async (data) => {
    const response = await api.put(
      `pedidos/${endpoints.actualizarEntrega}/${data.id}`,
      {
        ...data,
      }
    );
    return { ...data, entrega: response.data._writeTime };
  }
);

export const pedidosReducer = createSlice({
  name: "pedidos",
  initialState,
  reducers: {
    reiniciarEstados: (state) => {
      state.estado = initialState.estado;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(actualizarEntregaPedidoAsync.pending, (state) => {
        state.estado = {
          isLoading: true,
          success: false,
          error: false,
        };
      })
      .addCase(actualizarEntregaPedidoAsync.fulfilled, (state, action) => {
        state.estado = {
          isLoading: false,
          success: "Exito, registro actualizado",
          error: false,
        };
        const index = state.value.findIndex(
          (item) => item.id === action.payload.id
        );
        state.value[index] = action.payload;
      })
      .addCase(actualizarEntregaPedidoAsync.rejected, (state, action) => {
        state.estado = {
          isLoading: false,
          success: false,
          error: CodeError(action.error.code),
        };
      });
  },
});

export const { reiniciarEstados } = pedidosReducer.actions;

export const initialPedidos = (state) => state.pedidos.value;
export const estadoProceso = (state) => state.pedidos.estado;

export default pedidosReducer.reducer;
