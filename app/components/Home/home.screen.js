import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { FirebaseContext } from "../../firebase";
import Colors from "../../theme/colors";
import {
  View,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  FlatList,
  Modal,
  Linking,
  BackHandler,
  Dimensions,
  Alert,
} from "react-native";
import { useBackHandler } from "@react-native-community/hooks";
import { Button, List, Avatar, ActivityIndicator } from "react-native-paper";
import { Icon } from "react-native-elements";
import { formatoPrecio } from "../../utils";
import normalize from "react-native-normalize";
import Toast, { DURATION } from "react-native-easy-toast";
import { checkVersion } from "react-native-check-version";
import moment from "moment";
import "moment/locale/es";
import {
  initialUsuarios,
  obtenerUsuarioAsync,
} from "../../redux/reducers/usuariosReducer";
import { useDispatch, useSelector } from "react-redux";
import {
  actualizarEntregaPedidoAsync,
  estadoProceso,
} from "../../redux/reducers/pedidosReducer";
import { initialLogin } from "../../redux/reducers/loginReducer";
import { diffMinutos } from "../utils";
import { ScrollView } from "react-native-gesture-handler";

function Home({ route }) {
  const { firebase } = useContext(FirebaseContext);

  const [date] = useState(new Date());

  const dispatch = useDispatch();

  const domiciliario = useSelector(initialUsuarios);

  const estadoPedido = useSelector(estadoProceso);

  const login = useSelector(initialLogin);

  const [pedidos, setPedidos] = useState([]);

  const [detallePedido, setDetallePedido] = useState({});

  const [pedidosDeudas, setpedidosDeudas] = useState([]);

  const [deudas, setDeudas] = useState([]);

  const [deuda, setDeuda] = useState(0);

  const [modalDetalle, setModalDetalle] = useState(false);

  const [estadoPedidos, setEstadoPedidos] = useState({
    despachado: 0,
    cancelado: 0,
    entregado: 0,
  });

  const toastRef = useRef();

  const DeviceScreen = Dimensions.get("screen");

  const toast = DeviceScreen.height < 700 ? 100 : 140;

  useBackHandler(() => {
    BackHandler.exitApp();
  });

  const validarVersion = async () => {
    const version = await checkVersion();

    const actualizarApp = () => {
      let link = version.url;
      Linking.openURL(link)
        .then((supported) => {
          if (!supported) {
            Alert.alert(
              "Instala la aplicación para brindarte una mejor experiencia"
            );
          } else {
            return Linking.openURL(link);
          }
        })
        .catch((err) => console.error(err));
    };

    if (version.needsUpdate) {
      Alert.alert(
        "Actualización",
        `Es necesario actualizar la aplicación en su última versión ${version.version}`,
        [
          {
            text: "Ir",
            onPress: () => actualizarApp(),
          },
        ]
      );
      return false;
    }
    return true;
  };

  const obtenerUsuario = useCallback(() => {
    if (Object.values(domiciliario).length === 0) {
      dispatch(obtenerUsuarioAsync(login.id));
    }
  }, [dispatch, domiciliario, route]);

  const obtenerPedidos = () => {
    const startOfToday = moment(date).startOf("day").toDate();
    const endOfToday = moment(date).endOf("day").toDate();
    firebase.db
      .collection("pedidos")
      .where("fecha", ">=", startOfToday)
      .where("fecha", "<=", endOfToday)
      .where("domiciliario.id", "==", login.id)
      .onSnapshot(manejarSnapshotPedidos);
  };

  const manejarSnapshotPedidos = (values) => {
    const pedidos = values.docs.map((doc) => {
      let orden = 1;
      if (doc.data().estado === "Entregado") {
        orden = 2;
      }
      if (doc.data().estado === "Cancelado") {
        orden = 3;
      }
      return {
        id: doc.id,
        ...doc.data(),
        orden,
      };
    });

    let orden = pedidos.sort((a, b) => a.orden - b.orden);
    setPedidos(orden);
  };

  const obtenerDeudas = () => {
    firebase.db
      .collection("pedidos")
      .where("deuda", "==", true)
      .where("medioPago", "in", ["efectivo", "parcial"])
      .where("domiciliario.id", "==", login.id)
      .onSnapshot(manejarSnapshotDeudas);
  };

  const manejarSnapshotDeudas = (values) => {
    const deudas = values.docs.map((doc) => {
      let orden = 1;
      if (doc.data().estado === "Entregado") {
        orden = 2;
      }
      if (doc.data().estado === "Cancelado") {
        orden = 3;
      }
      return {
        id: doc.id,
        ...doc.data(),
        orden,
      };
    });

    let orden = deudas.sort((a, b) => a.orden - b.orden);
    setDeudas(orden);
  };

  useEffect(() => {
    obtenerUsuario();
    validarVersion();
  }, []);

  useEffect(() => {
    if (Object.values(domiciliario).length > 0) {
      obtenerDeudas();
      obtenerPedidos();
    }
  }, [domiciliario]);

  useEffect(() => {
    const calcularPedidos = () => {
      let despachado = 0;
      let cancelado = 0;
      let entregado = 0;
      pedidos.map((value) => {
        if (value.estado === "Despachado") {
          despachado = despachado + 1;
        }
        if (value.estado === "Cancelado") {
          cancelado = cancelado + 1;
        }
        if (value.estado === "Entregado") {
          entregado = entregado + 1;
        }
      });

      setEstadoPedidos({ despachado, cancelado, entregado });
    };

    const calcularDeuda = () => {
      const deuda = deudas.reduce((suma, item) => {
        suma += item.total;
        if (item.medioPago === "parcial") {
          suma -= item.detallePago.transferencia;
        }
        if (item.domiciliario && item.domiciliario.rol === 5) {
          suma -= item.cliente.barrio.valor;
        }
        return suma;
      }, 0);
      setDeuda(deuda);
    };

    const calcularPedidosDeudas = () => {
      const pedidosDeudas = [...pedidos, ...deudas];
      const arrMap = pedidosDeudas.map((elemento) => {
        return [JSON.stringify(elemento), elemento];
      });
      const result = [...new Map(arrMap).values()];
      setpedidosDeudas(result);
    };

    //Metodo para calcular las cantidades de los pedidos asignados por estado
    calcularPedidos();
    //Metodo para calcular la deuda del domiciliario
    calcularDeuda();
    // Elimina los pedidos duplicados
    calcularPedidosDeudas();
    //Cierra el splash para mostrar la pantalla inicial
    setModalDetalle(false);
  }, [pedidos, deudas]);

  //Metodo para cargar detalle del pedido seleccionado
  const cargarDetalle = () => {
    const {
      fecha,
      entrega,
      turnoDomicilio,
      cliente,
      productos,
      total,
      medioPago,
      estado,
      observaciones,
      comentario,
      detallePago,
      domiciliario,
    } = detallePedido;
    const habilitarBoton =
      estado === "Cancelado" || estado === "Entregado" ? false : true;
    return (
      <>
        <View
          style={{
            paddingVertical: normalize(15, "height"),
            borderBottomWidth: 0.5,
          }}
        >
          <Text style={styles.turno}>Domicilio Turno #{turnoDomicilio}</Text>
        </View>
        <ScrollView>
          <View style={{ marginVertical: normalize(15, "height") }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginHorizontal: normalize(20),
                marginBottom: normalize(10, "height"),
              }}
            >
              <Text style={{ fontSize: normalize(18) }}>
                <Text style={{ fontWeight: "bold" }}>Fecha: </Text>
                {fecha && moment(fecha.toDate()).format("DD-MM-YYYY")}
              </Text>
              {entrega ? (
                <Text style={{ fontSize: normalize(18) }}>
                  <Text style={{ fontWeight: "bold" }}>Tiempo: </Text>
                  {diffMinutos(domiciliario.hora.toDate(), entrega.toDate())}
                </Text>
              ) : (
                <Text style={{ fontSize: normalize(18) }}>
                  <Text style={{ fontWeight: "bold" }}>Pedido: </Text>
                  {fecha && moment(fecha.toDate()).format("h:mm a")}
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginHorizontal: normalize(20),
                marginBottom: normalize(10, "height"),
              }}
            >
              {domiciliario?.hora && (
                <Text style={{ fontSize: normalize(18) }}>
                  <Text style={{ fontWeight: "bold" }}>Despacho: </Text>
                  {moment(domiciliario.hora.toDate()).format("h:mm a")}
                </Text>
              )}
              {entrega && (
                <Text style={{ fontSize: normalize(18) }}>
                  <Text style={{ fontWeight: "bold" }}>Entrega: </Text>
                  {moment(entrega.toDate()).format("h:mm a")}
                </Text>
              )}
            </View>
            <Text style={styles.text}>
              <Text style={{ fontWeight: "bold" }}>Cliente: </Text>
              {cliente && cliente.nombre}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={styles.text}>
                <Text style={{ fontWeight: "bold" }}>Teléfono Principal: </Text>
                {cliente && cliente.telefono}
              </Text>
              <Icon
                reverse
                name="phone"
                color={Colors.primary}
                size={normalize(15)}
                onPress={() => llamarCliente(cliente.telefono)}
              />
            </View>
            {cliente && cliente.telefono2 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: normalize(-7, "height"),
                }}
              >
                <Text style={styles.text}>
                  <Text style={{ fontWeight: "bold" }}>
                    Teléfono Secundario:{" "}
                  </Text>
                  {cliente.telefono2}
                </Text>
                <Icon
                  reverse
                  name="phone"
                  color={Colors.primary}
                  size={normalize(15)}
                  onPress={() => llamarCliente(cliente.telefono2)}
                />
              </View>
            )}
            <View
              style={{
                marginBottom: normalize(10, "height"),
              }}
            >
              <Text style={styles.text}>
                <Text style={{ fontWeight: "bold" }}>Dirección: </Text>
                {cliente && ` ${cliente.direccion} ${cliente.puntoRef}`}
              </Text>
              <Text style={styles.text}>
                {cliente &&
                  `(${cliente.barrio.nombre} ${cliente.barrio.municipio.nombre})`}
              </Text>
            </View>
            <View
              style={{
                marginBottom: normalize(12, "height"),
              }}
            >
              {medioPago === "parcial" &&
                detallePago &&
                detallePago.efectivo > 0 && (
                  <Text style={styles.text}>
                    <Text style={{ fontWeight: "bold", color: Colors.primary }}>
                      EFECTIVO:{" "}
                    </Text>
                    {formatoPrecio(detallePago.efectivo)}
                  </Text>
                )}
              {detallePago
                ? medioPago !== "efectivo" &&
                  detallePago.transferencia > 0 && (
                    <Text style={styles.text}>
                      <Text style={{ fontWeight: "bold" }}>
                        TRANSFERENCIA:{" "}
                      </Text>
                      {formatoPrecio(detallePago.transferencia)}
                    </Text>
                  )
                : medioPago === "transferencia" && (
                    <Text style={styles.text}>
                      <Text style={{ fontWeight: "bold" }}>
                        TRANSFERENCIA:{" "}
                      </Text>
                      {formatoPrecio(total)}
                    </Text>
                  )}
            </View>
            {observaciones ? (
              <View
                style={{
                  marginBottom: normalize(12, "height"),
                }}
              >
                <Text style={styles.text}>
                  <Text style={{ fontWeight: "bold" }}>Comentario: </Text>
                  {observaciones}
                </Text>
              </View>
            ) : null}
            {comentario ? (
              <View
                style={{
                  marginBottom: normalize(12, "height"),
                }}
              >
                <Text style={styles.text}>
                  <Text style={{ fontWeight: "bold" }}>
                    Motivo Cancelación:{" "}
                  </Text>
                  {comentario}
                </Text>
              </View>
            ) : null}
            <Text
              style={{
                marginLeft: normalize(20),
                fontSize: normalize(18),
                fontWeight: "bold",
              }}
            >
              Productos Solicitados:
            </Text>
          </View>
          <FlatList
            data={productos}
            renderItem={cargarProductos}
            keyExtractor={(item) => item.id}
          />
        </ScrollView>

        {habilitarBoton ? (
          estadoPedido.isLoading ? (
            <View
              style={{
                justifyContent: "center",
                marginVertical: normalize(20, "height"),
              }}
            >
              <ActivityIndicator
                size="large"
                animating={true}
                color={Colors.success}
              />
            </View>
          ) : (
            <TouchableNativeFeedback
              onPress={() =>
                dispatch(
                  actualizarEntregaPedidoAsync({
                    ...detallePedido,
                    estado: "Entregado",
                  })
                )
              }
            >
              <Button
                style={styles.button}
                theme={{
                  colors: {
                    primary: Colors.success,
                  },
                }}
                labelStyle={{ fontSize: normalize(18) }}
                mode="contained"
              >
                Confirmar Entrega
              </Button>
            </TouchableNativeFeedback>
          )
        ) : null}
        <View style={styles.totalDetalle}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "flex-start",
            }}
          >
            <Text
              ellipsizeMode="head"
              numberOfLines={1}
              style={{ fontSize: normalize(22), color: "#fff" }}
            >
              TOTAL
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Text
              ellipsizeMode="head"
              numberOfLines={1}
              style={{ fontSize: normalize(22), color: "#fff" }}
            >
              {formatoPrecio(total)}
            </Text>
          </View>
        </View>
      </>
    );
  };

  //Metodo para abrir el telefono con el número del cliente
  const llamarCliente = (value) => {
    const phoneNumber =
      value.toString().length < 10 ? `tel:604${value}` : `tel:${value}`;
    Linking.canOpenURL(phoneNumber)
      .then(() => {
        return Linking.openURL(phoneNumber);
      })
      .catch((error) => {
        firebase.db.collection("logs").add({
          accion: "Llamar Cliente App",
          fecha: firebase.time,
          error: error.message,
          datos: { phoneNumber },
        });
      });
  };

  //Metodo para obtener colores de los estados del pedido
  const obtenerColor = (item) => {
    const { estado, entrega } = item;
    if (estado === "Cancelado") {
      return styles.cancelado;
    } else if (entrega && estado === "Entregado") {
      return styles.entregado;
    } else {
      return styles.despachado;
    }
  };

  //Metodo para obtener la inicial de los estados del pedido
  const obtenerLabel = (item) => {
    const { estado, entrega } = item;
    if (estado === "Cancelado") {
      return "C";
    } else if (entrega && estado === "Entregado") {
      return "E";
    } else {
      return "D";
    }
  };

  //Metodo para cargar todos los pedidos asignados
  const cargarPedidos = ({ item, index }) => {
    const { cliente } = item;
    return (
      <List.Item
        key={`Pedido_${index}`}
        title={`${cliente.nombre}`}
        titleStyle={{ fontSize: normalize(20) }}
        description={`${cliente.direccion} ${cliente.puntoRef} (${cliente.barrio.nombre}-${cliente.barrio.municipio.nombre})`}
        descriptionStyle={{ fontSize: normalize(18) }}
        onPress={() => {
          setDetallePedido({ ...item });
          setTimeout(() => {
            setModalDetalle(true);
          }, 100);
        }}
        left={() => (
          <View style={styles.estado}>
            <Avatar.Text
              size={normalize(50)}
              label={obtenerLabel(item)}
              style={obtenerColor(item)}
            />
          </View>
        )}
        right={() => (
          <View style={styles.estado}>
            <Icon size={normalize(33)} name="chevron-right" type="evilicon" />
          </View>
        )}
      />
    );
  };

  //Metodo para cargar los productos de los pedidos
  const cargarProductos = ({ item, index }) => {
    const { nombre, imagen, cantidad } = item;
    return (
      <List.Item
        key={`Pedido_${index}`}
        title={nombre}
        titleStyle={{ fontSize: normalize(20) }}
        description={`Cantidad X ${cantidad}`}
        descriptionStyle={{ fontSize: normalize(18) }}
        left={() => (
          <View style={styles.estado}>
            <Avatar.Image source={{ uri: imagen }} />
          </View>
        )}
      />
    );
  };

  //Metodo para actualizar el pedido al confirmar la entrega
  const actualizarPedido = async (id) => {
    try {
      const response = await api.put(
        `pedidos/api/updatePedidoDomiciliario/${id}`,
        {
          estado: "Entregado",
        }
      );
    } catch (error) {
      toastRef.current.show("Valide su conexión a internet", 3000);
      firebase.db.collection("logs").add({
        accion: "Entregar Pedido App",
        fecha: firebase.time,
        error: error.message,
        datos: { id },
      });
    } finally {
      setModalDetalle(false);
    }
  };

  return (
    <>
      <Text style={styles.title}>{domiciliario.nombre}</Text>
      <View style={styles.estadoCuenta}>
        <View style={styles.deuda}>
          <Text
            style={styles.textEstado}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            Deuda {formatoPrecio(deuda)}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{"Estado de Cuenta".toUpperCase()}</Text>
      <View style={styles.estadoCuenta}>
        <View style={styles.abonado}>
          <Text
            style={styles.textEstado}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            Despachados: {estadoPedidos.despachado}
          </Text>
        </View>
        <View style={styles.cancelados}>
          <Text
            style={styles.textEstado}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            Cancelados: {estadoPedidos.cancelado}
          </Text>
        </View>
        <View style={styles.total}>
          <Text
            style={styles.textEstado}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            Entregados: {estadoPedidos.entregado}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{"Control de pedidos".toUpperCase()}</Text>
      <View
        style={{
          flex: 1,
        }}
      >
        <FlatList
          data={pedidosDeudas}
          renderItem={cargarPedidos}
          keyExtractor={(item) => item.id}
        />
      </View>
      <Modal
        animationType="slide"
        visible={modalDetalle}
        onRequestClose={() => {
          setModalDetalle(false);
        }}
      >
        {cargarDetalle()}
      </Modal>
      <Toast
        ref={toastRef}
        style={styles.toast}
        positionValue={normalize(toast, "height")}
      />
    </>
  );
}

