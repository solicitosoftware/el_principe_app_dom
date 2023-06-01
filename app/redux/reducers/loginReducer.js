import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: {
    id: null,
    token: false,
    rol: 1,
    sede: null,
  },
};

export const loginReducer = createSlice({
  name: "login",
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.value = action.payload;
    },
  },
});

export const { setLogin } = loginReducer.actions;

export const initialLogin = (state) => state.login.value;

export default loginReducer.reducer;
