import React from "react";
import firebase, { FirebaseContext } from "./firebase";
import auth from "@react-native-firebase/auth";
import { View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { Image, Icon } from "react-native-elements";
import normalize from "react-native-normalize";
// Se importan los screens para crear la navegación
import Login from "./components/Login/login.screen";
import Home from "./components/Home/home.screen";
import { Provider, useDispatch } from "react-redux";
import store from "./redux/store";
import { logout } from "./redux/reducers/usuariosReducer";

const Stack = createStackNavigator();

//Logo den banner superior
function Logo() {
  return (
    <View style={{ marginLeft: normalize(20), marginTop: normalize(5) }}>
      <Image
        source={require("./assets/LogoPrincipe2.png")}
        style={{ width: normalize(180), height: normalize(40, "height") }}
        resizeMode="stretch"
      />
    </View>
  );
}

function Logout({ nav }) {
  const dispatch = useDispatch();

  return (
    <Icon
      iconStyle={{ marginRight: normalize(10) }}
      type="evilicon"
      name="external-link"
      size={normalize(40)}
      onPress={() => {
        dispatch(logout());
        auth().signOut();
        nav.navigate("login");
      }}
    />
  );
}

//Inicio de la App
function App() {
  return (
    // uso de useContext para conexión con firebase
    <FirebaseContext.Provider value={{ firebase }}>
      <Provider store={store}>
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
              name="home"
              component={Home}
              options={({ navigation }) => ({
                title: "",
                headerLeft: () => <Logo />,
                headerRight: () => <Logout nav={navigation} />,
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Provider>
    </FirebaseContext.Provider>
  );
}

export default App;
