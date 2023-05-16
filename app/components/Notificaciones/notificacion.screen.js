import React, {useContext, useEffect, useState, useRef} from 'react';
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import {useDispatchNotify} from '../Context/notifyProvider';
import {types} from '../Context/canastaReducer';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {Card, Button, Avatar, Divider, TextInput} from 'react-native-paper';
import Toast, {DURATION} from 'react-native-easy-toast';
import {FirebaseContext} from '../../firebase';
import normalize from 'react-native-normalize';
import Colors from '../../theme/colors';
import {capitalize, formatoPrecio} from '../../utils';
import moment from 'moment';
import 'moment/locale/es';

const DeviceScreen = Dimensions.get('screen');

function Notificacion({route}) {
  const {firebase} = useContext(FirebaseContext);

  const toastRef = useRef();

  const dispatchNotify = useDispatchNotify();

  const toast = DeviceScreen.height < 700 ? normalize(210) : normalize(210);

  const [notificaciones, setNotificaciones] = useState([]);

  const [cliente, setCliente] = useState([]);

  const [detalle, setDetalle] = useState([]);

  const [domicilio, setDomicilio] = useState(0);

  const [modal, setModal] = useState(false);

  const [modalDetalle, setModalDetalle] = useState(false);

  const [cancelar, setCancelar] = useState(null);

  const formik = useFormik({
    initialValues: {
      cancelacion: '',
    },
    validationSchema: Yup.object({
      cancelacion: Yup.string()
        .min(4, 'El motivo debe contener por lo menos 4 caracteres')
        .required('El motivo es obligatorio'),
    }),
    onSubmit: () => {
      const {id, medioPago, domiciliario, cliente} = cancelar;
      const {cancelacion} = formik.values;
      try {
        firebase.db
          .collection('pedidos')
          .doc(id)
          .update({
            estado: 'Cancelado',
            total: 0,
            deuda: false,
            ipoconsumo: 0,
            comentario: cancelacion,
            movimiento: firebase.time,
          })
          .then(() => {
            if (medioPago === 'efectivo') {
              if (domiciliario && domiciliario.rol === 5) {
                cancelar.total = cancelar.total - cliente.barrio.valor;
              }
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
                        .update({abono: cancelar.total, estado: 'Cancelado'})
                        .then(() => {});
                    });
                  });
              } catch (error) {
                toastRef.current.show(
                  'Ha ocurrido un error, intetelo nuevamente',
                  5000,
                );
                firebase.db.collection('logs').add({
                  accion: 'Cancelar Deuda App',
                  fecha: firebase.time,
                  error: error.message,
                  datos: {id, comentario: cancelacion, abono: cancelar.total},
                });
              }
            }
          });
      } catch (error) {
        toastRef.current.show(
          'Ha ocurrido un error, intetelo nuevamente',
          5000,
        );
        firebase.db.collection('logs').add({
          accion: 'Cancelar Pedido App',
          fecha: firebase.time,
          error: error.message,
          datos: {id, comentario: cancelacion},
        });
      }
      cerrarModal();
    },
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

    //Limpia el badge de notificaciones
    dispatchNotify({type: types.clear, data: 0});
    obtenerCliente();
  }, []);

  useEffect(() => {
    const obtenerPedidosCliente = () => {
      firebase.db
        .collection('pedidos')
        .where('cliente.id', '==', cliente.id)
        .orderBy('fecha', 'desc')
        .limit(50)
        .onSnapshot(manejarSnapshotPedidosCliente);
    };

    if (cliente.id) {
      obtenerPedidosCliente();
    }
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

  function manejarSnapshotPedidosCliente(values) {
    const datos = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });

    setNotificaciones(datos);
  }

  //Cierra el modal de cancelar pedido
  const cerrarModal = () => {
    setCancelar(null);
    setModal(false);
    formik.errors = {};
    formik.values.cancelacion = '';
  };

  const obtenerColor = (item) => {
    const {estado, entrega} = item;
    if (estado === 'Cancelado') {
      return styles.cancelado;
    } else if (estado.includes('Pendiente')) {
      return styles.pendiente;
    } else if (entrega && estado === 'Entregado') {
      return styles.entregado;
    } else if (estado === 'Impreso' || estado === 'Reimpreso') {
      return styles.impreso;
    } else {
      return styles.despachado;
    }
  };

  const obtenerLabel = (item) => {
    const {estado, entrega, espera} = item;
    if (estado === 'Cancelado') {
      return {id: 'C', nombre: 'Cancelado'};
    } else if (entrega && estado === 'Entregado') {
      return {id: 'E', nombre: 'Entregado'};
    } else if (espera && estado.includes('Pendiente')) {
      return {id: 'P', nombre: 'Aprobado'};
    } else if (estado.includes('Pendiente')) {
      return {id: 'P', nombre: 'Pend. Aprobación'};
    } else if (estado === 'Impreso' || estado === 'Reimpreso') {
      return {id: 'A', nombre: 'Preparación'};
    } else {
      return {id: 'D', nombre: 'Despachado'};
    }
  };

  //Metodo para crear la descripción que se muestra del pedido
  const descripcionNotify = (item) => {
    const {cliente, domiciliario, total, movimiento, comentario, espera} = item;
    let estado = obtenerLabel(item);
    let descripcion = '';
    if (estado) {
      descripcion = descripcion + `Estado: ${estado.nombre} `;
    }

    if (total) {
      descripcion = descripcion + `Total: ${formatoPrecio(total)} \n`;
      if (espera) {
        const hora = `${espera.hora > 0 ? espera.hora + ' Hora' : ''}`;
        const minutos = `${espera.minutos > 0 ? espera.minutos + ' Min' : ''}`;
        descripcion = descripcion + `Tiempo de entrega: ${hora}${minutos} \n`;
      }
    }

    if (movimiento) {
      descripcion =
        descripcion +
        `Ultima Actualización: ${moment(movimiento.toDate()).format(
          'h:mm a',
        )}\n`;
    }

    if (domiciliario) {
      descripcion = descripcion + `Domiciliario: ${domiciliario.nombre}\n`;
    }

    if (comentario) {
      descripcion = descripcion + `Motivo Cancelación: ${comentario}\n`;
    }

    if (cliente) {
      descripcion =
        descripcion +
        `Dirección: ${capitalize(cliente.direccion)} (${
          cliente.barrio.nombre
        }-${cliente.barrio.municipio.nombre})\n`;
    }

    return descripcion;
  };

  //Metodo para cargar las notificaciones del cliente
  const cargarNotificaciones = ({item}) => {
    const {id, productos, cliente} = item;
    let estado = obtenerLabel(item);

    return (
      <Card
        style={{
          margin: normalize(5),
          paddingBottom: normalize(10, 'height'),
          paddingTop: normalize(5, 'height'),
          paddingRight: normalize(30),
        }}>
        <Card.Title
          key={id}
          title={`${moment(item.fecha.toDate()).format('DD-MM-YYYY h:mm a')}\n`}
          titleStyle={{fontSize: normalize(16)}}
          subtitle={descripcionNotify(item)}
          subtitleStyle={{fontSize: normalize(15)}}
          subtitleNumberOfLines={5}
          left={() => (
            <View style={styles.estado}>
              <Avatar.Text
                size={normalize(40)}
                label={estado.id}
                style={obtenerColor(item)}
              />
            </View>
          )}
        />
        <Card.Actions style={{alignSelf: 'flex-end', paddingBottom: 0}}>
          <TouchableNativeFeedback
            onPress={() => {
              setModalDetalle(true);
              setDetalle(productos);
              setDomicilio(cliente.barrio.valor);
            }}>
            <Button
              theme={{
                colors: {
                  primary: Colors.text,
                },
              }}>
              Detalle Pedido
            </Button>
          </TouchableNativeFeedback>
          {estado.id.includes('P') && (
            <TouchableNativeFeedback
              onPress={() => {
                setCancelar(item);
                setModal(true);
              }}>
              <Button
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}>
                Cancelar Pedido
              </Button>
            </TouchableNativeFeedback>
          )}
        </Card.Actions>
      </Card>
    );
  };

  //Metodo para cargar el detalle del pedido del cliente
  const detalleProductos = () => {
    return detalle.map((item) => {
      let totalP = item.precio * item.cantidad;
      let descripcion = `Producto: ${item.nombre}, Cantidad: ${
        item.cantidad
      }, Total: ${formatoPrecio(totalP)}`;
      return (
        <Text
          style={{
            fontSize: normalize(16),
            marginBottom: normalize(5, 'height'),
          }}>
          {descripcion}
        </Text>
      );
    });
  };

  return (
    <View>
      <FlatList
        ItemSeparatorComponent={() => <Divider />}
        data={notificaciones}
        renderItem={cargarNotificaciones}
        keyExtractor={(item) => item.id}
      />
      <TouchableWithoutFeedback
        onPress={() => setModalDetalle(false)}
        accessible={false}>
        <Modal
          animationType="slide"
          visible={modalDetalle}
          transparent={true}
          onRequestClose={() => setModalDetalle(false)}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <Text
                style={{
                  fontSize: normalize(18),
                  marginBottom: normalize(15, 'height'),
                  fontWeight: 'bold',
                  color: Colors.primary,
                }}>
                Detalle Pedido
              </Text>
              <View style={styles.input}>{detalleProductos()}</View>
              <Text
                style={{
                  fontSize: normalize(16),
                  marginBottom: normalize(5, 'height'),
                }}>{`Domicilio: ${formatoPrecio(domicilio)}`}</Text>
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>
      <Modal
        animationType="slide"
        visible={modal}
        transparent={true}
        onRequestClose={cerrarModal}>
        <View style={styles.containerModal}>
          <View style={styles.modal}>
            <View style={styles.input}>
              <Text
                style={{
                  fontSize: normalize(18),
                  marginBottom: normalize(15, 'height'),
                }}>
                Ingrese el Motivo de Cancelación
              </Text>
              <TextInput
                error={formik.errors.cancelacion && formik.touched.cancelacion}
                theme={{
                  colors: {
                    primary: Colors.primary,
                  },
                }}
                id="cancelacion"
                label="Motivo"
                value={formik.values.cancelacion}
                onChangeText={formik.handleChange('cancelacion')}
                onBlur={formik.handleBlur('cancelacion')}
              />
              {formik.errors.cancelacion && formik.touched.cancelacion && (
                <Text style={styles.error}>{formik.errors.cancelacion}</Text>
              )}
            </View>
            <TouchableNativeFeedback onPress={formik.handleSubmit}>
              <Button
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}
                mode="contained">
                Cancelar Pedido
              </Button>
            </TouchableNativeFeedback>
          </View>
        </View>
      </Modal>
      <Toast
        ref={toastRef}
        style={styles.toast}
        positionValue={normalize(toast, 'height')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(30),
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
  estado: {
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  despachado: {
    backgroundColor: '#2980B9',
  },
  entregado: {
    backgroundColor: Colors.success,
  },
  pendiente: {
    backgroundColor: '#E67E22',
  },
  cancelado: {
    backgroundColor: '#E74C3C',
  },
  impreso: {
    backgroundColor: '#2C3E50',
  },
  button: {
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
});

export default Notificacion;
