import React, { useState, useEffect } from "react";
import { setStatusBarBackgroundColor, StatusBar } from "expo-status-bar";
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

  const toHex = (hexString) => {
    let hex = hexString.toString();
    let str = " ";
    for (let i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  };

  const startDiscovery = async () => {
    let granted = await requestAccessFineLocationPermission();
    if (granted) {
      try {
        console.log("Busco dispositivos...");
        let unpaired = await RNBluetoothClassic.startDiscovery();
        unpaired.map((item) => {
          console.log("Name:", item.name, "Address:", item.address);
          if (item.address === "40:F5:20:7C:6A:F6") {
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
      CONNECTOR_TYPE: "",
      delimiter: "",
      DEVICE_CHARSET: Platform.OS === "ios" ? 1536 : "utf-8",
    });
    const connectando = await RNBluetoothClassic.connectToDevice(
      device.address
    );
    console.log("Se conecto?", connectando);
    readSubscription = device.onDataReceived((data) => onReceivedData(data));
  };

  const send = async () => {
    try {
      await RNBluetoothClassic.writeToDevice(device.address, mensaje, "utf-8");
    } catch (error) {
      console.log("error Send" + error);
    }
  };

  const onReceivedData = async (data) => {
    try {
      let buff = Buffer(data.data);
      console.log(buff);
      // let vabuf = Buffer(data.data);
      // let length = vabuf.buffer.byteLength;
      // for (let i = 0; i < length; i++) {
      //   console.log(`Buf ${i}-> ${vabuf[i]}`);
      // }

      // console.group("RECIBIDO");
      // console.log(buf);
      //let bE = buf.readInt16BE(2);
      //console.log("Big Endian->", bE);
      // console.groupEnd("RECIBIDO");
    } catch (error) {
      console.log(error);
    }
  };
  const sendBufferOneWrite = async () => {
    let buffer = Buffer.alloc(8);
    //buffer = "01 06 00 00 00 00 00 00";
    //buffer.write("01" + "03" + "00" + "00" + "00" + "21" + "00" + "00", "hex");
    buffer.write("01" + "06" + "00" + "00" + "00" + "00" + "00", "hex");
    console.log("ENVIADO->", buffer);
    await RNBluetoothClassic.writeToDevice(device.address, buffer, "hex");
    // let available = await device.available();
    // if (available > 0) {
    //   let data = await device.read();
    //   console.log("DATA->", data.toString());
    // }
  };
  const bufferFrom0_33 = async () => {
    let buffer = Buffer.alloc(8);
    buffer.write("01" + "03" + "00" + "00" + "00" + "21" + "00" + "00", "hex");
    console.log("ENVIADO->", buffer.toString("hex"));
    // await device.write(buffer);
    await RNBluetoothClassic.writeToDevice(device.address, buffer, "hex");
    let available = await device.available();
    if (available > 0) {
      let data = await device.read();
      console.log("DATA->", data.toString("hex"));
    }
    console.log("available->", available);
  };
  const bufferFrom33_16 = async () => {
    let buffer = Buffer.alloc(8);
    buffer.write("01" + "03" + "00" + "4C" + "00" + "10" + "00" + "00", "hex");
    await RNBluetoothClassic.writeToDevice(device.address, buffer, "hex");
    let available = await device.available();
    if (available > 0) {
      let data = await device.read();
      console.log("DATA->", data.toString());
    }
    console.log("available->", available);
  };
  return (
    <View style={styles.container}>
      <Button title="CONECTAR" onPress={connect} />
      <TextInput placeholder="SEND HYPER" onChangeText={(m) => setMensaje(m)} />
      <Button title="SEND" onPress={send} />
      <Button title="BUFFER ONE WRITE" onPress={sendBufferOneWrite} />
      <Button title="READ FROM 0, 33" onPress={bufferFrom0_33} />
      <Button title="READ FROM 33, 16" onPress={bufferFrom33_16} />
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
