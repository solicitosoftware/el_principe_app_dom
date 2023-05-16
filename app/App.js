import React, {useReducer} from 'react';
import firebase, {FirebaseContext} from './firebase';
import CanastaContext from './components/Context/canastaContext';
import NotifyContext from './components/Context/notifyContext';
import {useCanasta} from './components/Context/canastaProvider';
import {useNotify} from './components/Context/notifyProvider';
import auth from '@react-native-firebase/auth';
import {View, Linking} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Image, Icon, withBadge} from 'react-native-elements';
import normalize from 'react-native-normalize';
import Colors from '../app/theme/colors';
// Se importan los screens para crear la navegación
import Login from './components/Login/Domicilios/login.screen';
import LoginC from './components/Login/Clientes/login.screen';
import Home from './components/Home/Domicilios/home.screen';
import HomeC from './components/Home/Clientes/home.screen';
import Productos from './components/Productos/productos.screen';
import Canasta from './components/Canasta/canasta.screen';
import RegistroDatos from './components/Registro/registro.screen';
import Direccion from './components/Direcciones/direcciones.screen';
import Notificacion from './components/Notificaciones/notificacion.screen';
// uso de useContext para canasta y notificaciones
import canastaReducer, {
  initialValueCanasta,
} from './components/Context/canastaReducer';
import notifyReducer, {
  initialValueNotify,
} from './components/Context/notifyReducer';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

//Metodo para redireccionar a whatsapp
function renderWhatsapp() {
  let link = 'https://wa.link/zzmge3';
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

//Logo den banner superior
function Logo() {
  return (
    <View style={{marginLeft: normalize(20), marginTop: normalize(5)}}>
      <Image
        source={require('./assets/LogoPrincipe2.png')}
        style={{width: normalize(180), height: normalize(40, 'height')}}
        resizeMode="stretch"
      />
    </View>
  );
}

function Logout({nav}) {
  return (
    <Icon
      iconStyle={{marginRight: normalize(10)}}
      type="evilicon"
      name="external-link"
      size={normalize(40)}
      onPress={() => {
        auth().signOut();
        nav.navigate('login');
      }}
    />
  );
}

function BarraSuperior({nav, params}) {
  const notify = useNotify();
  const BadgedIcon = withBadge(notify.cambios)(Icon);
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: normalize(160),
        marginTop: normalize(10),
        marginRight: normalize(10),
      }}>
      <Icon
        raised
        type="evilicon"
        name="comment"
        size={normalize(20)}
        color={Colors.primary}
        onPress={renderWhatsapp}
      />
      {notify.cambios ? (
        <BadgedIcon
          containerStyle={{margin: 0}}
          raised
          type="evilicon"
          name="bell"
          size={normalize(20)}
          color={Colors.primary}
          onPress={() => {
            nav.navigate('notificacion', {
              id: params.id,
            });
          }}
        />
      ) : (
        <Icon
          raised
          type="evilicon"
          name="bell"
          size={normalize(20)}
          color={Colors.primary}
          onPress={() => {
            nav.navigate('notificacion', {
              id: params.id,
            });
          }}
        />
      )}
      <Icon
        raised
        type="evilicon"
        name="external-link"
        size={normalize(20)}
        color={Colors.primary}
        onPress={() => {
          auth().signOut();
          nav.navigate('loginC');
        }}
      />
    </View>
  );
}

