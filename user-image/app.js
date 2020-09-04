const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const pty = require('node-pty');

const app = express();

app.use(cors())

expressWs(app);

let terminals = {}, logs = {};
app.post('/terminals', (req, res) => {
    const env = Object.assign({}, process.env);
    env['COLORTERM'] = 'truecolor';

    const userID = 2; // UserID of User

    const cols = parseInt(req.query.cols),
        rows = parseInt(req.query.rows),
        term = pty.spawn('bash', [], {
            name: 'xterm-256color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: env.PWD,
            env: env,
            encoding: null,
            uid: userID
        });

    console.log('Created terminal with PID: ' + term.pid);
    terminals[term.pid] = term;
    logs[term.pid] = ""
    term.on('data', function(data) {
        logs[term.pid]+=data;
    });
    res.send(term.pid.toString());
    res.end();
});

app.post('/terminals/:pid/size', (req, res) => {
    const pid = parseInt(req.params.pid),
        cols = parseInt(req.query.cols),
        rows = parseInt(req.query.rows),
        term = terminals[pid];

    term.resize(cols, rows);
    console.log('Resized terminal ' + pid + ' to ' + cols + ' cols and ' + rows + ' rows.');
    res.end();
});

app.ws('/terminals/:pid', function (ws, req) {
    let term = terminals[parseInt(req.params.pid)];
    console.log('Connected to terminal ' + term.pid);
    ws.send(logs[term.pid]);

    // binary message buffering
    function bufferUtf8(socket, timeout) {
        let buffer = [];
        let sender = null;
        let length = 0;
        return (data) => {
            buffer.push(data);
            length += data.length;
            if (!sender) {
                sender = setTimeout(() => {
                    socket.send(Buffer.concat(buffer, length));
                    buffer = [];
                    sender = null;
                    length = 0;
                }, timeout);
            }
        };
    }
    const send = bufferUtf8(ws, 5);

    term.on('data', function(data) {
        try {
            send(data);
        } catch (ex) {
            // The WebSocket is not open, ignore
        }
    });
    ws.on('message', function(msg) {
        term.write(msg);
    });
    ws.on('close', function () {
        term.kill();
        console.log('Closed terminal ' + term.pid);
        // Clean things up
        delete terminals[term.pid];
        delete logs[term.pid];
    });
});

const port = process.env.PORT || 8888
app.listen(port, '0.0.0.0', ()=>{
    console.log(`Listening at 0.0.0.0:${port}`)
})