import React, {useContext, useState, useEffect, useRef} from 'react';
import {FirebaseContext} from '../../firebase';
import {useCanasta, useDispatch} from '../Context/canastaProvider';
import {useNotify, useDispatchNotify} from '../Context/notifyProvider';
import {useNavigation} from '@react-navigation/native';
import {useFormik} from 'formik';
import Toast, {DURATION} from 'react-native-easy-toast';
import * as Yup from 'yup';
import {
  View,
  Dimensions,
  StyleSheet,
  FlatList,
  BackHandler,
  Text,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import {List, Avatar, Button, TextInput} from 'react-native-paper';
import {Icon} from 'react-native-elements';
import {capitalize, formatoPrecio} from '../../utils';
import normalize from 'react-native-normalize';
import Colors from '../../theme/colors';
import {types} from '../Context/canastaReducer';
import SplashScreen from 'react-native-splash-screen';
import {checkVersion} from 'react-native-check-version';
import moment from 'moment';
import 'moment/locale/es';

function Canasta({route}) {
  const {firebase} = useContext(FirebaseContext);

  const navigation = useNavigation();

  const dispatch = useDispatch();

  const dispatchNotify = useDispatchNotify();

  const canasta = useCanasta();

  const notify = useNotify();

  const toastRef = useRef();

  const toastRefConexion = useRef();

  const [date] = useState(new Date());

  const [cliente, setCliente] = useState([]);

  const [pedidos, setPedidos] = useState([]);

  const [barrios, setBarrios] = useState([]);

  const [modal, setModal] = useState(false);

  const [modalObs, setModalObs] = useState(false);

  const [direccionPedido, setDireccion] = useState();

  const [medioPago, setMedioPago] = useState('efectivo');

  const [expanded, setExpanded] = useState(false);

  const [expandedMedioPago, setExpandedMedioPago] = useState(false);

  const [ipoc, setIpoc] = useState(0);

  const [total, setTotal] = useState(0);

  const formik = useFormik({
    initialValues: {
      observaciones: '',
    },
    validationSchema: Yup.object({
      observaciones: Yup.string(),
    }),
  });

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

  //Metodo para evitar que se cierre la app si tiene productos en la canasta
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
    //Cierra el splash para mostrar la pantalla inicial
    SplashScreen.hide();

    validarVersion();
    BackHandler.addEventListener('hardwareBackPress', backAction);

    return () =>
      BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, []);

  useEffect(() => {
    //Calcula al total e ipo consumo del pedido
    const calcularValores = () => {
      let suma = canasta.reduce(
        (sum, value) =>
          typeof value.precio == 'number'
            ? sum + value.precio * value.cantidad
            : sum,
        direccionPedido ? direccionPedido.barrio.valor : 0,
      );
      let ipoconsumo = canasta.reduce(
        (sum, value) =>
          value.categoria.nombre === 'Fritos' ||
          value.categoria.nombre === 'Gaseosas'
            ? sum + value.precio * value.cantidad * 0.08
            : sum,
        0,
      );
      setTotal(suma);
      setIpoc(ipoconsumo);
    };

    //Metodo para mostrar modal de direcciones
    const MostrarDirecciones = () => {
      if (canasta.length > 0 && !direccionPedido) {
        setModal(true);
      }

      if (canasta.length == 0) {
        setDireccion();
      }
    };

    calcularValores();
    MostrarDirecciones();
  });

  useEffect(() => {
    //Metodo para obtener los barrios del municipio de la direccion 4
    const obtenerBarrios = async () => {
      firebase.db
        .collection('barrios')
        .orderBy('nombre', 'asc')
        .onSnapshot(manejarSnapshotBarrio);
    };

    obtenerBarrios();
  }, []);

  function manejarSnapshotBarrio(values) {
    const barrios = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setBarrios(barrios);
  }

  useEffect(() => {
    const {id} = route.params;

    const obtenerCliente = () => {
      firebase.db
        .collection('clientes')
        .where('telefono', '==', id)
        .limit(1)
        .onSnapshot(manejarSnapshotCliente);
    };

    //Se consulta el cliente en BD
    obtenerCliente();
  }, []);

  useEffect(() => {
    const obtenerPedidosCliente = () => {
      const startOfToday = moment(date).startOf('day').toDate();
      const endOfToday = moment(date).endOf('day').toDate();
      firebase.db
        .collection('pedidos')
        .where('fecha', '>=', startOfToday)
        .where('fecha', '<=', endOfToday)
        .where('cliente.id', '==', cliente.id)
        .onSnapshot(manejarSnapshotPedidosCliente);
    };

    //Se consulta los pedidos del cliente en BD del dia actual
    if (cliente.id) {
      obtenerPedidosCliente();
    }
  }, [cliente]);

  const validarVersion = async () => {
    const version = await checkVersion();

    const actualizarApp = () => {
      let link = version.url;
      Linking.openURL(link)
        .then((supported) => {
          if (!supported) {
            Alert.alert(
              'Instala la aplicación para brindarte una mejor experiencia',
            );
          } else {
            return Linking.openURL(link);
          }
        })
        .catch((err) => console.error(err));
    };

    if (version.needsUpdate) {
      Alert.alert(
        'Actualización',
        `Es necesario actualizar la aplicación en su última versión ${version.version}`,
        [
          {
            text: 'Ir',
            onPress: () => actualizarApp(),
          },
        ],
      );
      return false;
    }
    return true;
  };

  function manejarSnapshotCliente(values) {
    const datos = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    setCliente(datos[0]);
  }

  function manejarSnapshotPedidosCliente(values) {
    const datos = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    setPedidos(datos);

    //Se calcula el bagde de las notificaciones
    let cambios = 0;
    datos.map((data) => {
      let f = notify.notificaciones.find(
        (e) => data.id === e.id && data.estado === e.estado,
      );
      if (!f) {
        dispatchNotify({type: types.add, data: {...data}});
        cambios++;
      }
    });
    dispatchNotify({type: types.plus, data: cambios});
  }

  //Metodo para cancelar pedido automaticamente
  const cancelarPedido = (value) => {
    const {id, medioPago, total} = value;
    try {
      firebase.db
        .collection('pedidos')
        .doc(id)
        .update({
          estado: 'Cancelado',
          total: 0,
          ipoconsumo: 0,
          comentario: 'El restaurante no recibió su pedido',
          movimiento: firebase.time,
        })
        .then(() => {
          if (medioPago === 'efectivo') {
            try {
              firebase.db
                .collection('deudas')
                .where('pedido', '==', id)
                .get()
                .then((querySnapshot) => {
                  querySnapshot.forEach((doc) => {
                    firebase.db
                      .collection('deudas')
                      .doc(doc.id)
                      .update({abono: total, estado: 'Cancelado'})
                      .then(() => {});
                  });
                });
            } catch (error) {
              toastRef.current.show(
                'Ha ocurrido un error, intetelo nuevamente',
                5000,
              );
              firebase.db.collection('logs').add({
                accion: 'Cancelar Deuda Automatica App',
                fecha: firebase.time,
                error: error.message,
                datos: {id, abono: total},
              });
            }
          }
        });
    } catch (error) {
      toastRef.current.show('Ha ocurrido un error, intetelo nuevamente', 5000);
      firebase.db.collection('logs').add({
        accion: 'Cancelar Pedido Automatico App',
        fecha: firebase.time,
        error: error.message,
        datos: {value},
      });
    }
  };

  //Metodo para cargar los productos de la canasta
  const cargarProductos = ({item, index}) => {
    let {nombre, imagen, precio, cantidad} = item;
    let totalP = precio * cantidad;
    return (
      <List.Item
        key={`Pedido_${index}`}
        title={`${nombre.toUpperCase()} X ${cantidad}`}
        titleStyle={{fontSize: normalize(18)}}
        description={`Total ${formatoPrecio(totalP)}`}
        descriptionStyle={{fontSize: normalize(16)}}
        left={() => (
          <View style={styles.imagen}>
            <Avatar.Image size={40} source={{uri: imagen}} />
          </View>
        )}
        right={() => (
          <View style={styles.cantidad}>
            <Icon
              raised
              size={normalize(25)}
              name="plus"
              type="evilicon"
              onPress={() => {
                canasta[index].cantidad++;
                dispatch({type: types.plus, data: item});
              }}
            />
            {cantidad === 1 ? (
              <Icon
                reverse
                size={normalize(25)}
                color={Colors.error}
                name="trash"
                type="evilicon"
                onPress={() => {
                  dispatch({type: types.delete, data: index});
                }}
              />
            ) : (
              <Icon
                raised
                size={normalize(25)}
                color={Colors.error}
                name="minus"
                type="evilicon"
                onPress={() => {
                  canasta[index].cantidad--;
                  dispatch({type: types.minus, data: item});
                }}
              />
            )}
          </View>
        )}
      />
    );
  };

  //Metodo para cargara el valor del domicilio
  const domicilio = () => {
    if (direccionPedido) {
      return (
        <TouchableNativeFeedback onPress={() => setModal(true)}>
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: normalize(15),
              paddingVertical: normalize(10),
            }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                flexGrow: 1,
                alignItems: 'center',
              }}>
              <Icon
                size={normalize(30)}
                name="location"
                type="evilicon"
                color={Colors.primary}
              />
              {direccionPedido.direccion !== '' ? (
                <Text style={styles.direccion}>{`${capitalize(
                  direccionPedido.direccion,
                )} ${direccionPedido.barrio.nombre}`}</Text>
              ) : (
                <Text style={styles.direccionError}>
                  Seleccione una Dirección
                </Text>
              )}
            </View>
            <View
              style={{
                flex: 1,
                flexDirection: 'row-reverse',
                flexGrow: 1,
                alignItems: 'center',
              }}>
              <Text style={styles.direccion}>{`Domicilio ${formatoPrecio(
                direccionPedido.barrio.valor,
              )}`}</Text>
            </View>
          </View>
        </TouchableNativeFeedback>
      );
    }
  };

  //Metodo para cargar los medios de pago
  const MedioPago = () => {
    if (direccionPedido) {
      return (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: normalize(15),
            paddingBottom: normalize(10),
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Icon
              size={normalize(30)}
              name="credit-card"
              type="evilicon"
              color={Colors.primary}
            />
            <Text style={styles.direccion}>Medio de Pago:</Text>
          </View>
          <View style={{width: normalize(140)}}>
            <List.Accordion
              title={capitalize(medioPago)}
              style={{padding: 0}}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              right={() => (
                <Icon
                  size={normalize(30)}
                  color={Colors.primary}
                  name={expandedMedioPago ? 'chevron-up' : 'chevron-down'}
                  type="evilicon"
                />
              )}
              expanded={expandedMedioPago}
              onPress={() => setExpandedMedioPago(!expandedMedioPago)}>
              <List.Item
                title="Efectivo"
                onPress={() => {
                  setMedioPago('efectivo');
                  setExpandedMedioPago(!expandedMedioPago);
                }}
              />
              <List.Item
                title="Transferencia"
                onPress={() => {
                  setMedioPago('transferencia');
                  setExpandedMedioPago(!expandedMedioPago);
                }}
              />
            </List.Accordion>
          </View>
        </View>
      );
    }
  };

  //Metodo para cargar las observaciones del pedido
  const observacion = () => {
    const {observaciones} = formik.values;
    if (direccionPedido) {
      return (
        <TouchableNativeFeedback onPress={() => setModalObs(true)}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: normalize(15),
              paddingVertical: normalize(10),
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon
                size={normalize(30)}
                name="pencil"
                type="evilicon"
                color={Colors.primary}
              />
              <Text style={styles.direccion}>Observaciones:</Text>
            </View>
            {observaciones ? (
              <Text style={styles.observacion}>{observaciones}</Text>
            ) : (
              <Text style={styles.observacion}>Agregar Observaciones</Text>
            )}
          </View>
        </TouchableNativeFeedback>
      );
    }
  };

  //Metodo para redireccionar a whatsapp para medios de pago transferencia
  function renderWhatsapp(values) {
    const {cliente, total} = values;
    let text = `Hola. Acabo de realizar un pedido por un valor: *${formatoPrecio(
      total,
    )}* a nombre de *${cliente.nombre.trim()}* y pagaré por transferencia`;
    let phoneNumber = '+573157242140';
    let link = `https://wa.me/${phoneNumber}?text=${text}`;
    Linking.openURL(link)
      .then((supported) => {
        if (!supported) {
          Alert.alert(
            'Instala la aplicación para brindarte una mejor experiencia',
          );
        } else {
          return Linking.openURL(link);
        }
      })
      .catch((err) => console.error(err));
  }

  const confirmarPedido = async () => {
    if (await validarVersion()) {
      if (direccionPedido && direccionPedido.direccion !== '') {
        const {id} = route.params;
        let values = {};
        const {observaciones} = formik.values;
        values.medioPago = medioPago;
        values.fecha = firebase.time;
        values.total = parseInt(total);
        values.ipoconsumo = ipoc;
        values.usuario = 'App Móvil';
        values.sede = 3;
        values.cliente = {...direccionPedido};
        values.productos = canasta;
        values.estado = 'Pendiente aprobar';
        values.observaciones = observaciones;
        try {
          firebase.db
            .collection('pedidos')
            .add(values)
            .then((docRef) => {
              const datos = {
                pedido: docRef.id,
                total: values.total,
                domicilio: values.cliente.barrio.valor,
                domiciliario: null,
                abono: 0,
                fecha: firebase.time,
                medioPago: values.medioPago,
                estado: values.estado,
              };
              try {
                firebase.db.collection('deudas').add({...datos});
                toastRefConexion.current.show(
                  'Pedido Realizado con Exito',
                  1000,
                  () => {
                    navigation.navigate('notificacion', {
                      id,
                    });
                  },
                );
                if (values.medioPago == 'transferencia') {
                  Alert.alert(
                    'Pago Transferencia',
                    'Se redireccionará a Whatsapp para enviar el comprobante de Pago',
                    [
                      {
                        text: 'Cerrar',
                        onPress: () => null,
                        style: 'cancel',
                      },
                      {text: 'Ir', onPress: () => renderWhatsapp(values)},
                    ],
                  );
                  return true;
                }
              } catch (error) {
                toastRef.current.show('Error, intetelo nuevamente', 5000);
                firebase.db.collection('logs').add({...datos});
              }
            });
        } catch (error) {
          firebase.db.collection('logs').add({
            accion: 'Crear Pedido App',
            fecha: firebase.time,
            error: error.message,
            datos: {...values},
          });
          toastRef.current.show('Error, intetelo nuevamente', 5000);
        }
        dispatch({type: types.clear});
        limpiarDatos();
      } else {
        toastRef.current.show(
          'Error, debe seleccionar una dirección de entrega',
          5000,
        );
      }
    }
  };

  const limpiarDatos = () => {
    formik.setValues(formik.initialValues);
    formik.setTouched(formik.initialTouched);
    formik.setErrors(formik.initialErrors);
    setMedioPago('efectivo');
  };

  //Metodo para calcular el total del pedido
  const valorTotal = () => {
    return (
      <View>
        <View style={styles.total}>
          <Text style={styles.textCantidad}>{`PAGO TOTAL ${formatoPrecio(
            total,
          )}`}</Text>
        </View>
        <TouchableNativeFeedback onPress={confirmarPedido}>
          <Button
            style={styles.button}
            theme={{
              colors: {
                primary: Colors.button,
              },
            }}
            mode="contained">
            CONFIRMAR PEDIDO
          </Button>
        </TouchableNativeFeedback>
      </View>
    );
  };

  //Metodo para cargar las direcciones del cliente
  const cargarDireccion = (index) => {
    const {id, nombre, telefono, telefono2} = cliente;
    switch (index) {
      case 1:
        setDireccion({
          direccion: cliente.direccion,
          barrio: barrios.find((x) => x.id === cliente.barrio?.id),
          puntoRef: cliente.puntoRef,
          id,
          nombre,
          telefono: parseInt(telefono),
          telefono2: telefono2 ? parseInt(telefono2) : null,
        });
        break;
      case 2:
        setDireccion({
          direccion: cliente.direccion2,
          barrio: barrios.find((x) => x.id === cliente.barrio2?.id),
          puntoRef: cliente.puntoRef2,
          id,
          nombre,
          telefono: parseInt(telefono),
          telefono2: telefono2 ? parseInt(telefono2) : null,
        });
        break;
      case 3:
        setDireccion({
          direccion: cliente.direccion3,
          barrio: barrios.find((x) => x.id === cliente.barrio3?.id),
          puntoRef: cliente.puntoRef3,
          id,
          nombre,
          telefono: parseInt(telefono),
          telefono2: telefono2 ? parseInt(telefono2) : null,
        });
        break;
      case 4:
        setDireccion({
          direccion: cliente.direccion4,
          barrio: barrios.find((x) => x.id === cliente.barrio4?.id),
          puntoRef: cliente.puntoRef4,
          id,
          nombre,
          telefono: parseInt(telefono),
          telefono2: telefono2 ? parseInt(telefono2) : null,
        });
        break;
      default:
        setDireccion({
          direccion: '',
          barrio: {
            nombre: '',
            valor: 0,
          },
          puntoRef: '',
          id,
          nombre,
          telefono: null,
          telefono2: null,
        });
        break;
    }
    setModal(false);
    setExpanded(false);
  };

  //Metodo para pintar las direcciones del Modal
  const listaDirecciones = () => {
    const {
      direccion,
      direccion2,
      direccion3,
      direccion4,
      barrio,
      barrio2,
      barrio3,
      barrio4,
    } = cliente;
    return (
      <List.Accordion
        title="Direcciones"
        theme={{
          colors: {
            primary: Colors.primary,
          },
        }}
        left={() => (
          <Icon
            size={normalize(40)}
            name="location"
            type="evilicon"
            color={expanded && Colors.primary}
          />
        )}
        right={() => (
          <Icon
            size={normalize(40)}
            color={Colors.primary}
            name={expanded ? 'chevron-up' : 'chevron-down'}
            type="evilicon"
          />
        )}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}>
        {direccion !== '' && direccion && (
          <List.Item
            title={`${capitalize(direccion)} ${barrio && barrio.nombre}`}
            titleStyle={{fontSize: normalize(16)}}
            left={() => (
              <View
                style={{
                  justifyContent: 'center',
                  marginHorizontal: normalize(10),
                }}>
                <Icon
                  size={normalize(30)}
                  name="chevron-right"
                  type="evilicon"
                />
              </View>
            )}
            onPress={() => cargarDireccion(1)}
          />
        )}
        {direccion2 !== '' && direccion2 && (
          <List.Item
            title={`${capitalize(direccion2)} ${barrio2 && barrio2.nombre}`}
            titleStyle={{fontSize: normalize(16)}}
            left={() => (
              <View
                style={{
                  justifyContent: 'center',
                  marginHorizontal: normalize(10),
                }}>
                <Icon
                  size={normalize(30)}
                  name="chevron-right"
                  type="evilicon"
                />
              </View>
            )}
            onPress={() => cargarDireccion(2)}
          />
        )}
        {direccion3 !== '' && direccion3 && (
          <List.Item
            title={`${capitalize(direccion3)} ${barrio3 && barrio3.nombre}`}
            titleStyle={{fontSize: normalize(16)}}
            left={() => (
              <View
                style={{
                  justifyContent: 'center',
                  marginHorizontal: normalize(10),
                }}>
                <Icon
                  size={normalize(30)}
                  name="chevron-right"
                  type="evilicon"
                />
              </View>
            )}
            onPress={() => cargarDireccion(3)}
          />
        )}
        {direccion4 !== '' && direccion4 && (
          <List.Item
            title={`${capitalize(direccion4)} ${barrio4 && barrio4.nombre}`}
            titleStyle={{fontSize: normalize(16)}}
            left={() => (
              <View
                style={{
                  justifyContent: 'center',
                  marginHorizontal: normalize(10),
                }}>
                <Icon
                  size={normalize(30)}
                  name="chevron-right"
                  type="evilicon"
                />
              </View>
            )}
            onPress={() => cargarDireccion(4)}
          />
        )}
      </List.Accordion>
    );
  };

  return (
    <View style={{flex: 1, backgroundColor: Colors.accent}}>
      <Text style={styles.title}>TU PEDIDO</Text>
      <View style={styles.container}>
        <FlatList
          data={canasta}
          renderItem={cargarProductos}
          keyExtractor={(item) => item.id}
        />
        {domicilio()}
        {observacion()}
        {MedioPago()}
        {valorTotal()}
      </View>
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
      <Modal
        animationType="slide"
        visible={modal}
        transparent={true}
        onRequestClose={() => {
          setModal(false);
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            setModal(false);
          }}
          accessible={false}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <Text
                style={{
                  fontSize: normalize(18),
                  marginBottom: normalize(20, 'height'),
                  paddingHorizontal: normalize(20),
                }}>
                Seleccioné una dirección de entrega para continuar
              </Text>
              {listaDirecciones()}
              <View
                style={{
                  alignItems: 'flex-start',
                  marginTop: normalize(20),
                }}>
                <TouchableNativeFeedback
                  onPress={() => {
                    cargarDireccion();
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
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        animationType="slide"
        visible={modalObs}
        transparent={true}
        onRequestClose={() => {
          setModalObs(false);
        }}>
        <TouchableWithoutFeedback
          onPress={() => {
            setModalObs(false);
          }}
          accessible={false}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <View style={styles.input}>
                <TextInput
                  error={
                    formik.errors.observaciones && formik.touched.observaciones
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary,
                    },
                  }}
                  id="observaciones"
                  label="Observaciones"
                  value={formik.values.observaciones}
                  onChangeText={formik.handleChange('observaciones')}
                  onBlur={formik.handleBlur('observaciones')}
                />
                {formik.errors.observaciones &&
                  formik.touched.observaciones && (
                    <Text style={styles.error}>
                      {formik.errors.observaciones}
                    </Text>
                  )}
              </View>
              <TouchableNativeFeedback onPress={() => setModalObs(false)}>
                <Button
                  theme={{
                    colors: {
                      primary: Colors.button,
                    },
                  }}
                  mode="contained">
                  Guardar
                </Button>
              </TouchableNativeFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  title: {
    textAlign: 'center',
    paddingVertical: normalize(15, 'height'),
    fontSize: normalize(25),
    fontWeight: 'bold',
    color: Colors.primary,
    textShadowColor: Colors.primary,
    textShadowRadius: 10,
  },
  button: {
    paddingVertical: normalize(5, 'height'),
    marginBottom: normalize(10, 'height'),
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255, 1)',
    borderTopLeftRadius: normalize(40),
    borderTopRightRadius: normalize(40),
    width: '99%',
    marginHorizontal: 2,
  },
  textCantidad: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    marginVertical: normalize(10),
    textAlign: 'center',
    color: Colors.primary,
  },
  cantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: normalize(2, 'height'),
  },
  containerModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(218,218,218, 0.9)',
  },
  modal: {
    backgroundColor: 'rgba(255,255,255, 1)',
    marginHorizontal: normalize(10),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(30, 'height'),
  },
  opcional: {
    textDecorationLine: 'underline',
    fontSize: normalize(18),
  },
  direccion: {
    fontSize: normalize(16),
  },
  direccionError: {
    fontSize: normalize(16),
    color: Colors.primary,
  },
  observacion: {
    fontSize: normalize(16),
    color: Colors.primary,
  },
  input: {
    marginBottom: normalize(30, 'height'),
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
});

export default Canasta;
