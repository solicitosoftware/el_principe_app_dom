import React, {useContext, useState, useEffect} from 'react';
import {FirebaseContext} from '../../firebase';
import {
  View,
  StyleSheet,
  FlatList,
  BackHandler,
  Modal,
  Text,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import {useBackHandler} from '@react-native-community/hooks';
import {
  List,
  Avatar,
  TextInput,
  Button,
  ActivityIndicator,
} from 'react-native-paper';
import {Icon, Image, CheckBox} from 'react-native-elements';
import {formatoPrecio} from '../../utils';
import normalize from 'react-native-normalize';
import Colors from '../../theme/colors';
import {useDispatch, useCanasta} from '../Context/canastaProvider';
import {types} from '../Context/canastaReducer';

function Productos({route}) {
  const {firebase} = useContext(FirebaseContext);

  const dispatch = useDispatch();

  const [productos, setProductos] = useState([]);

  const [modal, setModal] = useState(false);

  const [productoSelect, setProductoSelect] = useState([]);

  const [cantidad, setCantidad] = useState(1);

  const [bbq, setBbq] = useState(false);

  const [rosa, setRosa] = useState(false);

  const [pina, setPina] = useState(false);

  const [banner, setBanner] = useState(null);

  const canasta = useCanasta();

  useBackHandler(() => {
    BackHandler.exitApp();
  });

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
  }, [canasta]);

  useEffect(() => {
    const obtenerProductos = () => {
      firebase.db
        .collection('productos')
        .where('estado', '==', true)
        .orderBy('orden', 'asc')
        .onSnapshot(manejarSnapshotProductos);
    };

    const obtenerBanner = async () => {
      const url = await firebase.storage
        .ref('banners/banner.jpg')
        .getDownloadURL();
      setBanner(url);
    };

    //Metodo para obtener los productos activos y el banner
    obtenerProductos();
    obtenerBanner();
  }, []);

  function manejarSnapshotProductos(values) {
    const productos = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setProductos(productos);
  }

  //Metodo para cargar todos los productos
  const cargarProductos = ({item, index}) => {
    const {nombre, imagen, precio} = item;
    return (
      <List.Item
        key={`Pedido_${index}`}
        title={nombre.toUpperCase()}
        titleStyle={{fontSize: normalize(20)}}
        description={`Precio ${formatoPrecio(precio)}`}
        descriptionStyle={{fontSize: normalize(18)}}
        left={() => (
          <View style={styles.imagen}>
            <Avatar.Image size={50} source={{uri: imagen}} />
          </View>
        )}
        right={() => (
          <View
            style={{
              width: normalize(40),
              justifyContent: 'center',
            }}>
            <TextInput.Icon
              name={() => (
                <Icon
                  raised
                  size={normalize(30)}
                  name="plus"
                  type="evilicon"
                  onPress={async () => {
                    await setProductoSelect(item);
                    setModal(true);
                  }}
                />
              )}
            />
          </View>
        )}
        onPress={async () => {
          await setProductoSelect(item);
          setModal(true);
        }}
      />
    );
  };

  //Metodo para agregar productoa a la canasta
  const agregarProducto = (params) => {
    let actual = {...params};
    actual.cantidad = cantidad;
    actual.salsas = {};
    if (actual.categoria.salsas) {
      actual.salsas = {
        bbq: bbq,
        rosa: rosa,
        pina: pina,
      };
    }
    dispatch({type: types.add, data: {...actual}});
    limpiarDatos();
  };

  const limpiarDatos = () => {
    setBbq(false);
    setPina(false);
    setRosa(false);
    setCantidad(1);
    setModal(false);
  };

  //Metodo para cargar las salsas al detalle del producto
  const salsas = () => {
    return (
      <View>
        <Text
          style={{
            fontSize: normalize(13),
            marginTop: normalize(10, 'height'),
            marginLeft: normalize(15),
          }}>
          Seleccione sus salsas:
        </Text>
        <CheckBox
          title="Bbq"
          checkedIcon={
            <Icon
              name="radio-button-checked"
              type="material"
              color="#A93226"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          uncheckedIcon={
            <Icon
              name="radio-button-unchecked"
              type="material"
              color="grey"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          checked={bbq}
          onPress={() => setBbq(!bbq)}
        />
        <CheckBox
          title="Rosada"
          checkedIcon={
            <Icon
              name="radio-button-checked"
              type="material"
              color="#FE73B9"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          uncheckedIcon={
            <Icon
              name="radio-button-unchecked"
              type="material"
              color="grey"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          checked={rosa}
          onPress={() => setRosa(!rosa)}
        />
        <CheckBox
          title="Piña"
          checkedIcon={
            <Icon
              name="radio-button-checked"
              type="material"
              color="#FFC300"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          uncheckedIcon={
            <Icon
              name="radio-button-unchecked"
              type="material"
              color="grey"
              size={normalize(20)}
              iconStyle={{marginHorizontal: normalize(10)}}
            />
          }
          checked={pina}
          onPress={() => setPina(!pina)}
        />
      </View>
    );
  };

  //Metodo para mostrar el detalle del producto seleccionado
  const detalleProducto = () => {
    const {descripcion, imagen, precio, nombre, categoria} = productoSelect;
    let costo = cantidad * precio;
    return (
      <Modal
        animationType="slide"
        visible={modal}
        transparent={true}
        onRequestClose={limpiarDatos}>
        <TouchableWithoutFeedback onPress={limpiarDatos} accessible={false}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <View
                style={{
                  alignItems: 'center',
                  marginBottom: normalize(15, 'height'),
                }}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: normalize(16),
                    marginTop: normalize(5, 'height'),
                  }}>
                  {nombre && nombre.toUpperCase()}
                </Text>
                {imagen && (
                  <Image
                    placeholderStyle={{backgroundColor: 'white'}}
                    style={styles.imageModal}
                    resizeMode="contain"
                    source={{uri: imagen}}
                  />
                )}
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: normalize(16),
                    marginTop: normalize(5, 'height'),
                  }}>
                  {descripcion}
                </Text>
              </View>
              {categoria?.salsas && salsas()}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  marginVertical: normalize(15, 'height'),
                }}>
                <View style={styles.cantidad}>
                  <Icon
                    color={Colors.error}
                    reverse
                    name="minus"
                    type="evilicon"
                    size={normalize(18)}
                    onPress={() => {
                      if (cantidad > 1) {
                        setCantidad(cantidad - 1);
                      }
                    }}
                  />
                  <Text style={styles.textCantidad}>{cantidad}</Text>
                  <Icon
                    color={Colors.success}
                    reverse
                    name="plus"
                    type="evilicon"
                    size={normalize(18)}
                    onPress={() => {
                      setCantidad(cantidad + 1);
                    }}
                  />
                </View>
              </View>
            </View>
            <TouchableNativeFeedback
              onPress={() => agregarProducto(productoSelect)}>
              <Button
                style={styles.button}
                theme={{
                  colors: {
                    primary: Colors.button,
                  },
                }}
                mode="contained">
                {`Agregar ${formatoPrecio(costo)}`}
              </Button>
            </TouchableNativeFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      {productos.length > 0 ? (
        <FlatList
          data={productos}
          renderItem={cargarProductos}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View>
              {banner && (
                <Image
                  source={{uri: banner}}
                  style={{height: 150}}
                  resizeMode="stretch"
                />
              )}
            </View>
          )}
        />
      ) : (
        <ActivityIndicator size={normalize(50)} color={Colors.primary} />
      )}
      {detalleProducto()}
    </View>
  );
}

const styles = StyleSheet.create({
  imagen: {
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  containerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(218,218,218, 0.9)',
  },
  modal: {
    backgroundColor: 'rgba(255,255,255, 1)',
    marginHorizontal: normalize(5),
    borderTopLeftRadius: normalize(30),
    borderTopRightRadius: normalize(30),
    paddingTop: normalize(20, 'height'),
  },
  textCantidad: {
    fontSize: normalize(25),
    fontWeight: 'bold',
    marginHorizontal: normalize(20),
  },
  cantidad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: normalize(2, 'height'),
  },
  imageModal: {
    width: normalize(160),
    height: normalize(130, 'height'),
    borderRadius: normalize(20),
  },
  button: {
    paddingVertical: normalize(5, 'height'),
    marginBottom: normalize(10, 'height'),
  },
});

export default Productos;
