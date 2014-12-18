var JSON = JSON || {};

JSON.stringify = JSON.stringify || function(obj) {
    var t = typeof (obj);
    if (t != "object" || obj === null) {
        if (t == "string") obj = '"' + obj + '"';
        return String(obj);
    } else {
        var n, v, json = [], arr = (obj && obj.constructor == Array);

        for (n in obj) {
            v = obj[n];
            t = typeof(v);
            if (t == "string") v = '"' + v + '"';
            else if (t == "object" && v !== null) v = JSON.stringify(v);
            json.push((arr ? "" : '"' + n + '":') + String(v));
        }

        return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
    }
};

JSON.parse = JSON.parse || function(str) {
    if (str === "") str = '""';
    eval("var p=" + str + ";");
    return p;
};


//######################################################
// cometClient
//################################(Brainfuckers code)###

var cometClient = function(server, anonymous) {
    var self = this;

    /// PRIVATE
    var reciveCallback = null;

    /// CONSTRUCTOR
    if (!server && typeof(server) != 'string') {
        var err = new Error();
        err.name = 'Wrong argument';
        err.message = 'comet(server), server should be an string';

        throw(err);
    }

    if (cometClient.responding == null) {
        cometClient.connections = {};
        cometClient.connectionsCount = 0;
        cometClient.responding = true;
    }

    if (!anonymous) {
        var session = '';
        while (session.length < 40) session += Math.ceil(Math.random() * 16).toString(16).toUpperCase();
    } else {
        var session = cometClient.connectionsCount++;
    }

    cometClient.connections[session] = {
        open: false,
        callback: function(response) {
            console.log('callback');

            self.open = false;

            if (response['f']) reciveCallback(response['d']);
            if (response['d']['_system']) {
                if (response['d']['act'] == 'changeUid') {
                    console.log('changeUid');
                    console.log(session);
                    console.log(cometClient.connections);

                    cometClient.connections[response['d']['uid']] = cometClient.connections[session];
                    delete cometClient.connections[session];
                    session = response['d']['uid'];

                    console.log(cometClient.connections);
                }
            }
            if (!self.open) {
                self.send({ '_system': true, 'act': 'reconnect' });
            }
        },
        reconnect: function() {
            self.open = false;
            self.send({ '_system': true, 'act': 'reconnect' });
        }
    };

    /// PUBLIC
    this.send = function(info) {
        var finish = true;
        var sendingData = info != null ? JSON.stringify(info) : '';

        var data = {
            'f': finish,
            'd': sendingData
        };

        if (!anonymous)
            data['s'] = session;

        this.open = true
        cometClient.request(server, cometClient.toQuery(data));
    };

    this.connect = function(data) {
        this.send({ '_system': true, 'act': 'connect', 'data': data });
        return this;
    };

    this.disconnect = function(data) {
        this.send({ '_system': true, 'act': 'disconnect', 'data': data });
        return this;
    };

    this.onRecieve = function(callback) {
        if (typeof(callback) == 'function') {
            reciveCallback = callback;
        } else {
            var err = new Error();
            err.name = 'Wrong argument';
            err.message = 'onRecive(callback), callback should be an function';

            throw(err);
        }
    };
}

cometClient.toQuery = function(data) {
    if (typeof(data) == 'string')
        return data;

    var out = [];
    for (i in data) {
        out.push(i + '=' + data[i]);
    }

    return out.join('&');
}

cometClient.request = function(baseUrl, data) {
    function foreignRequest(url, data) { // Cross domain request
        if (data != '') data += '&';
        data += '_comet=1';

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url + '?' + data;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    function ajaxRequest(url, data) {
        if (cometClient.httpRequest == null) {
            if (navigator.appName == "Microsoft Internet Explorer") {
                cometClient.httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } else {
                cometClient.httpRequest = new XMLHttpRequest();
            }
        }

        if (url.indexOf('?') != -1)
            url += '&_comet=1';
        else
            url += '?_comet=1';

        cometClient.httpRequest.open("POST", url, true);
        cometClient.httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        cometClient.httpRequest.setRequestHeader("Connection", "close");

        cometClient.httpRequest.onreadystatechange = function() {
            if (cometClient.httpRequest.readyState == 4) {
                if (cometClient.httpRequest.responseText != null && cometClient.httpRequest.responseText != '') {
                    try {
                        eval(cometClient.httpRequest.responseText);
                    } catch (e) {
                        setTimeout(function() {
                            cometClient.request(baseUrl, data);
                        }, 10000);
                    }
                }
            }
        };

        cometClient.httpRequest.send(data);
    }

    if (baseUrl.indexOf('http://') == -1) {
        ajaxRequest(baseUrl, data);
    } else {
        foreignRequest(baseUrl, data);
    }
};