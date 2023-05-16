import React, {useRef, useContext, useEffect, useState} from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
} from 'react-native';
import Toast, {DURATION} from 'react-native-easy-toast';
import {FirebaseContext} from '../../firebase';
import {useNavigation} from '@react-navigation/native';
import {useFormik} from 'formik';
import * as Yup from 'yup';
import {TextInput, List, Button, Divider} from 'react-native-paper';
import {Icon} from 'react-native-elements';
import normalize from 'react-native-normalize';
import Colors from '../../theme/colors';

const DeviceScreen = Dimensions.get('screen');

function Direccion({route}) {
  const {firebase} = useContext(FirebaseContext);

  const navigation = useNavigation();

  const toastRef = useRef();

  const toast = DeviceScreen.height < 700 ? normalize(210) : normalize(210);

  const [cliente, setCliente] = useState([]);

  const [modal, setModal] = useState(false);

  const [datos, setDatos] = useState([]);

  const [indiceCampo, setIndiceCampo] = useState({indice: 1, campo: 'barrio'});

  const [municipios, setMunicipios] = useState([]);

  const [barrios1, setBarrios1] = useState([]);

  const [barrios2, setBarrios2] = useState([]);

  const [barrios3, setBarrios3] = useState([]);

  const [barrios4, setBarrios4] = useState([]);

  const formik = useFormik({
    initialValues: {
      municipio: '',
      barrio: '',
      direccion: '',
      puntoRef: '',
      municipio2: '',
      barrio2: '',
      direccion2: '',
      puntoRef2: '',
      municipio3: '',
      barrio3: '',
      direccion3: '',
      puntoRef3: '',
      municipio4: '',
      barrio4: '',
      direccion4: '',
      puntoRef4: '',
    },
    validationSchema: Yup.object({
      direccion: Yup.string().required('La dirección es obligatoria'),
      barrio: Yup.string().required('El barrio es obligatorio'),
      municipio: Yup.string().required('El municipio es obligatorio'),
      puntoRef: Yup.string(),
      municipio2: Yup.string(),
      barrio2: Yup.string().when('municipio2', (municipio2, barrio2) =>
        municipio2 ? barrio2.required('El barrio es obligatorio') : barrio2,
      ),
      direccion2: Yup.string().when('municipio2', (municipio2, direccion2) =>
        municipio2
          ? direccion2.required('La dirección es obligatoria')
          : direccion2,
      ),
      puntoRef2: Yup.string(),
      municipio3: Yup.string(),
      barrio3: Yup.string().when('municipio3', (municipio3, barrio3) =>
        municipio3 ? barrio3.required('El barrio es obligatorio') : barrio3,
      ),
      direccion3: Yup.string().when('municipio3', (municipio3, direccion3) =>
        municipio3
          ? direccion3.required('La dirección es obligatoria')
          : direccion3,
      ),
      puntoRef3: Yup.string(),
      municipio4: Yup.string(),
      barrio4: Yup.string().when('municipio4', (municipio4, barrio4) =>
        municipio4 ? barrio4.required('El barrio es obligatorio') : barrio4,
      ),
      direccion4: Yup.string().when('municipio4', (municipio4, direccion4) =>
        municipio4
          ? direccion4.required('La dirección es obligatoria')
          : direccion4,
      ),
      puntoRef4: Yup.string(),
    }),
    onSubmit: () => {
      formik.values.barrio = formik.values.barrio
        ? JSON.parse(formik.values.barrio)
        : '';
      formik.values.barrio2 = formik.values.barrio2
        ? JSON.parse(formik.values.barrio2)
        : '';
      formik.values.barrio3 = formik.values.barrio3
        ? JSON.parse(formik.values.barrio3)
        : '';
      formik.values.barrio4 = formik.values.barrio4
        ? JSON.parse(formik.values.barrio4)
        : '';
      const {id} = cliente;
      const {
        direccion,
        barrio,
        puntoRef,
        direccion2,
        barrio2,
        puntoRef2,
        direccion3,
        barrio3,
        puntoRef3,
        direccion4,
        barrio4,
        puntoRef4,
      } = formik.values;
      try {
        firebase.db
          .collection('clientes')
          .doc(id)
          .update({
            direccion,
            barrio,
            puntoRef,
            direccion2,
            barrio2,
            puntoRef2,
            direccion3,
            barrio3,
            puntoRef3,
            direccion4,
            barrio4,
            puntoRef4,
          })
          .then(() => {
            navigation.navigate('canasta');
          });
      } catch (error) {
        toastRef.current.show(
          'Ha ocurrido un error, intetelo nuevamente',
          5000,
        );
        firebase.db.collection('logs').add({
          accion: 'Actualizar Direcciones App',
          fecha: firebase.time,
          error: error.message,
          datos: {...formik.values, id},
        });
      }
    },
  });

  useEffect(() => {
    const {cliente} = route.params;
    setCliente(cliente);
  }, []);

  useEffect(() => {
    //Metodo para cargar las direcciones existentes
    const cargarDatos = () => {
      const {
        barrio = '',
        barrio2 = '',
        barrio3 = '',
        barrio4 = '',
        puntoRef = '',
        puntoRef2 = '',
        puntoRef3 = '',
        puntoRef4 = '',
        direccion = '',
        direccion2 = '',
        direccion3 = '',
        direccion4 = '',
      } = cliente;
      formik.setValues({
        municipio: barrio && barrio.municipio.id,
        municipio2: barrio2 && barrio2.municipio.id,
        municipio3: barrio3 && barrio3.municipio.id,
        municipio4: barrio4 && barrio4.municipio.id,
        barrio: JSON.stringify(barrio),
        barrio2: JSON.stringify(barrio2),
        barrio3: JSON.stringify(barrio3),
        barrio4: JSON.stringify(barrio4),
        puntoRef,
        puntoRef2,
        puntoRef3,
        puntoRef4,
        direccion,
        direccion2,
        direccion3,
        direccion4,
      });
    };

    cargarDatos();
  }, [cliente]);

  useEffect(() => {
    //Metodo para obtener los municipios
    const obtenerMunicipios = async () => {
      const result = await firebase.db
        .collection('municipios')
        .orderBy('nombre', 'asc')
        .get();
      const municipios = result.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
      setMunicipios(municipios);
    };

    obtenerMunicipios();
  }, []);

  useEffect(() => {
    //Metodo para obtener los barrios del municipio de la direccion principal
    const obtenerBarrios = async () => {
      const municipio = formik.values.municipio;
      firebase.db
        .collection('barrios')
        .orderBy('nombre', 'asc')
        .where('municipio.id', '==', municipio)
        .onSnapshot(manejarSnapshotBarrio1);
    };

    if (formik.values.municipio) {
      obtenerBarrios();
    }
  }, [formik.values.municipio]);

  useEffect(() => {
    //Metodo para obtener los barrios del municipio de la direccion 2
    const obtenerBarrios = async () => {
      const municipio = formik.values.municipio2;
      firebase.db
        .collection('barrios')
        .orderBy('nombre', 'asc')
        .where('municipio.id', '==', municipio)
        .onSnapshot(manejarSnapshotBarrio2);
    };

    if (formik.values.municipio2) {
      obtenerBarrios();
    }
  }, [formik.values.municipio2]);

  useEffect(() => {
    //Metodo para obtener los barrios del municipio de la direccion 3
    const obtenerBarrios = async () => {
      const municipio = formik.values.municipio3;
      firebase.db
        .collection('barrios')
        .orderBy('nombre', 'asc')
        .where('municipio.id', '==', municipio)
        .onSnapshot(manejarSnapshotBarrio3);
    };

    if (formik.values.municipio3) {
      obtenerBarrios();
    }
  }, [formik.values.municipio3]);

  useEffect(() => {
    //Metodo para obtener los barrios del municipio de la direccion 4
    const obtenerBarrios = async () => {
      const municipio = formik.values.municipio4;
      firebase.db
        .collection('barrios')
        .orderBy('nombre', 'asc')
        .where('municipio.id', '==', municipio)
        .onSnapshot(manejarSnapshotBarrio4);
    };

    if (formik.values.municipio4) {
      obtenerBarrios();
    }
  }, [formik.values.municipio4]);

  function manejarSnapshotBarrio1(values) {
    const barrios = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setBarrios1(barrios);
  }

  function manejarSnapshotBarrio2(values) {
    const barrios = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setBarrios2(barrios);
  }

  function manejarSnapshotBarrio3(values) {
    const barrios = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setBarrios3(barrios);
  }

  function manejarSnapshotBarrio4(values) {
    const barrios = values.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    setBarrios4(barrios);
  }

  //Metodo para cargar los controles de edición de la dirección pricipal
  const Direccion1 = () => {
    let barrio = formik.values.barrio ? JSON.parse(formik.values.barrio) : '';
    let municipio = formik.values.municipio
      ? municipios.find((x) => x.id === formik.values.municipio)
      : '';
    return (
      <View
        style={{
          paddingHorizontal: normalize(20),
        }}>
        <View>
          <List.Subheader>Dirección</List.Subheader>
          <TextInput
            error={formik.errors.direccion && formik.touched.direccion}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="direccion"
            value={formik.values.direccion}
            onChangeText={formik.handleChange('direccion')}
            onBlur={formik.handleBlur('direccion')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="location"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.direccion && formik.touched.direccion && (
            <Text style={styles.error}>{formik.errors.direccion}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Municipio</List.Subheader>
            <List.Item
              title={municipio?.nombre}
              id={formik.values.municipio}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos([
                      {id: '', nombre: 'Seleccione'},
                      ...municipios,
                    ]);
                    setIndiceCampo({indice: 1, campo: 'municipio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.municipio && formik.touched.municipio && (
            <Text style={styles.error}>{formik.errors.municipio}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Barrio</List.Subheader>
            <List.Item
              title={barrio?.nombre}
              id={formik.values.barrio}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos(barrios1);
                    setIndiceCampo({indice: 1, campo: 'barrio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.barrio && formik.touched.barrio && (
            <Text style={styles.error}>{formik.errors.barrio}</Text>
          )}
        </View>
        <View>
          <List.Subheader>Punto de Referencia</List.Subheader>
          <TextInput
            error={formik.errors.puntoRef && formik.touched.puntoRef}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="puntoRef"
            value={formik.values.puntoRef}
            onChangeText={formik.handleChange('puntoRef')}
            onBlur={formik.handleBlur('puntoRef')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="pointer"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.puntoRef && formik.touched.puntoRef && (
            <Text style={styles.error}>{formik.errors.puntoRef}</Text>
          )}
        </View>
      </View>
    );
  };

  //Metodo para cargar los controles de edición de la dirección 2
  const Direccion2 = () => {
    let barrio = formik.values.barrio2 ? JSON.parse(formik.values.barrio2) : '';
    let municipio = formik.values.municipio2
      ? municipios.find((x) => x.id === formik.values.municipio2)
      : '';
    return (
      <View
        style={{
          paddingHorizontal: normalize(20),
        }}>
        <View>
          <List.Subheader>Dirección</List.Subheader>
          <TextInput
            error={formik.errors.direccion2 && formik.touched.direccion2}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="direccion2"
            value={formik.values.direccion2}
            onChangeText={formik.handleChange('direccion2')}
            onBlur={formik.handleBlur('direccion2')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="location"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.direccion2 && formik.touched.direccion2 && (
            <Text style={styles.error}>{formik.errors.direccion2}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Municipio</List.Subheader>
            <List.Item
              title={municipio?.nombre}
              id={formik.values.municipio2}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos([
                      {id: '', nombre: 'Seleccione'},
                      ...municipios,
                    ]);
                    setIndiceCampo({indice: 2, campo: 'municipio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.municipio2 && formik.touched.municipio2 && (
            <Text style={styles.error}>{formik.errors.municipio2}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Barrio</List.Subheader>
            <List.Item
              title={barrio?.nombre}
              id={formik.values.barrio2}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos(barrios2);
                    setIndiceCampo({indice: 2, campo: 'barrio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.barrio2 && formik.touched.barrio2 && (
            <Text style={styles.error}>{formik.errors.barrio2}</Text>
          )}
        </View>
        <View>
          <List.Subheader>Punto de Referencia</List.Subheader>
          <TextInput
            error={formik.errors.puntoRef2 && formik.touched.puntoRef2}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="puntoRef2"
            value={formik.values.puntoRef2}
            onChangeText={formik.handleChange('puntoRef2')}
            onBlur={formik.handleBlur('puntoRef2')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="pointer"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.puntoRef2 && formik.touched.puntoRef2 && (
            <Text style={styles.error}>{formik.errors.puntoRef2}</Text>
          )}
        </View>
      </View>
    );
  };

  //Metodo para cargar los controles de edición de la dirección 3
  const Direccion3 = () => {
    let barrio = formik.values.barrio3 ? JSON.parse(formik.values.barrio3) : '';
    let municipio = formik.values.municipio3
      ? municipios.find((x) => x.id === formik.values.municipio3)
      : '';
    return (
      <View
        style={{
          paddingHorizontal: normalize(20),
        }}>
        <View>
          <List.Subheader>Dirección</List.Subheader>
          <TextInput
            error={formik.errors.direccion3 && formik.touched.direccion3}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="direccion3"
            value={formik.values.direccion3}
            onChangeText={formik.handleChange('direccion3')}
            onBlur={formik.handleBlur('direccion3')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="location"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.direccion3 && formik.touched.direccion3 && (
            <Text style={styles.error}>{formik.errors.direccion3}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Municipio</List.Subheader>
            <List.Item
              title={municipio?.nombre}
              id={formik.values.municipio3}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos([
                      {id: '', nombre: 'Seleccione'},
                      ...municipios,
                    ]);
                    setIndiceCampo({indice: 3, campo: 'municipio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.municipio3 && formik.touched.municipio3 && (
            <Text style={styles.error}>{formik.errors.municipio3}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Barrio</List.Subheader>
            <List.Item
              title={barrio?.nombre}
              id={formik.values.barrio3}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos(barrios3);
                    setIndiceCampo({indice: 3, campo: 'barrio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.barrio3 && formik.touched.barrio3 && (
            <Text style={styles.error}>{formik.errors.barrio3}</Text>
          )}
        </View>
        <View>
          <List.Subheader>Punto de Referencia</List.Subheader>
          <TextInput
            error={formik.errors.puntoRef3 && formik.touched.puntoRef3}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="puntoRef3"
            value={formik.values.puntoRef3}
            onChangeText={formik.handleChange('puntoRef3')}
            onBlur={formik.handleBlur('puntoRef3')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="pointer"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.puntoRef3 && formik.touched.puntoRef3 && (
            <Text style={styles.error}>{formik.errors.puntoRef3}</Text>
          )}
        </View>
      </View>
    );
  };

  //Metodo para cargar los controles de edición de la dirección 4
  const Direccion4 = () => {
    let barrio = formik.values.barrio4 ? JSON.parse(formik.values.barrio4) : '';
    let municipio = formik.values.municipio4
      ? municipios.find((x) => x.id === formik.values.municipio4)
      : '';
    return (
      <View
        style={{
          paddingHorizontal: normalize(20),
        }}>
        <View>
          <List.Subheader>Dirección</List.Subheader>
          <TextInput
            error={formik.errors.direccion4 && formik.touched.direccion4}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="direccion"
            value={formik.values.direccion4}
            onChangeText={formik.handleChange('direccion4')}
            onBlur={formik.handleBlur('direccion4')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="location"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.direccion4 && formik.touched.direccion4 && (
            <Text style={styles.error}>{formik.errors.direccion4}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Municipio</List.Subheader>
            <List.Item
              title={municipio?.nombre}
              id={formik.values.municipio4}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos([
                      {id: '', nombre: 'Seleccione'},
                      ...municipios,
                    ]);
                    setIndiceCampo({indice: 4, campo: 'municipio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.municipio4 && formik.touched.municipio4 && (
            <Text style={styles.error}>{formik.errors.municipio4}</Text>
          )}
        </View>
        <View>
          <List.AccordionGroup>
            <List.Subheader>Barrio</List.Subheader>
            <List.Item
              title={barrio?.nombre}
              id={formik.values.barrio4}
              theme={{
                colors: {
                  primary: Colors.primary,
                },
              }}
              style={{backgroundColor: 'white'}}
              right={() => (
                <Icon
                  size={normalize(40)}
                  color={Colors.primary}
                  name={'chevron-down'}
                  type="evilicon"
                  onPress={async () => {
                    await setDatos(barrios4);
                    setIndiceCampo({indice: 4, campo: 'barrio'});
                    setModal(true);
                  }}
                />
              )}
            />
          </List.AccordionGroup>
          {formik.errors.barrio4 && formik.touched.barrio4 && (
            <Text style={styles.error}>{formik.errors.barrio4}</Text>
          )}
        </View>
        <View>
          <List.Subheader>Punto de Referencia</List.Subheader>
          <TextInput
            error={formik.errors.puntoRef4 && formik.touched.puntoRef4}
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            id="puntoRef4"
            value={formik.values.puntoRef4}
            onChangeText={formik.handleChange('puntoRef4')}
            onBlur={formik.handleBlur('puntoRef4')}
            right={
              <TextInput.Icon
                name={() => (
                  <Icon
                    color={Colors.primary}
                    size={normalize(30)}
                    name="pointer"
                    type="evilicon"
                  />
                )}
              />
            }
          />
          {formik.errors.puntoRef4 && formik.touched.puntoRef4 && (
            <Text style={styles.error}>{formik.errors.puntoRef4}</Text>
          )}
        </View>
      </View>
    );
  };

  //Metodo para cargar los datos existentes
  const cargarDatos = ({item}) => {
    return (
      <List.Item
        key={item.id}
        title={item.nombre}
        onPress={() => actualizarCampo(item)}
      />
    );
  };

  //Metodo para actualizar los campos municipio y barrio
  const actualizarCampo = (value) => {
    const {indice, campo} = indiceCampo;
    if (campo === 'barrio') {
      switch (indice) {
        case 1:
          formik.setFieldValue('barrio', JSON.stringify(value), false);
          break;
        case 2:
          formik.setFieldValue('barrio2', JSON.stringify(value), false);
          break;
        case 3:
          formik.setFieldValue('barrio3', JSON.stringify(value), false);
          break;
        case 4:
          formik.setFieldValue('barrio4', JSON.stringify(value), false);
          break;
      }
    } else if (campo === 'municipio') {
      switch (indice) {
        case 1:
          formik.setFieldValue('municipio', value.id, false);
          formik.setFieldValue('barrio', '', true);
          break;
        case 2:
          formik.setFieldValue('municipio2', value.id, false);
          formik.setFieldValue('barrio2', '', true);
          break;
        case 3:
          formik.setFieldValue('municipio3', value.id, false);
          formik.setFieldValue('barrio3', '', true);
          break;
        case 4:
          formik.setFieldValue('municipio4', value.id, false);
          formik.setFieldValue('barrio4', '', true);
          break;
      }
    }
    setModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View>
        <List.AccordionGroup>
          <List.Subheader>Direcciones</List.Subheader>
          <List.Accordion
            title="Dirección Principal"
            id="1"
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            right={() => (
              <Icon
                size={normalize(40)}
                color={Colors.primary}
                name="navicon"
                type="evilicon"
              />
            )}>
            {Direccion1()}
          </List.Accordion>
          <List.Accordion
            title="Dirección 2"
            id="2"
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            right={() => (
              <Icon
                size={normalize(40)}
                color={Colors.primary}
                name="navicon"
                type="evilicon"
              />
            )}>
            {Direccion2()}
          </List.Accordion>
          <List.Accordion
            title="Dirección 3"
            id="3"
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            right={() => (
              <Icon
                size={normalize(40)}
                color={Colors.primary}
                name="navicon"
                type="evilicon"
              />
            )}>
            {Direccion3()}
          </List.Accordion>
          <List.Accordion
            title="Dirección 4"
            id="4"
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
            right={() => (
              <Icon
                size={normalize(40)}
                color={Colors.primary}
                name="navicon"
                type="evilicon"
              />
            )}>
            {Direccion4()}
          </List.Accordion>
        </List.AccordionGroup>
      </View>
      <TouchableNativeFeedback onPress={formik.handleSubmit}>
        <Button
          style={styles.button}
          theme={{
            colors: {
              primary: Colors.button,
            },
          }}
          mode="contained">
          Actualizar
        </Button>
      </TouchableNativeFeedback>
      <Toast
        ref={toastRef}
        style={styles.toast}
        positionValue={normalize(toast, 'height')}
      />
      <TouchableWithoutFeedback
        onPress={() => setModal(false)}
        accessible={false}>
        <Modal
          animationType="slide"
          visible={modal}
          transparent={true}
          onRequestClose={() => {
            setModal(false);
          }}>
          <View style={styles.containerModal}>
            <View style={styles.modal}>
              <FlatList
                ItemSeparatorComponent={() => <Divider />}
                data={datos}
                renderItem={cargarDatos}
                keyExtractor={(item) => item.id}
              />
            </View>
          </View>
        </Modal>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: normalize(10),
  },
  containerModal: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(218,218,218, 0.9)',
    paddingVertical: normalize(50, 'height'),
  },
  modal: {
    backgroundColor: 'rgba(255,255,255, 1)',
    marginHorizontal: normalize(30),
    paddingVertical: normalize(10, 'height'),
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
});

export default Direccion;
