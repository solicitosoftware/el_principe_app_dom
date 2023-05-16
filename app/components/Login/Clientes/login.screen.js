import React, {useContext, useState, useRef, useEffect} from 'react';
import {FirebaseContext} from '../../../firebase';
import {useNavigation} from '@react-navigation/native';
import Colors from '../../../theme/colors';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import Toast, {DURATION} from 'react-native-easy-toast';
import {TextInput, Button, ActivityIndicator} from 'react-native-paper';
import {Image, Icon} from 'react-native-elements';
import normalize from 'react-native-normalize';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';

function Login() {
  const {firebase} = useContext(FirebaseContext);

  const [contrasena, setContrasena] = useState(true);

  const [code, setCode] = useState(false);

  const [resend, setResend] = useState(false);

  const [ingreso, setIngreso] = useState(false);

  const navigation = useNavigation();

  const toastRef = useRef();

  const toastRefConexion = useRef();

  const DeviceScreen = Dimensions.get('screen');

  const posicion = (tamano) => {
    if (tamano < 700) {
      return normalize(80);
    } else if (tamano < 1500) {
      return normalize(150);
    } else {
      return normalize(220);
    }
  };

  const toast = posicion(DeviceScreen.height);

  const toastConexion = posicion(DeviceScreen.height);

  const formik = useFormik({
    initialValues: {
      telefono: '',
      password: '',
    },
    validationSchema: Yup.object({
      telefono: Yup.number()
        .positive()
        .min(10, 'El número celular debe contener 10 caracteres')
        .required('El número celular es obligatorio'),
      password: Yup.number()
        .positive()
        .min(6, 'El código debe contener minimo 6 caracteres')
        .required('El código es obligatorio'),
    }),
  });

  useEffect(async () => {
    const validarLogin = async () => {
      if (await validarConexion()) {
        auth().onAuthStateChanged((result) => {
          if (result) {
            ValidarUsuario(result);
          } else {
            SplashScreen.hide();
            setIngreso(false);
          }
        });
      } else {
        SplashScreen.hide();
        toastRef.current.show('Valide su conexión a internet', 5000);
      }
    };

    validarLogin();
  }, []);

  useEffect(() => {
    const validarEnvio = () => {
      if (resend) {
        toastRef.current.show(
          'Ha ocurrido un error al enviar el código, Intentelo nuevamente',
          5000,
          setResend(false),
        );
      }
    };
    setTimeout(() => {
      validarEnvio();
    }, 30000);
  }, [resend]);

  const validarConexion = async () => {
    var conexion = await NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        toastRefConexion.current.show(
          `Estado de conexión ${state.type}: Conectado`,
          1000,
        );
      } else {
        toastRef.current.show(
          `Estado de conexión ${state.type}: Sin Internet`,
          3000,
        );
      }
      return state.isConnected;
    });
    return conexion;
  };

  //Metodo submit que toma los datos del formulario de formik
  const handleSubmit = async () => {
    const {telefono, password} = formik.values;
    if (telefono && password) {
      if (await validarConexion()) {
        try {
          code
            .confirm(password)
            .then((result) => {
              ValidarUsuario(result.user);
            })
            .catch((error) => {
              toastRef.current.show('Código invalido', 5000);
              limpiarDatos();
            });
        } catch (error) {
          firebase.db.collection('logs').add({
            accion: 'Login Cliente App',
            fecha: firebase.time,
            error: error.message,
            datos: {...formik.values},
          });
          toastRef.current.show(
            'Ha ocurrido un error al tratar de autenticarse!!',
            5000,
          );
        }
      } else {
        toastRef.current.show('Valide su conexión a internet', 5000);
      }
    } else {
      !(
        (formik.errors.telefono && formik.touched.telefono) ||
        (formik.errors.password && formik.touched.password)
      ) && toastRef.current.show('Todos los campos son obligarios', 5000);
    }
  };

  //Metodo para validar si el usuario tiene los permisos para acceder a la app
  const ValidarUsuario = async (user) => {
    const id = user.phoneNumber.slice(-10);
    await setIngreso(true);
    try {
      const result = await firebase.db
        .collection('clientes')
        .where('telefono', '==', id)
        .limit(1)
        .get();
      const datos = result.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
      if (datos.length > 0) {
        toastRef.current.show('Bienvenido', 3000, () => {
          navigation.navigate('tabs', {
            id,
          });
        });
      } else {
        SplashScreen.hide();
        toastRef.current.show(
          'No tiene permisos para esta opción, el usuario debe registrarse',
          3000,
          () => {
            navigation.navigate('registroDatos', {user});
          },
        );
      }
      limpiarDatos();
    } catch (error) {
      firebase.db.collection('logs').add({
        accion: 'Validar Usuario App',
        fecha: firebase.time,
        error: error.message,
        datos: {id},
      });
      toastRef.current.show(
        'Ocurrio un error desconocido, ingrese sus datos nuevamente',
        5000,
        () => {
          auth().signOut();
        },
      );
      limpiarDatos();
    }
  };

  const mostrarContrasena = () => {
    setContrasena(!contrasena);
  };

  const reenviarCode = async () => {
    await setResend(true);
    handleCode();
  };

  const handleCode = async () => {
    const {telefono} = formik.values;
    if (telefono.length >= 10) {
      if (telefono) {
        toastRefConexion.current.show(`Enviando código de verificación`, 2000);
        let phoneNumber = '+57' + telefono;
        try {
          auth()
            .signInWithPhoneNumber(phoneNumber, true)
            .then((result) => {
              toastRefConexion.current.show(`Código Enviado`, 5000);
              setCode(result);
              setResend(false);
            })
            .catch((error) => {
              firebase.db.collection('logs').add({
                accion: 'Envio Código App Número invalido',
                fecha: firebase.time,
                error: error.message,
                datos: {phoneNumber},
              });
              toastRef.current.show(
                'Número bloqueado por multiples intentos, intentalo en un momento',
                5000,
              );
            });
        } catch (error) {
          firebase.db.collection('logs').add({
            accion: 'Envio Código App',
            fecha: firebase.time,
            error: error.message,
            datos: {phoneNumber},
          });
          toastRef.current.show(
            'Ha ocurrido un error al enviar el código!!',
            5000,
            setResend(false),
          );
        }
      } else {
        !(formik.errors.telefono && formik.touched.telefono);
        toastRef.current.show('Ingrese el número de celular', 5000);
      }
    } else {
      !(formik.errors.telefono && formik.touched.telefono);
      toastRef.current.show(
        'El número celular debe contener 10 caracteres',
        5000,
      );
    }
  };

  //Metodo para limpiar los campos y dejarlos en su estado inicial
  const limpiarDatos = async () => {
    setIngreso(false);
    setCode(false);
    setResend(false);
    formik.setValues(formik.initialValues);
    formik.setTouched(formik.initialTouched);
    formik.setErrors(formik.initialErrors);
  };

  return (
    <>
      <StatusBar hidden={true} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.containerLogo}>
            <Image
              PlaceholderContent={<ActivityIndicator color={Colors.primary} />}
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.domiciliario}>CLIENTES</Text>
          </View>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.telefono && formik.touched.telefono}
              theme={{
                colors: {
                  primary: Colors.text,
                },
              }}
              keyboardType="number-pad"
              id="telefono"
              label="Celular"
              value={formik.values.telefono}
              onChangeText={formik.handleChange('telefono')}
              onBlur={formik.handleBlur('telefono')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      raised
                      size={normalize(30)}
                      name="user"
                      type="evilicon"
                    />
                  )}
                />
              }
            />
            {formik.errors.telefono && formik.touched.telefono && (
              <Text style={styles.error}>{formik.errors.telefono}</Text>
            )}
          </View>
          {code && (
            <View style={styles.input}>
              <TextInput
                error={formik.errors.password && formik.touched.password}
                theme={{
                  colors: {
                    primary: Colors.text,
                  },
                }}
                secureTextEntry={contrasena}
                keyboardType="number-pad"
                id="password"
                label="Código enviado"
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
                right={
                  <TextInput.Icon
                    name={() => (
                      <Icon
                        raised
                        size={normalize(30)}
                        name={contrasena ? 'lock' : 'unlock'}
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
          )}
          {ingreso ? (
            <View
              style={{
                justifyContent: 'center',
                marginVertical: normalize(20, 'height'),
              }}>
              <ActivityIndicator
                size="small"
                animating={true}
                color={Colors.button}
              />
            </View>
          ) : (
            <TouchableNativeFeedback onPress={code ? handleSubmit : handleCode}>
              <Button
                style={styles.button}
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}
                mode="contained">
                {code ? 'Ingresar' : 'Generar Código'}
              </Button>
            </TouchableNativeFeedback>
          )}
          <Toast
            ref={toastRef}
            style={styles.toast}
            positionValue={normalize(toast, 'height')}
          />
          <Toast
            ref={toastRefConexion}
            style={styles.toastConexion}
            positionValue={normalize(toastConexion, 'height')}
          />
          {code && (
            <Button
              uppercase={false}
              loading={resend}
              labelStyle={styles.opcional}
              style={{marginBottom: normalize(15, 'height')}}
              onPress={reenviarCode}
              theme={{
                colors: {
                  primary: 'white',
                },
              }}
              mode="text">
              {resend ? 'Enviando' : 'Reenviar Código'}
            </Button>
          )}
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(30, 'height'),
    backgroundColor: Colors.primary,
  },
  containerLogo: {
    alignItems: 'center',
    marginVertical: normalize(50, 'height'),
  },
  logo: {
    width: normalize(150),
    height: normalize(150, 'height'),
  },
  input: {
    marginBottom: normalize(15, 'height'),
  },
  button: {
    paddingVertical: normalize(5, 'height'),
    marginVertical: normalize(15, 'height'),
  },
  error: {
    backgroundColor: Colors.error,
    padding: normalize(3),
    color: 'white',
    textAlign: 'center',
  },
  toast: {
    backgroundColor: Colors.error,
  },
  toastConexion: {
    backgroundColor: Colors.success,
  },
  domiciliario: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: normalize(10, 'height'),
  },
  opcional: {
    textDecorationLine: 'underline',
  },
});

export default Login;
