import React, {useContext, useState, useRef, useEffect} from 'react';
import {FirebaseContext} from '../../../firebase';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import Toast, {DURATION} from 'react-native-easy-toast';
import {useNavigation} from '@react-navigation/native';
import {TextInput, List, Button, ActivityIndicator} from 'react-native-paper';
import {Icon, Avatar} from 'react-native-elements';
import {capitalize} from '../../../utils';
import normalize from 'react-native-normalize';
import Colors from '../../../theme/colors';
import {launchImageLibrary} from 'react-native-image-picker';
import auth from '@react-native-firebase/auth';
import {useCanasta} from '../../Context/canastaProvider';

const DeviceScreen = Dimensions.get('screen');

function Home({route}) {
  const {firebase} = useContext(FirebaseContext);

  const navigation = useNavigation();

  const canasta = useCanasta();

  const toastRef = useRef();

  const toast = DeviceScreen.height < 700 ? normalize(210) : normalize(210);

  const [cliente, setCliente] = useState([]);

  const [path, setPath] = useState({});

  const [editar, setEditar] = useState(false);

  const [ingreso, setIngreso] = useState(false);

  const [verificationId, setVerificationId] = useState(null);

  const [modal, setModal] = useState(false);

  const backAction = () => {
    if (canasta.length > 0) {
      Alert.alert(
        'Canasta',
        'Al salir se borraran los productos, desea salir?',
        [
          {
            text: 'No',
            onPress: () => null,
            style: 'cancel',
          },
          {text: 'Si', onPress: () => BackHandler.exitApp()},
        ],
      );
      return true;
    }
  };

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', backAction);

    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, []);

  const formik = useFormik({
    initialValues: {
      nombre: '',
      telefono: '',
      telefono2: '',
      direccion: '',
      municipio: '',
      barrio: '',
      puntoRef: '',
    },
    validationSchema: Yup.object({
      nombre: Yup.string()
        .min(4, 'El nombre debe contener por lo menos 4 caracteres')
        .required('El nombre es obligatorio'),
      telefono: Yup.number()
        .positive()
        .min(10, 'El número debe contener 10 caracteres')
        .required('El número de teléfono es obligatorio'),
      telefono2: Yup.number()
        .positive()
        .min(10, 'El número debe contener 10 caracteres'),
      direccion: Yup.string().required('La dirección es obligatoria'),
      barrio: Yup.string().required('El barrio es obligatorio'),
      municipio: Yup.string().required('El municipio es obligatorio'),
      puntoRef: Yup.string(),
      code: Yup.number().required('El código es obligatorio'),
    }),
  });

  useEffect(() => {
    const {id} = route.params;

    const obtenerCliente = () => {
      firebase.db
        .collection('clientes')
        .where('telefono', '==', id)
        .limit(1)
        .onSnapshot(manejarSnapshotCliente);
    };

    obtenerCliente();
  }, []);

  useEffect(() => {
    const {nombre, telefono, telefono2} = cliente;

    const cargarCliente = () => {
      formik.setFieldValue('nombre', nombre, false);
      formik.setFieldValue('telefono', telefono, false);
      formik.setFieldValue('telefono2', telefono2, false);
    };

    cargarCliente();
  }, [cliente]);

  function manejarSnapshotCliente(values) {
    const datos = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    setCliente(datos[0]);
  }

  const limpiarDatos = async () => {
    setIngreso(false);
    setEditar(false);
    setModal(false);
  };

  const handleSubmit = async () => {
    const {telefono} = formik.values;
    if (telefono) {
      if (telefono != cliente.telefono) {
        await verificarPhone(telefono);
      } else {
        actualizarDatos(false);
      }
    } else {
      setIngreso(false);
    }
  };

  //Metodo para actualizar los datos del cliente
  const actualizarDatos = (valido) => {
    const {id} = cliente;
    const {nombre, telefono, telefono2} = formik.values;
    let nombreAct = nombre ? nombre : cliente ? cliente.nombre : '';
    let telefonoAct = valido ? telefono : cliente ? cliente.telefono : '';
    firebase.db
      .collection('clientes')
      .doc(id)
      .update({
        nombre: nombreAct,
        telefono: telefonoAct,
        telefono2: telefono2,
      })
      .then(() => {})
      .catch((error) => {
        firebase.db.collection('logs').add({
          accion: 'Editar Cliente App',
          fecha: firebase.time,
          error: error.message,
          datos: {...formik.values},
        });
        toastRef.current.show(
          'Ha ocurrido un error, intetelo nuevamente',
          5000,
        );
      });
    limpiarDatos();
  };

  //Metodo para actualizar telefono
  const actualizarPhone = () => {
    const {code} = formik.values;
    try {
      let credenciales = auth.PhoneAuthProvider.credential(
        verificationId,
        code,
      );
      auth()
        .currentUser.updatePhoneNumber(credenciales)
        .then(() => {
          actualizarDatos(true);
        });
    } catch (error) {
      toastRef.current.show('Código no valido', 5000);
      limpiarDatos();
    }
  };

  //Metoo para verificar el código enviado
  const verificarPhone = (telefono) => {
    if (telefono.charAt(0) == 3 && telefono.length == 10) {
      firebase.db
        .collection('clientes')
        .doc(telefono)
        .get()
        .then((doc) => {
          if (!doc.exists) {
            let phoneNumber = '+57' + telefono;
            setModal(true);
            auth()
              .verifyPhoneNumber(phoneNumber)
              .then((phoneAuthSnapshot) => {
                setVerificationId(phoneAuthSnapshot.verificationId);
              });
          } else {
            toastRef.current.show(
              'Ya existe un cliente con este número registrado',
              5000,
            );
            formik.setFieldValue('telefono', cliente.telefono, false);
            limpiarDatos();
          }
        });
    } else {
      toastRef.current.show('Ingrese un número de telefono valido', 5000);
      formik.setFieldValue('telefono', cliente.telefono, false);
      limpiarDatos();
    }
  };

  //Imagen de perfil del cliente
  const avatar = () => {
    const {url} = cliente;
    const {uri} = path;
    return (
      <View style={styles.containerLogo}>
        <Avatar
          size={DeviceScreen.height < 700 ? normalize(100) : normalize(130)}
          rounded
          imageProps={{
            resizeMode: url || uri ? 'cover' : 'contain',
          }}
          source={
            url || uri ? {uri: url || uri} : require('../../../assets/logo.png')
          }>
          <Avatar.Accessory
            size={DeviceScreen.height < 700 ? normalize(20) : normalize(30)}
            style={{backgroundColor: Colors.primary}}
            onPress={selectFile}
          />
        </Avatar>
      </View>
    );
  };

  //Metodo para cargar imagen de perfil
  const selectFile = async () => {
    var options = {
      title: 'Seleccione Imagen',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    const result = await launchImageLibrary(options);

    if (result.didCancel) {
      toastRef.current.show('El usuario ha cancelado la seleción', 3000);
    } else if (result.assets) {
      setPath(result.assets[0]);
      subirImagen(result.assets[0]);
    } else if (result.error) {
      firebase.db.collection('logs').add({
        accion: 'Image Avatar',
        fecha: firebase.time,
        error: result.error,
      });
      toastRef.current.show('Ha ocurrido un error, intentelo nuevamente', 3000);
    }
  };

  //Metodo para guardar imagen de perfil en Firebase
  const subirImagen = async (value) => {
    const {uri, fileName} = value;
    let name = fileName.slice(25);
    const ref = firebase.storage.ref('avatar').child(name);
    const blob = await fileBlob(uri);
    try {
      await ref.put(blob);
      const url = await firebase.storage.ref(`avatar/${name}`).getDownloadURL();
      const {id} = cliente;
      firebase.db.collection('clientes').doc(id).update({url});
    } catch (error) {
      console.error(error);
    }
  };

  //Metodo para generar los metadatos de la imagen
  const fileBlob = async (data) => {
    const file = await fetch(data);
    const blob = await file.blob();
    return blob;
  };

  //Metodo para cargar los datos del cliente
  const datosPersonales = () => {
    const {nombre, telefono, telefono2, direccion, puntoRef, barrio} = cliente;
    let barrioComp = barrio && `${barrio.municipio.nombre} - ${barrio.nombre}`;
    return (
      <View style={{flex: 1, justifyContent: 'center'}}>
        {avatar()}
        <List.Section>
          <List.Item
            title="Nombre"
            style={{paddingVertical: 0}}
            description={capitalize(nombre)}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name="user"
                  type="evilicon"
                />
              </View>
            )}
          />
          <List.Item
            title="Telefono"
            style={{paddingVertical: 0}}
            description={telefono}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon
                  size={normalize(30)}
                  color={Colors.primary}
                  name="phone"
                />
              </View>
            )}
          />
          <List.Item
            title="Telefono Secundario"
            style={{paddingVertical: 0}}
            description={telefono2}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon
                  size={normalize(30)}
                  color={Colors.primary}
                  name="phone"
                />
              </View>
            )}
          />
          <List.Item
            title="Dirección"
            style={{paddingVertical: 0}}
            description={capitalize(direccion)}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name="location"
                  type="evilicon"
                />
              </View>
            )}
          />
          <List.Item
            title="Barrio"
            style={{paddingVertical: 0}}
            description={capitalize(barrioComp)}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon size={normalize(33)} color={Colors.primary} name="home" />
              </View>
            )}
          />
          <List.Item
            title="Punto Referencia"
            style={{paddingVertical: 0}}
            description={capitalize(puntoRef)}
            titleStyle={{fontSize: normalize(15), fontWeight: 'bold'}}
            descriptionStyle={{fontSize: normalize(18)}}
            left={() => (
              <View
                style={{
                  width: normalize(40),
                  justifyContent: 'center',
                  marginHorizontal: normalize(20),
                }}>
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name="pointer"
                  type="evilicon"
                />
              </View>
            )}
          />
        </List.Section>
      </View>
    );
  };

  //Metodo para editar los datos del cliente
  const editarDatos = () => {
    return (
      <View style={{flex: 1}}>
        <View
          style={{
            marginVertical: normalize(20, 'height'),
            flexDirection: 'row-reverse',
          }}>
          <Icon
            reverse
            size={normalize(15)}
            name="close"
            color="red"
            onPress={() => limpiarDatos()}
          />
        </View>
        <View style={{justifyContent: 'center'}}>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.nombre && formik.touched.nombre}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              id="nombre"
              label="Nombre"
              value={formik.values.nombre}
              onChangeText={formik.handleChange('nombre')}
              onBlur={formik.handleBlur('nombre')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      raised
                      color={Colors.primary}
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
          <View style={styles.input}>
            <TextInput
              error={formik.errors.telefono && formik.touched.telefono}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              id="telefono"
              keyboardType="number-pad"
              label="Celular"
              value={formik.values.telefono}
              onChangeText={formik.handleChange('telefono')}
              onBlur={formik.handleBlur('telefono')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      raised
                      color={Colors.primary}
                      size={normalize(20)}
                      name="phone"
                    />
                  )}
                />
              }
            />
            {formik.errors.telefono && formik.touched.telefono && (
              <Text style={styles.error}>{formik.errors.telefono}</Text>
            )}
          </View>
          <View style={styles.input}>
            <TextInput
              error={formik.errors.telefono2 && formik.touched.telefono2}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              id="telefono2"
              keyboardType="number-pad"
              label="Telefono Secundario"
              value={formik.values.telefono2}
              onChangeText={formik.handleChange('telefono2')}
              onBlur={formik.handleBlur('telefono2')}
              right={
                <TextInput.Icon
                  name={() => (
                    <Icon
                      raised
                      color={Colors.primary}
                      size={normalize(20)}
                      name="phone"
                    />
                  )}
                />
              }
            />
            {formik.errors.telefono2 && formik.touched.telefono2 && (
              <Text style={styles.error}>{formik.errors.telefono2}</Text>
            )}
          </View>
          {editar && (
            <View
              style={{
                alignItems: 'flex-start',
              }}>
              <TouchableNativeFeedback
                onPress={() => {
                  navigation.navigate('direccion', {
                    cliente,
                  });
                }}>
                <Button
                  uppercase={false}
                  labelStyle={styles.opcional}
                  style={{marginBottom: normalize(15, 'height')}}
                  theme={{
                    colors: {
                      primary: Colors.primary,
                    },
                  }}
                  mode="text">
                  Editar Direcciones
                </Button>
              </TouchableNativeFeedback>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {editar ? editarDatos() : datosPersonales()}
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
          <TouchableNativeFeedback
            onPress={async () => {
              if (editar) {
                await setIngreso(true);
                handleSubmit();
              } else {
                setEditar(true);
              }
            }}>
            <Button
              style={styles.button}
              theme={{
                colors: {
                  primary: Colors.button,
                },
              }}
              mode="contained">
              {editar ? 'Actualizar Datos' : 'Editar Datos'}
            </Button>
          </TouchableNativeFeedback>
        )}
        <Toast
          ref={toastRef}
          style={styles.toast}
          positionValue={normalize(toast, 'height')}
        />
        <Modal
          animationType="slide"
          visible={modal}
          transparent={true}
          onRequestClose={() => {
            limpiarDatos();
          }}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <View style={styles.input}>
                <Text
                  style={{
                    fontSize: normalize(18),
                    marginBottom: normalize(15, 'height'),
                  }}>
                  Ingrese el código enviado a su celular
                </Text>
                <TextInput
                  error={formik.errors.code && formik.touched.code}
                  theme={{
                    colors: {
                      primary: Colors.primary,
                    },
                  }}
                  keyboardType="number-pad"
                  id="code"
                  label="Código"
                  value={formik.values.code}
                  onChangeText={formik.handleChange('code')}
                  onBlur={formik.handleBlur('code')}
                />
                {formik.errors.code && formik.touched.code && (
                  <Text style={styles.error}>{formik.errors.code}</Text>
                )}
              </View>
              <TouchableNativeFeedback onPress={actualizarPhone}>
                <Button
                  theme={{
                    colors: {
                      primary: Colors.button,
                    },
                  }}
                  mode="contained">
                  Validar
                </Button>
              </TouchableNativeFeedback>
            </View>
          </View>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(30),
  },
  containerLogo: {
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: DeviceScreen.height < 700 ? normalize(10) : normalize(30),
  },
  containerModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(218,218,218, 0.9)',
  },
  modal: {
    backgroundColor: 'rgba(255,255,255, 1)',
    marginHorizontal: normalize(10),
    paddingHorizontal: normalize(30),
    paddingVertical: normalize(50, 'height'),
  },
  input: {
    marginBottom: normalize(30, 'height'),
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
  opcional: {
    textDecorationLine: 'underline',
    fontSize: normalize(18),
  },
});

export default Home;