//Inicio de la App
function App() {
  return (
    // uso de useContext para conexión con firebase
    <FirebaseContext.Provider value={{firebase}}>
      <CanastaContext.Provider
        value={useReducer(canastaReducer, initialValueCanasta)}>
        <NotifyContext.Provider
          value={useReducer(notifyReducer, initialValueNotify)}>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="login">
              <Stack.Screen
                name="login"
                component={Login}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="loginC"
                component={LoginC}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="registroDatos"
                component={RegistroDatos}
                options={({navigation}) => ({
                  title: 'Crear Cuenta',
                  headerTitleStyle: {fontSize: normalize(20)},
                  headerLeft: () => (
                    <Icon
                      iconStyle={{marginLeft: normalize(10)}}
                      name="chevron-left"
                      size={normalize(40)}
                      onPress={() => {
                        navigation.navigate('loginC');
                      }}
                    />
                  ),
                })}
              />
              <Stack.Screen
                name="home"
                component={Home}
                options={({navigation}) => ({
                  title: '',
                  headerLeft: () => <Logo />,
                  headerRight: () => <Logout nav={navigation} />,
                })}
              />
              <Stack.Screen
                name="tabs"
                component={Tabs}
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="direccion"
                component={Direccion}
                options={({navigation}) => ({
                  title: 'Editar Direcciones',
                  headerTitleStyle: {fontSize: normalize(20)},
                  headerLeft: () => (
                    <Icon
                      iconStyle={{marginLeft: normalize(10)}}
                      name="chevron-left"
                      size={normalize(40)}
                      onPress={() => {
                        navigation.goBack();
                      }}
                    />
                  ),
                })}
              />
              <Stack.Screen
                name="notificacion"
                component={Notificacion}
                options={({navigation}) => ({
                  title: 'Notificaciones',
                  headerTitleStyle: {fontSize: normalize(20)},
                  headerLeft: () => (
                    <Icon
                      iconStyle={{marginLeft: normalize(10)}}
                      name="chevron-left"
                      size={normalize(40)}
                      onPress={() => {
                        navigation.goBack();
                      }}
                    />
                  ),
                })}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </NotifyContext.Provider>
      </CanastaContext.Provider>
    </FirebaseContext.Provider>
  );
}

//importación de vistas para navegación
function HomeCScreen({route}) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="homeC"
        initialParams={route.params}
        component={HomeC}
        options={({navigation}) => ({
          title: '',
          headerTitleStyle: {fontSize: normalize(20)},
          headerLeft: () => <Logo />,
          headerRight: () => (
            <BarraSuperior nav={navigation} params={route.params} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function ProductosScreen({route}) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="productos"
        component={Productos}
        initialParams={route.params}
        options={({navigation}) => ({
          title: '',
          headerLeft: () => <Logo />,
          headerRight: () => (
            <BarraSuperior nav={navigation} params={route.params} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function CanastaScreen({route}) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="canasta"
        component={Canasta}
        initialParams={route.params}
        options={({navigation}) => ({
          title: '',
          headerLeft: () => <Logo />,
          headerRight: () => (
            <BarraSuperior nav={navigation} params={route.params} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function Tabs({route}) {
  const canasta = useCanasta();
  const BadgedIcon = withBadge(canasta.length)(Icon);
  return (
    <Tab.Navigator
      initialRouteName="canastaTab"
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: 'black',
      }}>
      <Tab.Screen
        name="productosTab"
        component={ProductosScreen}
        initialParams={route.params}
        options={() => ({
          headerShown: false,
          tabBarLabel: 'Productos',
          tabBarIcon: ({color}) => (
            <Icon
              raised
              type="evilicon"
              name="navicon"
              size={normalize(17)}
              color={color}
            />
          ),
        })}
      />
      <Tab.Screen
        name="canastaTab"
        component={CanastaScreen}
        initialParams={route.params}
        options={() => ({
          headerShown: false,
          tabBarLabel: 'Canasta',
          tabBarIcon: ({color}) =>
            canasta.length > 0 ? (
              <BadgedIcon
                containerStyle={{margin: 0}}
                raised
                type="evilicon"
                name="cart"
                size={normalize(17)}
                color={color}
              />
            ) : (
              <Icon
                raised
                type="evilicon"
                name="cart"
                size={normalize(17)}
                color={color}
              />
            ),
        })}
      />
      <Tab.Screen
        name="homeTab"
        component={HomeCScreen}
        initialParams={route.params}
        options={() => ({
          headerShown: false,
          tabBarLabel: 'Perfil',
          tabBarIcon: ({color}) => (
            <Icon
              raised
              type="evilicon"
              name="user"
              size={normalize(17)}
              color={color}
            />
          ),
        })}
      />
    </Tab.Navigator>
  );
}

export default App;
