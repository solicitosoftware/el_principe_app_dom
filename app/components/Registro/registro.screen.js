import React, {useContext, useState, useRef, useEffect} from 'react';
import {FirebaseContext} from '../../firebase';
import {useNavigation} from '@react-navigation/native';
import Colors from '../../theme/colors';
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
import Toast, {DURATION} from 'react-native-easy-toast';
import {TextInput, Button, ActivityIndicator} from 'react-native-paper';
import {Image, Icon} from 'react-native-elements';
import normalize from 'react-native-normalize';
import NetInfo from '@react-native-community/netinfo';

function RegistroDatos({route}) {
  const {firebase} = useContext(FirebaseContext);

  const [ingreso, setIngreso] = useState(false);

  const [usuario, setUsuario] = useState({});

  const navigation = useNavigation();

  const toastRef = useRef();

  const toastRefConexion = useRef();

  const DeviceScreen = Dimensions.get('screen');

  const toast = DeviceScreen.height < 700 ? normalize(550) : normalize(550);

  const toastConexion =
    DeviceScreen.height < 700 ? normalize(550) : normalize(550);

  const formik = useFormik({
    initialValues: {
      nombre: '',
      telefono: '',
      password: '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string()
        .min(4, 'El nombre debe contener por lo menos 4 caracteres')
        .required('El nombre es obligatorio'),
    }),
  });

  useEffect(() => {
    const {user} = route.params;
    setUsuario(user);
  }, []);

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

  const handleSubmit = async () => {
    await setIngreso(true);
    const {nombre} = formik.values;
    if (nombre) {
      if (await validarConexion()) {
        actualizarDatos();
      } else {
        toastRef.current.show('Valide su conexión a internet', 5000);
      }
    } else {
      !formik.errors.nombre &&
        toastRef.current.show('Todos los campos son obligarios', 5000);
    }
  };

  //Metodo para actualizar los datos del cliente al finalizar el registro
  const actualizarDatos = () => {
    const {nombre} = formik.values;
    const {uid, phoneNumber} = usuario;
    const id = phoneNumber.slice(-10);
    const datos = {
      nombre,
      telefono: id,
    };
    firebase.db
      .collection('clientes')
      .doc(uid)
      .set(datos)
      .then(() => {
        navigation.navigate('tabs', {
          id,
        });
      })
      .catch((error) => {
        setIngreso(false);
        firebase.db.collection('logs').add({
          accion: 'Registrar Cliente App',
          fecha: firebase.time,
          error: error.message,
          datos: {...formik.values},
        });
        toastRef.current.show(
          'Ha ocurrido un error, intetelo nuevamente',
          5000,
        );
      });
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
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.nombre && formik.touched.nombre}
              theme={{
                colors: {
                  primary: Colors.text,
                },
              }}
              id="nombre"
              label="Nombre Completo"
              value={formik.values.nombre}
              onChangeText={formik.handleChange('nombre')}
              onBlur={formik.handleBlur('nombre')}
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
            {formik.errors.nombre && formik.touched.nombre && (
              <Text style={styles.error}>{formik.errors.nombre}</Text>
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
                Finalizar Registro
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
  opcional: {
    textDecorationLine: 'underline',
  },
});

export default RegistroDatos;
