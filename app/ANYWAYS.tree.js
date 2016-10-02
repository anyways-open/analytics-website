
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

        me.index = new rbush();

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
            var consideredEdgeMap = {};
            while (routeEdge) {
                for (var i = routeEdge.shape.length - 1; i >= 0; i--) {
                    routeEdgeShape.unshift(routeEdge.shape[i]);
                }

                consideredEdgeMap[routeEdge.edgeId] = true;
                if (consideredEdgeMap[routeEdge.previousEdgeId] === true) {
                    break;
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

        //var gradient2 = function  (color1, color2, ratio) {
        //    var hex = function (x) {
        //        x = x.toString(16);
        //        return (x.length == 1) ? x + x : x;
        //    };

        //    var r = Math.ceil(parseInt(color1.substring(0, 2), 16) * ratio + parseInt(color2.substring(0, 2), 16) * (1 - ratio));
        //    var g = Math.ceil(parseInt(color1.substring(2, 4), 16) * ratio + parseInt(color2.substring(2, 4), 16) * (1 - ratio));
        //    var b = Math.ceil(parseInt(color1.substring(4, 6), 16) * ratio + parseInt(color2.substring(4, 6), 16) * (1 - ratio));

        //    return hex(r) + hex(g) + hex(b);
        //};

        var getGradientColor = function (start_color, end_color, percent) {
            // strip the leading # if it's there
            start_color = start_color.replace(/^\s*#|\s*$/g, '');
            end_color = end_color.replace(/^\s*#|\s*$/g, '');

            // convert 3 char codes --> 6, e.g. `E0F` --> `EE00FF`
            if (start_color.length == 3) {
                start_color = start_color.replace(/(.)/g, '$1$1');
            }

            if (end_color.length == 3) {
                end_color = end_color.replace(/(.)/g, '$1$1');
            }

            // get colors
            var start_red = parseInt(start_color.substr(0, 2), 16),
                start_green = parseInt(start_color.substr(2, 2), 16),
                start_blue = parseInt(start_color.substr(4, 2), 16);

            var end_red = parseInt(end_color.substr(0, 2), 16),
                end_green = parseInt(end_color.substr(2, 2), 16),
                end_blue = parseInt(end_color.substr(4, 2), 16);

            // calculate new color
            var diff_red = end_red - start_red;
            var diff_green = end_green - start_green;
            var diff_blue = end_blue - start_blue;

            diff_red = ((diff_red * percent) + start_red).toString(16).split('.')[0];
            diff_green = ((diff_green * percent) + start_green).toString(16).split('.')[0];
            diff_blue = ((diff_blue * percent) + start_blue).toString(16).split('.')[0];

            // ensure 2 digits by color
            if (diff_red.length == 1)
                diff_red = '0' + diff_red

            if (diff_green.length == 1)
                diff_green = '0' + diff_green

            if (diff_blue.length == 1)
                diff_blue = '0' + diff_blue

            return '' + diff_red + diff_green + diff_blue;
        };

        var gradient = function (ratio) {
            //if (ratio > 0.6)
            //{
            //    return gradient2(color1, color2, (ratio - 0.6) / 0.4);
            //}
            if (ratio >= 1) {
                return color1;
            } else if (ratio <= 0) {
                return color3;
            }
            return getGradientColor(color3, color1, ratio);
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

            me.index.clear();

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

                                for (var s = 0; s < edge.shape.length - 1; s++) {
                                    me.index.insert({
                                        minX: Math.min(edge.shape[s][0], edge.shape[s + 1][0]),
                                        minY: Math.min(edge.shape[s][1], edge.shape[s + 1][1]),
                                        maxX: Math.max(edge.shape[s][0], edge.shape[s + 1][0]),
                                        maxY: Math.max(edge.shape[s][1], edge.shape[s + 1][1]),
                                        edgeId: edge.edgeId
                                    });
                                }

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

                                            //console.log('ratio: ' + ratio + ' makes ' + color);

                                            var weight = 2 * (1 - ratio);
                                            return {
                                                weight: weight,
                                                color: color,
                                                opacity: 0.8
                                            };
                                        }
                                    },
                                    //onEachFeature: function (feature, layer) {
                                    //    layer.on("mouseover", function (e) {
                                    //        //console.log('Mouseover on ' + me.profile);
                                    //        me.report(feature.properties.edgeId);
                                    //        me.selectEdge(feature.properties.edgeId);
                                    //    });
                                    //}
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

            }, function (response, currentId, options) {
                console.log('ERROR:' + response);
            }, this);
        };

        me.onClick = function (e) {
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
        };

        me.onMouseMove = function (e) {
            var loc = e.latlng;

            var result = me.index.search({
                minX: loc.lng - 0.00001,
                minY: loc.lat - 0.00001,
                maxX: loc.lng + 0.00001,
                maxY: loc.lat + 0.00001
            });

            if (result.length > 0) {
                me.selectEdge(result[0].edgeId);
            } else {
				result = me.index.search({
					minX: loc.lng - 0.001,
					minY: loc.lat - 0.001,
					maxX: loc.lng + 0.001,
					maxY: loc.lat + 0.001
				});
				
				if (result.length > 0) {
					me.selectEdge(result[0].edgeId);
				}
			}
            //for (var i = 0; i < result.length; i++) {

            //}
        };

        requestRoute(start);

        return me;
    }
};