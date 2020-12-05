'use strict';


(function(window) {
    /**
     * Create an XMLHTTPRequest for the specified URL with the specified request body
     *
     * @param url {string}
     * @param body {object}
     * @param successCallback {function}
     * @param failureCallback {function}
     * @param method {string=}
     */
    function request(url, body, successCallback, failureCallback, method) {
        method = method ? method : request.METHODS.POST;

        if (method === request.METHODS.GET && body)
            url += _getQueryString();

        const req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    let json = req.responseText;
                    try {
                        json = JSON.parse(req.responseText);
                    } catch (e) {}

                    if (json.success !== true)
                        return failureCallback({result: json, status: this.status});

                    successCallback(json);
                } else
                    failureCallback({result: req.responseText, status: this.status});
            }
        };

        req.open(method, url, true);
        req.setRequestHeader('Content-Type', 'application/json');
        req.send(JSON.stringify(body));

        function _getQueryString() {
            const objectKeys = Object.keys(body);

            // if the object is empty, skip creating a query string
            if (objectKeys.length === 0)
                return '';

            let queryString = '?';
            objectKeys.forEach((key) => {
                queryString += `${key}=${body[key]}&`;
            });

            // strip the last & off the query string
            const lastIndex = queryString.lastIndexOf('&');
            if (lastIndex !== -1)
                queryString = queryString.slice(0, lastIndex);

            return queryString;
        }
    }

    /**
     * The same API, but it returns a promise
     * @param url {string}
     * @param body {object}
     * @param method {string}
     * @return {Promise<any>}
     */
    function requestPromise(url, body, method) {
        return new Promise((resolve, reject) => {
            request(url, body, resolve, reject, method);
        });
    }

    /**
     * File upload request - specifically for sending files along with a progress bar
     * @param url {string}
     * @param file {File}
     * @param progressCallback {function}
     * @param successCallback {function}
     * @param failureCallback {function}
     */
    function uploadRequest(url, file, progressCallback, successCallback, failureCallback) {
        const data = new FormData();
        data.append('image-file', file);

        const req = new XMLHttpRequest();

        // call the progressCallback when we have a progress update
        req.upload.addEventListener("progress", e => {
            if (!e.lengthComputable)
                return;

            const percentage = Math.round((e.loaded * 100) / e.total);
            progressCallback(percentage);
        });

        // needed to make sure that progress eventually makes it to 100%
        req.upload.addEventListener(EVENTS.LOAD, () => {
            progressCallback(100);
        });

        req.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let json = req.responseText;
                try {
                    json = JSON.parse(req.responseText);
                } catch (e) {}

                if (json.success !== true)
                    return failureCallback({result: json, status: this.status});

                successCallback(json);
            } else if (this.readyState === 4)
                failureCallback({result: req.responseText, status: this.status});
        };

        req.open(request.METHODS.POST, url);
        req.send(data)
    }

    request.METHODS = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        DELETE: 'DELETE'
    };

    window.request = request;
    window.requestPromise = requestPromise;
    window.uploadRequest = uploadRequest;
})(window);
