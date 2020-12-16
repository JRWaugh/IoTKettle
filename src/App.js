import React, { useState } from 'react';
import './App.css';
import greenTea from './Images/green tea.png'
import blackTea from './Images/black tea.png'
import coffeePic from './Images/coffee.png'
import whiteTea from './Images/white tea.png'
import oolongTea from './Images/oolong tea.png'
import manual from './Images/manual.png'
import Button from './Components/Button'
import Temperature from './Components/Temperature'
import State from './Components/State'
import Water from './Components/Water'
import start from './Images/start.png'
import graph from './Images/graph.png'
import Dropdown from 'react-dropdown'
import 'react-dropdown/style.css'

const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);
const client = require('mqtt').connect('wss://broker.emqx.io:8084/mqtt', {
  keepalive: 60,
  clientId: clientId,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000
});

client.on('connect', () => {
  console.log('Client connected:' + clientId)
  client.subscribe('Kettle/#')
})

client.on('reconnect', () => console.log('Reconnecting...'))

client.on('error', err => {
  console.log('Connection error: ', err)
  client.end()
});

const App = () => {
  const [state, setState] = useState('Off')
  const [temp, setTemp] = useState(0)
  const [weight, setWeight] = useState(0)
  const [toTemp, setToTemp] = useState(0)
  const [song, setSong] = useState(0)
  const manualTemp = () => {
    const manualTemp = parseInt(prompt("Enter the temperature: "));
    if (manualTemp) {
      if (manualTemp > temp && manualTemp <= 100) {
        setToTemp(manualTemp)
      } else if (manualTemp < temp) {
        alert("The entered temperature is lower than the current water temperature")
      } else if (manualTemp > 100) {
        setToTemp(100)
      }
    }
  };
  const startKettle = () => {
    if (state === 'On') {
      if (toTemp > temp && weight > 10) {
        if (window.confirm("Are you sure you wish to heat the water to " + toTemp + "°C?")) {
          client.publish('Kettle/HeatTemp', toTemp.toString());
          client.publish('Kettle/Song', song.toString());
          console.log('song %d', song);
          console.log('Starting kettle');
          setState('Ready'); // Unsure 
        }
      } else if (toTemp <= temp) {
        alert("The water temperature is currently higher than the temperature you wish to heat the water to!")
      } else if (weight < 10) {
        alert("There currently isn't enough water in the kettle to safely heat")
      }
    } else if (state === 'Boiling') {
        alert("The kettle is already heating!");
    } else if (state === 'Off') {
      alert("No connection");
    }
  };

  const songOptions = ['Default', 'FF Victory', 'Song of Time', 'Super Mario Theme'];

  client.on('message', (topic, message) => {
    switch (topic) {
      case 'Kettle/Connected':
        const connected = (message.toString() === 'true');
        if (connected) {
          setState('On');
        } else {
          setState('Off');
        }
        break;

      case 'Kettle/State':
        if (parseInt(message) === 1)
          setState('Boiling');
        else 
          setState('On');
        break;

      case 'Kettle/Temperature':
        const tempTemp = parseInt(message)
        if (tempTemp !== temp) {
          setTemp(tempTemp);
          console.log(`Kettle temp changed to ${tempTemp}`);
        }
        break;

      case 'Kettle/Weight':
        const tempWeight = parseInt(message)
        if (tempWeight !== weight) {
          setWeight(tempWeight)
          console.log(`Kettle weight changed to ${tempWeight}`);
        }
        break;

      default:
        console.log(`No handler for topic ${topic}`);
    }
  });

  return (
    <div className="App">
      <h1>IoT Kettle</h1>
      <Button text='Green Tea' handleClick={() => setToTemp(80)} image={greenTea} />
      <Button text='Black Tea' handleClick={() => setToTemp(100)} image={blackTea} />
      <Button text='White Tea' handleClick={() => setToTemp(70)} image={whiteTea} />
      <Button text='Oolong Tea' handleClick={() => setToTemp(85)} image={oolongTea} />
      <Button text='Instant Coffee' handleClick={() => setToTemp(94)} image={coffeePic} />
      <Button text='Set Temperature' handleClick={manualTemp} image={manual} />
      <State text='Kettle state' value={state} />
      <Temperature text='Current temp' value={temp} scale='°C' />
      <Temperature text='Set temp' value={toTemp} scale='°C' />
      <Water text='Water Level' value={weight} />
      <b>Choose song: </b><br />
      <Dropdown options={songOptions} onChange={option => setSong(songOptions.indexOf(option.value, 0))} value={songOptions[0]} placeholder="Choose Song" /><br />
      <Button text='Start' handleClick={startKettle} image={start} />
      <p align="left">--Telemetry--<br />
        <a href='/telemetry' rel="noopener noreferrer" target="_blank"><img src={graph} alt="Telemetry" /></a></p>
    </div>
  );
}

export default App;
