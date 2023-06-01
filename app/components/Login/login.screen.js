import React, { useState, useRef, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import Colors from "../../theme/colors";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableNativeFeedback,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
  AppState,
} from "react-native";
import SplashScreen from "react-native-splash-screen";
import Toast, { DURATION } from "react-native-easy-toast";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import { Image, Icon } from "react-native-elements";
import normalize from "react-native-normalize";
import {
  estadoProceso,
  loginUsuarioAsync,
  obtenerUsuarioAsync,
} from "../../redux/reducers/usuariosReducer";
import { useDispatch, useSelector } from "react-redux";
import { initialLogin, setLogin } from "../../redux/reducers/loginReducer";

function Login() {
  const dispatch = useDispatch();

  const navigation = useNavigation();

  const estado = useSelector(estadoProceso);

  const login = useSelector(initialLogin);

  const [contrasena, setContrasena] = useState(true);

  const toastRef = useRef();

  const DeviceScreen = Dimensions.get("screen");

  const toast = DeviceScreen.height < 700 ? normalize(80) : normalize(80);

  const formik = useFormik({
    initialValues: {
      correo: "",
      password: "",
    },
    validationSchema: Yup.object({
      correo: Yup.string()
        .required("El correo electrónico es obligatorio")
        .email("La direccion de correo es invalida"),
      password: Yup.string().required("La contraseña es obligatoria"),
    }),
  });

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        if (login.token) {
          navigation.navigate("home");
        }
      }
    };

    AppState.addEventListener("change", handleAppStateChange);
    SplashScreen.hide();

    return () => {
      AppState.removeEventListener("change", handleAppStateChange);
    };
  }, [login]);

  const permiso = (data) => {
    const { estado, rol } = data;
    if (estado && (rol === 2 || rol === 5)) return true;
    return false;
  };

  //Metodo submit para el formulario del formik
  const handleSubmit = async () => {
    try {
      const result = await dispatch(loginUsuarioAsync(formik.values)).unwrap();
      if (result) {
        const domiciliario = await dispatch(
          obtenerUsuarioAsync(result.localId)
        ).unwrap();
        if (permiso(domiciliario)) {
          dispatch(
            setLogin({
              id: result.localId,
              token: result.idToken,
              rol: domiciliario.rol,
              sede: domiciliario.sede,
            })
          );
          navigation.navigate("home");
        } else {
          toastRef.current.show(
            "El usuario no tiene permisos para esta opción",
            5000
          );
        }
      }
    } catch (error) {
      toastRef.current.show("Usuario y/o contraseña incorrectos", 5000);
    }
    limpiarDatos();
  };

  const limpiarDatos = () => {
    setTimeout(() => {
      formik.setErrors({});
      formik.setTouched({}, false);
      formik.setValues(formik.initialValues);
    }, 500);
  };

  const mostrarContrasena = () => {
    setContrasena(!contrasena);
  };

  return (
    <>
      <StatusBar hidden={true} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.containerLogo}>
            <Image
              PlaceholderContent={
                <ActivityIndicator color={Colors.primaryButton} />
              }
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.domiciliario}>DOMICILIARIOS</Text>
          </View>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.correo && formik.touched.correo}
              theme={{
                colors: {
                  primary: Colors.text,
                },
              }}
              id="correo"
              label="Correo electronico"
              value={formik.values.correo}
              onChangeText={formik.handleChange("correo")}
              onBlur={formik.handleBlur("correo")}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      iconStyle={{ marginRight: normalize(10) }}
                      size={normalize(30)}
                      name="envelope"
                      type="evilicon"
                    />
                  )}
                />
              }
            />
            {formik.errors.correo && formik.touched.correo && (
              <Text style={styles.error}>{formik.errors.correo}</Text>
            )}
          </View>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.password && formik.touched.password}
              theme={{
                colors: {
                  primary: Colors.text,
                },
              }}
              secureTextEntry={contrasena}
              id="password"
              label="Contraseña"
              value={formik.values.password}
              onChangeText={formik.handleChange("password")}
              onBlur={formik.handleBlur("password")}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      iconStyle={{ marginRight: normalize(10) }}
                      size={normalize(33)}
                      name={contrasena ? "lock" : "unlock"}
                      type="evilicon"
                      onPress={mostrarContrasena}
                    />
                  )}
                />
              }
            />
            {formik.errors.password && formik.touched.password && (
              <Text style={styles.error}>{formik.errors.password}</Text>
            )}
          </View>
          {estado.isLoading ? (
            <View
              style={{
                justifyContent: "center",
                marginVertical: normalize(20, "height"),
              }}
            >
              <ActivityIndicator
                size="small"
                animating={true}
                color={Colors.button}
              />
            </View>
          ) : (
            <TouchableNativeFeedback onPress={handleSubmit}>
              <Button
                style={styles.button}
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}
                mode="contained"
              >
                Login
              </Button>
            </TouchableNativeFeedback>
          )}
          <Toast
            ref={toastRef}
            style={styles.toast}
            positionValue={normalize(toast, "height")}
          />
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(30, "height"),
    backgroundColor: Colors.primary,
  },
  containerLogo: {
    alignItems: "center",
    marginVertical: normalize(50, "height"),
  },
  logo: {
    width: normalize(150),
    height: normalize(150, "height"),
  },
  input: {
    marginBottom: normalize(15, "height"),
  },
  button: {
    paddingVertical: normalize(5, "height"),
    marginVertical: normalize(20, "height"),
  },
  error: {
    backgroundColor: Colors.error,
    padding: normalize(3),
    color: "white",
    textAlign: "center",
  },
  toast: {
    backgroundColor: Colors.error,
  },
  domiciliario: {
    color: "white",
    fontWeight: "bold",
    marginTop: normalize(10, "height"),
  },
});

export default Login;
