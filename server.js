const path = require('path');
const express = require('express');

history = {};
let client = require('mqtt').connect('wss://broker.emqx.io:8084/mqtt')
  .on('connect', () => client.subscribe('Kettle/#'))
  .on('message', (topic, message) => {
    const key = topic.substring(topic.indexOf("/") + 1);
    if (history[key] === undefined)
      history[key] = [];
    history[key].push({ timestamp: Date.now(), value: parseFloat(message), id: key });
  });

let history_router = express.Router();
history_router.get('/:pointId', (req, res) => {
  const start = +req.query.start;
  const end = +req.query.end;
  const ids = req.params.pointId.split(',');
  const response = ids.reduce((resp, id) => resp.concat(history[id].filter(p => p.timestamp > start && p.timestamp < end)), []);

  res.status(200).json(response).end();
});

let telemetry_router = express.Router();
telemetry_router.use(express.static(path.join(__dirname, 'build', 'telemetry')));
telemetry_router.get('/', (req, res) => res.sendFile('index.html'));
telemetry_router.get('/keys', (req, res) => res.send(Object.keys(history)));
telemetry_router.use('/history', history_router);

let app = express();
const port = process.env.PORT || 8080;
app.use('/telemetry', telemetry_router);
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => res.sendFile('index.html'));
app.listen(port, () => console.log("Server listening on port " + port));