
ANYWAYS.tree = {
    create: function (map, start, profile, color1, max) {
        var me = this;

        //var max = 450;
        var requestId = 0;
        var layers = [];
        var routeLayers = [];
        var edgesMap = {};
        var idx = 0;
        //var color1 = '0000FF';
        //var color2 = '00FFFF';
        var color3 = 'FFFFFF';

        me.profile = profile;
        me.report = function (edgeId) {
            if (me.onOverEdge) {
                me.onOverEdge(edgeId);
            }
        };

        me.resetRoute = function () {
            // removes the current route layers.
            if (routeLayers) {
                for (var i = 0; i < routeLayers.length; i++) {
                    map.removeLayer(routeLayers[i]);
                }
            }
        };

        me.selectEdge = function (edgeId) {
            // removes the current route layers.
            for (var i = 0; i < routeLayers.length; i++) {
                map.removeLayer(routeLayers[i]);
            }

            var routeEdge = edgesMap[edgeId];
            var routeEdgeShape = [];
            while (routeEdge) {
                for (var i = routeEdge.shape.length - 1; i >= 0; i--) {
                    routeEdgeShape.unshift(routeEdge.shape[i]);
                }

                routeEdge = edgesMap[routeEdge.previousEdgeId];
            }

            var edgeLineString = {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": routeEdgeShape
                }
            };

            routeLayers.push(L.geoJson(edgeLineString, {
                style: function (feature) {
                    //if (feature.properties && feature.properties.weight1) {
                    //var ratio = 1; //feature.properties.weight1 / max;
                    var color = '#' + color1; // '#' + gradient(0.75);
                    var weight = 7; // * (1 - ratio);
                    return {
                        weight: weight,
                        color: color,
                        opacity: 0.7
                    };
                    //}
                }
            }).addTo(map));
        };

        var gradient2 = function  (color1, color2, ratio) {
            var hex = function (x) {
                x = x.toString(16);
                return (x.length == 1) ? '0' + x : x;
            };

            var r = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
            var g = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
            var b = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));

            return hex(r) + hex(g) + hex(b);
        };

        var gradient = function (ratio) {
            //if (ratio > 0.6)
            //{
            //    return gradient2(color1, color2, (ratio - 0.6) / 0.4);
            //}
            return gradient2(color1, color3, ratio);
        };

        var requestRoute = function (loc) {
            if (marker) {
                map.removeLayer(marker);
            }

            marker = L.marker(loc, {
                //draggable: true,
                icon: L.icon({
                    iconUrl: 'images/marker-source.png',
                    iconAnchor: [12, 35],
                    iconSize: [25, 35],
                    shadowUrl: 'images/marker-shadow.png'
                })
            }).addTo(map);

            ANYWAYS.api.tree('http://analytics-api.anyways.eu/europe', {
                profile: profile,
                locations: [{
                    lat: loc.lat,
                    lon: loc.lng
                }],
                max: max
            }, function (response, currentId, options) {
                requestId++;
                var localRequestId = requestId;

                // removes the current layers.
                for (var i = 0; i < layers.length; i++) {
                    map.removeLayer(layers[i]);
                }
				
                // build the map.
                for (var i = 0; i < response.edges.length; i++) {
                    edgesMap[response.edges[i].edgeId] = response.edges[i];
                }

                idx = 0;
                var stepTime = 1500.0 / response.edges.length;
                var animation = function () {
                    var c = 20 * (idx / response.edges.length) + 1;
                    while(c > 0) {		
                        if (idx < response.edges.length) {
                            if (requestId == localRequestId) {
                                var edge = response.edges[idx];
                                var edgeLineString = {
                                    "type": "Feature",
                                    "properties": {
                                        "weight1": edge.weight1,
                                        "weight2": edge.weight2,
                                        "edgeId": edge.edgeId
                                    },
                                    "geometry": {
                                        "type": "LineString",
                                        "coordinates": edge.shape
                                    }
                                };
							
                                layers.push(L.geoJson(edgeLineString, {
                                    style: function (feature) {
                                        if (feature.properties && feature.properties.weight1) {
                                            var ratio = feature.properties.weight1 / max;
                                            var color = '#' + gradient(ratio);
                                            var weight = 4 * (1 - ratio);
                                            return {
                                                weight: weight,
                                                color: color,
                                                opacity: 0.8
                                            };
                                        }
                                    },
                                    onEachFeature: function (feature, layer) {
                                        layer.on("mouseover", function (e) {
                                            console.log('Mouseover on ' + me.profile);
                                            me.report(feature.properties.edgeId);
                                            me.selectEdge(feature.properties.edgeId);
                                        });
                                    }
                                }).addTo(map));
                            }
                        }
                        c--;
                        idx++;
                    }
                    if (idx < response.edges.length) {
                        setTimeout(function () {
                            animation();
                        }, stepTime);
                    }
                };
                animation();

                //treeLayer = L.geoJson(response, {
                //    style: function(feature) {
                //        if (feature.properties && feature.properties.start_weight) {
                //            var ratio = feature.properties.start_weight / max;
                //            var color = '#' + gradient(ratio);
                //            var weight = 4 * (1 - ratio);
                //            return {
                //                weight: weight,
                //                color: color,
                //                opacity: 1
                //            };
                //        }
                //    }
                //}).addTo(map);
            }, function (response, currentId, options) {
                console.log('ERROR:' + response);
            }, this);
        };

        map.on('click', function (e) {
            var loc = e.latlng;

            // removes the current layers.
            if (layers) {
                for (var i = 0; i < layers.length; i++) {
                    map.removeLayer(layers[i]);
                }
            }

            // removes the current route layers.
            if (routeLayers) {
                for (var i = 0; i < routeLayers.length; i++) {
                    map.removeLayer(routeLayers[i]);
                }
            }

            idx = 1000000;

            requestRoute(loc);
        });

        requestRoute(start);

        return me;
    }
};