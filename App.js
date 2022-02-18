import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Button,
  TextInput,
} from "react-native";

import RNBluetoothClassic, {
  BluetoothDevice,
} from "react-native-bluetooth-classic";

export default function App() {
  const [device, setDevice] = useState();
  const [mensaje, setMensaje] = useState("EXITMODBUS");
  const [dataRecibida, setDataRecibida] = useState();
  useEffect(() => {
    startDiscovery();
    setTimeout(() => {
      cancelDiscovery();
    }, 4000);
  }, []);

  const startDiscovery = async () => {
    let granted = await requestAccessFineLocationPermission();
    if (granted) {
      try {
        console.log("Busco dispositivos...");
        let unpaired = await RNBluetoothClassic.startDiscovery();
        unpaired.map((item) => {
          console.log("Name:", item.name, "Address:", item.address);
          if (item.address === "98:F4:AB:19:D9:92") {
            setDevice(item);
          }
        });
        console.log("startDiscovery:", unpaired.length);
        return unpaired;
      } catch (err) {
        // Error if Bluetooth is not enabled
        // Or there are any issues requesting paired devices
        console.log("startDiscovery error:", err);
        throw err;
      }
    } else {
      throw "Access fine location was not granted";
    }
  };

  const cancelDiscovery = async () => {
    try {
      let cancelled = await RNBluetoothClassic.cancelDiscovery();
      //console.log("getBondedDevices:", paired);
      console.log("cancelDiscovery:", cancelled);
      return cancelled;
    } catch (err) {
      // Error if Bluetooth is not enabled
      // Or there are any issues requesting paired devices
      console.log("cancelDiscovery error:", err);
      throw err;
    }
  };

  const requestAccessFineLocationPermission = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Access fine location required for discovery",
        message:
          "In order to perform discovery, you must enable/allow " +
          "fine location access.",
        buttonNeutral: 'Ask Me Later"',
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const connect = async () => {
    console.log("Connect");
    await device.connect({
      CONNECTOR_TYPE: "rfcomm",
      delimiter: "",
      DEVICE_CHARSET: Platform.OS === "ios" ? 1536 : "utf-8",
    });
    const connectando = await RNBluetoothClassic.connectToDevice(
      device.address
    );
    console.log("Se conecto?", connectando);
  };

  const send = async () => {
    await RNBluetoothClassic.writeToDevice(device.address, mensaje, "utf-8");
    let available = await device.available();
    if (available > 0) {
      let data = await device.read();
      console.log("DATA->", data);
    }
    readSubscription = device.onDataReceived((data) => onReceivedData(data));
    console.log("available->", available);
  };

  const onReceivedData = async (data) => {
    try {
      console.log(
        "--------------------------------------------------------------------"
      );
      console.log("DATA RECIBIDA->", data.data);
      console.log(
        "--------------------------------------------------------------------"
      );
      setDataRecibida(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="CONECTAR" onPress={connect} />
      <TextInput placeholder="SEND HYPER" onChangeText={(m) => setMensaje(m)} />
      <Button title="SEND" onPress={send} />
      <StatusBar style="auto" />
      <Text style={styles.text}>{dataRecibida}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#000",
  },
});
