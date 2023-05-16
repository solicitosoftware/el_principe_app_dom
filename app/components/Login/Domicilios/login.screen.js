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
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
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

  const [ingreso, setIngreso] = useState(false);

  const navigation = useNavigation();

  const toastRef = useRef();

  const toastRefConexion = useRef();

  const DeviceScreen = Dimensions.get('screen');

  const toast = DeviceScreen.height < 700 ? normalize(80) : normalize(80);

  const toastConexion =
    DeviceScreen.height < 700 ? normalize(150) : normalize(150);

  const formik = useFormik({
    initialValues: {
      correo: '',
      password: '',
    },
    validationSchema: Yup.object({
      correo: Yup.string()
        .required('El correo electrónico es obligatorio')
        .email('La direccion de correo es invalida'),
      password: Yup.string().required('La contraseña es obligatoria'),
    }),
  });

  useEffect(() => {
    const validarLogin = async () => {
      if (await validarConexion()) {
        auth().onAuthStateChanged((result) => {
          if (result) {
            const id = result.uid;
            navigation.navigate('home', {
              params: {id},
            });
          }
        });
      } else {
        toastRef.current.show('Valide su conexión a internet', 5000);
      }
      SplashScreen.hide();
    };

    validarLogin();
  }, []);

  const validarConexion = async () => {
    var conexion = await NetInfo.fetch().then((state) => {
      debugger;
      if (!state.isConnected) {
        toastRef.current.show(
          `Estado de conexión ${state.type}: Sin Internet`,
          3000,
        );
      }
      return state.isConnected;
    });
    return conexion;
  };

  const handleSubmit = async () => {
    const {correo, password} = formik.values;
    if (correo && password) {
      if (await validarConexion()) {
        try {
          auth()
            .signInWithEmailAndPassword(correo, password)
            .then((result) => {
              console.log(result.user);
              ValidarUsuario(result.user.uid);
            })
            .catch((error) => {
              console.error(error);
              toastRef.current.show('Usuario y/o contraseña invalido', 5000);
              limpiarDatos();
            });
        } catch (error) {
          firebase.db.collection('logs').add({
            accion: 'Login Domiciliario App',
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
      !(formik.errors.correo || formik.errors.password) &&
        toastRef.current.show('Todos los campos son obligarios', 5000);
    }
  };

  const ValidarUsuario = async (id) => {
    await setIngreso(true);
    var docRef = firebase.db.collection('empleados').doc(id);
    docRef
      .get()
      .then((doc) => {
        const permiso =
          doc.exists &&
          (doc.data().rol === 2 || doc.data().rol === 5) &&
          doc.data().estado;
        if (permiso) {
          navigation.navigate('home', {
            params: {id},
          });
        } else {
          toastRef.current.show(
            'El usuario no tiene permisos para esta opción',
            5000,
            () => {
              auth().signOut();
            },
          );
        }
      })
      .catch((error) => {
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
      });
    limpiarDatos();
  };

  const mostrarContrasena = () => {
    setContrasena(!contrasena);
  };

  const limpiarDatos = async () => {
    formik.setValues(formik.initialValues);
    formik.setTouched(formik.initialTouched);
    formik.setErrors(formik.initialErrors);
    setIngreso(false);
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
              source={require('../../../assets/logo.png')}
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
              onChangeText={formik.handleChange('correo')}
              onBlur={formik.handleBlur('correo')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      iconStyle={{marginRight: normalize(10)}}
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
              onChangeText={formik.handleChange('password')}
              onBlur={formik.handleBlur('password')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      iconStyle={{marginRight: normalize(10)}}
                      size={normalize(33)}
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
            <TouchableNativeFeedback onPress={handleSubmit}>
              <Button
                style={styles.button}
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}
                mode="contained">
                Login
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
    marginVertical: normalize(20, 'height'),
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
});

export default Login;
