// API MANAGEMENT.
// an interface to the ANYWAYS-API.

ANYWAYS.api = {
    id: 1,

    // sends a request to get an instance for a given date.
    schedule: function(url, options, callback, error, context)
    {
        // increase request id.
        this.id++;

        var time = options.time;

        var requestString = 'schedule/' + time + '?callback=%jsonp';

        // execute JSONP request.
        var currentId = this.id;
        if (options.id) { // override id to group multiple requests.
            currentId = options.id;
        } else {
            options.id = this.id;
        }

        ANYWAYS.JSONP.call(
			url + requestString,
			function (response) { // success.
			    $.proxy(callback, context)(response, currentId, options);
			},
			function (response) { // timeout.
			    $.proxy(error, context)(response, currentId, options);
			},
			ANYWAYS.DEFAULTS.JSONP_TIMEOUT,
			'instance' + this.id,
			{}
		);
    },

    // sends a requests for multimodal route.
    multimodal: function (url, options, callback, error, context) {
        // increase request id.
        this.id++;

        // vehicles, time, locations, 
        var profiles = options.profiles;
        var time = options.time;
        var locations = options.locations;
        var locationTimes = options.locationTimes;

        var requestString = '/multimodal?callback=%jsonp';
        // add vehicle parameter.
        requestString += '&profile=' + profiles[0];
        for (var i = 1; i < profiles.length; i++) {
            requestString = requestString + '|' + profiles[i];
        }
        // add time parameter.
        requestString = requestString + '&time=' + time.getFullYear() + ANYWAYS.Utils.pad(time.getMonth() + 1, 2) + ANYWAYS.Utils.pad(time.getDate(), 2) + ANYWAYS.Utils.pad(time.getHours(), 2) + ANYWAYS.Utils.pad(time.getMinutes(), 2);
        for (var i = 0; i < locations.length; i++) {
            requestString += '&loc=' + locations[i].lat.toFixed(6) + ',' + locations[i].lon.toFixed(6);
        }
        // add custom location times.
        if (locationTimes) {
            for (var i = 0; i < locationTimes.length; i++) {
                requestString += '&locTime=' + locationTimes[i].toFixed(0);
            }
        }

        // add type (if any).
        if (options.type) {
            requestString += '&type=' + options.type;
        }

        // add instructions.
        requestString = requestString + '&instructions=true';

        // execute JSONP request.
        var currentId = this.id;
        if (options.id) { // override id to group multiple requests.
            currentId = options.id;
        } else {
            options.id = this.id;
        }

        ANYWAYS.JSONP.call(
			url + requestString,
			function (response) { // success.
			    $.proxy(callback, context)(response, currentId, options);
			},
			function (response) { // timeout.
			    $.proxy(error, context)(response, currentId, options);
			},
			ANYWAYS.DEFAULTS.JSONP_TIMEOUT,
			'route' + this.id,
			{}
		);
    },

    // sends a requests for multimodal route.
    routing: function (url, options, callback, error, context) {
        // increase request id.
        this.id++;

        var requestString = '/routing?callback=%jsonp';

        // add vehicle parameter.
        requestString += '&profile=' + options.profile;

        // add locations.
        var locations = options.locations
        for (var i = 0; i < locations.length; i++) {
            requestString += '&loc=' + locations[i].lat.toFixed(6) + ',' + locations[i].lon.toFixed(6);
        }

        // add type (if any).
        if (options.type) {
            requestString += '&type=' + options.type;
        }

        // execute JSONP request.
        var currentId = this.id;
        if (options.id) { // override id to group multiple requests.
            currentId = options.id;
        }
        ANYWAYS.JSONP.call(
            url + requestString,
            function (response) { // success.
                $.proxy(callback, context)(response, currentId, options);
            },
            function (response) { // timeout.
                $.proxy(error, context)(response, currentId, options);
            },
            ANYWAYS.DEFAULTS.JSONP_TIMEOUT,
            'route' + this.id,
            {}
        );
    },

    // sends a requests for multimodal route.
    alongjustone: function (url, options, callback, error, context) {
        // increase request id.
        this.id++;

        var requestString = '/alongjustone?callback=%jsonp';
        // add vehicle parameter.
        var profiles = options.profiles;
        requestString += '&profiles=' + profiles[0];
        for (var i = 1; i < profiles.length; i++) {
            requestString = requestString + '|' + profiles[i];
        }
        // add locations.
        var locations = options.locations;
        for (var i = 0; i < locations.length; i++) {
            requestString += '&loc=' + locations[i].lat.toFixed(6) + ',' + locations[i].lon.toFixed(6);
        }

        requestString += '&instructions=true';

        // execute JSONP request.
        var currentId = this.id;
        ANYWAYS.JSONP.call(
            url + requestString,
            function (response) { // success.
                $.proxy(callback, context)(response, currentId, options);
            },
            function (response) { // timeout.
                $.proxy(error, context)(response, currentId, options);
            },
            ANYWAYS.DEFAULTS.JSONP_TIMEOUT,
            'route' + this.id,
            {}
        );
    },

    // sends a request to calculate a tree.
    tree: function(url, options, callback, error, context) {
        // increase request id.
        this.id++;

        var requestString = '/tree';

        // add vehicle parameter.
        requestString += '?profile=' + options.profile;

        // add max.
        if (options.max) {
            requestString += '&max=' + options.max;
        }

        // add locations.
        var locations = options.locations
        for (var i = 0; i < locations.length; i++) {
            requestString += '&loc=' + locations[i].lat.toFixed(6) + ',' + locations[i].lon.toFixed(6);
        }

        // execute JSONP request.
        var currentId = this.id;
        if (options.id) { // override id to group multiple requests.
            currentId = options.id;
        }

        $.ajax({
            type: 'GET',
            url: url + requestString,
            callback: '',
            dataType: "jsonp"
        }).done(function (response) {
            callback(response);
          });
        //ANYWAYS.JSONP.call(
        //    url + requestString,
        //    function (response) { // success.
        //        callback(response, currentId, options);
        //    },
        //    function (response) { // timeout.
        //        error(response, currentId, options);
        //    },
        //    ANYWAYS.DEFAULTS.JSONP_TIMEOUT,
        //    'route' + this.id,
        //    {}
        //);
    },

    // sorts a route, segments based on time property and points are added at the end.
    // assumes a geojson feature collection
    sort: function (route) {
        if(route &&
           route.features)
        {
            route.features.sort(function (x, y) {
                if(x.geometry.type == "Point" &&
                   y.geometry.type == "Point")
                {
                    return 0;
                }
                else if(x.geometry.type == "Point")
                {
                    return 1;
                }
                else if(y.geometry.type == "Point")
                {
                    return -1;
                }
                else if(x.geometry.type == "LineString" &&
                    y.geometry.type == "LineString")
                {
                    if('time' in x.properties && 
                       'time' in y.properties) {
                        return x.properties.time - y.properties.time;
                    }
                }
                return x.geometry.type.localeCompare(y.geometry.type);
            });
        }
    },

    // adds an extra property per linestring representing duration. assumed that the features are already sorted by time.
    addDuration: function (route) {
        var previousTime = 0;
        for (var i = 0; i < route.features.length; i++) {
            var feature = route.features[i];
            
            if(feature.geometry.type == "LineString" &&
               'time' in feature.properties) {
                feature.properties.duration = feature.properties.time - previousTime;
                previousTime = feature.properties.time;
            }
        }
    }
};