const styles = StyleSheet.create({
  estado: {
    justifyContent: "center",
    marginHorizontal: 5,
  },
  despachado: {
    backgroundColor: "#2980B9",
  },
  entregado: {
    backgroundColor: Colors.success,
  },
  cancelado: {
    backgroundColor: "#E74C3C",
  },
  estadoCuenta: {
    flex: 1,
    flexDirection: "row",
    maxHeight: normalize(20, "height"),
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontSize: normalize(22),
    paddingVertical: normalize(5, "height"),
    color: Colors.text,
    backgroundColor: "#E5E8E8",
  },
  textEstado: {
    padding: normalize(5),
    fontSize: normalize(15),
    color: "white",
  },
  abonado: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#2980B9",
    justifyContent: "center",
  },
  deuda: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Colors.primary,
    justifyContent: "center",
  },
  cancelados: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#E74C3C",
    justifyContent: "center",
  },
  total: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#2ECC71",
    justifyContent: "center",
  },
  turno: {
    textAlign: "center",
    fontSize: normalize(20),
    fontWeight: "bold",
  },
  text: {
    marginLeft: normalize(20),
    fontSize: normalize(18),
  },
  button: {
    paddingVertical: normalize(5, "height"),
    marginVertical: normalize(2, "height"),
  },
  totalDetalle: {
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingHorizontal: normalize(15),
    paddingVertical: normalize(5, "height"),
  },
  toast: {
    backgroundColor: Colors.error,
  },
});

export default Home;
