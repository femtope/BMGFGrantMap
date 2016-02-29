var scope = '',
    sectors = [],
    geoData = null,
    dataLayer = null,
    markerGroup = null,
    stateData = null,
    stateLayer, lgaLayer,
    lgaLabels = [],
    showLga = false

var map = L.map('map', {
    center: [10, 8],
    zoom: 8,
    zoomControl: false,
    minZoom: 6
        /*,
        crs: L.CRS.EPSG4326*/
        //layers:[stateLayer]
});


map.fitBounds([
    [2.668432, 4.277144], [14.680073, 13.892007]
])

map.on('zoomend', function () {
    adjustLayerbyZoom(map.getZoom())
})


L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
}).addTo(map);

new L.Control.Zoom({
    position: 'topright'
}).addTo(map);

L.control.scale({
    position: 'bottomright',
    maxWidth: 150,
    metric: true,
    updateWhenIdle: true
}).addTo(map);

function adjustLayerbyZoom(zoomLevel) {

    if (zoomLevel > 8) {
        if (!showLga) {
            map.addLayer(lgaLayer)
                //Add labels to the LGAs
            for (var i = 0; i < lgaLabels.length; i++) {
                lgaLabels[i].addTo(map)
            }
            showLga = true
        }
    } else {
        map.removeLayer(lgaLayer)
        for (var i = 0; i < lgaLabels.length; i++) {
            map.removeLayer(lgaLabels[i])
        }

        showLga = false
    }
}

function triggerUiUpdate() {
    scope = $('#projectScope').val()
    var query = buildQuery(scope, sectors)
    getData(query)
}

function buildSelectedSectors(sector) {
    var idx = sectors.indexOf(sector)
    if (idx > -1)
        sectors.splice(idx, 1)
    else if (idx == -1) {
        if (sector != null)
            sectors.push(sector)
    }
    toggleClass(sector)
    triggerUiUpdate()
}

function toggleClass(id) {
    /*console.log("Selected", id)*/
    if (id != null) {
        if ($('#'.concat(id)).hasClass('btn-primary')) {
            $('#'.concat(id)).removeClass('btn-primary')
            $('#'.concat(id)).addClass('btn-'.concat(id))
        } else if ($('#'.concat(id)).hasClass('btn-'.concat(id))) {
            $('#'.concat(id)).removeClass('btn-'.concat(id))
            $('#'.concat(id)).addClass('btn-primary')
        }
    }
}

function buildQuery(_scope, _sectors) {
    //returns geojson
    var containsAnd = false;
    query = 'http://ehealthafrica.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM granteedata_copy';
    query = (_scope.length > 0 || _sectors.length > 0) ? query.concat(' WHERE') : query;
    if (_scope.length > 0) {
        query = (_sectors.length > 0) ? query.concat(" scope_of_work = '".concat(scope.concat("' AND"))) : query.concat(" scope_of_work = '".concat(scope.concat("'")))
    }
    if (_sectors.length > 0) {
        for (var i = 0; i < _sectors.length; i++) {
            if (i == 0)
                query = query.concat(" sector='" + _sectors[i] + "'");
            else query = query.concat(" OR sector='" + _sectors[i] + "'")
        }
    }
    //console.log("Query ", query)
    return query;
}


//TODO: fix the issue of lga layer not reoving after data filtering
function addDataToMap(geoData) {
    // adjustLayerbyZoom(map.getZoom())
    //remove all layers first

    if (dataLayer != null)
        map.removeLayer(dataLayer)

    if (markerGroup != null)
        map.removeLayer(markerGroup)


    var _radius = 10
    var _outColor = "#fff"
    var _weight = 1
    var _opacity = 1
    var _fillOpacity = 0.5

    var allColours = {
        'Nutrition': {
            radius: _radius,
            fillColor: "#ff7800",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        },
        'Agriculture': {
            radius: _radius,
            fillColor: "#33cc33",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        },
        'Health': {
            radius: _radius,
            fillColor: "#0099cc",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        },
        'Education': {
            radius: _radius,
            fillColor: "#ffff66",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        },
        'Research': {
            radius: _radius,
            fillColor: "#ee82ee",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        },
        'Finance': {
            radius: _radius,
            fillColor: "#cc3300",
            color: _outColor,
            weight: _weight,
            opacity: _opacity,
            fillOpacity: _fillOpacity
        }
    }


    $('#projectCount').text(geoData.features.length)

    markerGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            removeOutsideVisibleBounds: true
        })
        //console.log("geoData", geoData)
    dataLayer = L.geoJson(geoData, {
        pointToLayer: function (feature, latlng) {
            var marker = L.circleMarker(latlng, allColours[feature.properties.sector])
                //markerGroup.addLayer(marker);
            return marker
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.cartodb_id) {
                //layer.bindPopup(buildPopupContent(feature));
                layer.on('click', function () {
                    displayInfo(feature)
                })
            }

        }

    })

    markerGroup.addLayer(dataLayer);
    map.addLayer(markerGroup);

}

/*

var hoverStyle = {
    "fillOpacity": 0.5
};

$.ajax({
    type: "POST",
    url: "http://ehealthafrica.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM nigeria_state_boundary",
    dataType: 'json',
    success: function (response) {
        stateLayer = L.geoJson(response, {
            style: style
        }).addTo(map);
    }
});*/

function addAdminLayersToMap(layers) {
    var layerStyles = {
            'state': {
                "clickable": true,
                "color": '#B81609',
                "fillColor": '#FFFFFF',
                "weight": 1.5,
                "opacity": 0.2,
                "fillOpacity": 0.1
            },
            'lga': {
                "clickable": true,
                "color": '#244B54',
                "fillColor": '#FFFFFF',
                "weight": 1.5,
                "opacity": 0.4,
                "fillOpacity": 0.1
            }
        }
        /*
        pointToLayer: function (feature, latlng) {
            var marker = L.circleMarker(latlng, allColours[feature.properties.sector])
                //markerGroup.addLayer(marker);
            return marker
        }


        console.log(layers)
console.log(layers['state'])*/
        //console.log("state", layers['state'])
    stateLayer = L.geoJson(layers['state'], {
        style: layerStyles['state']
    }).addTo(map)
    lgaLayer = L.geoJson(layers['lga'], {
        style: layerStyles['lga'],
        onEachFeature: function (feature, layer) {
            var labelIcon = L.divIcon({
                className: 'label-icon',
                html: feature.properties.LGAName
            })
            lgaLabels.push(L.marker(layer.getBounds().getCenter(), {
                    icon: labelIcon
                }))
                //layer.bindPopup(feature.properties.LGAName)
        }
    })
}


/**
L.geoJson(geoJsonData, {
  onEachFeature: function(feature, layer) {
    var label = L.marker(layer.getBounds().getCenter(), {
      icon: L.divIcon({
        className: 'label',
        html: feature.properties.NAME,
        iconSize: [100, 40]
      })
    }).addTo(map);
  }
);
*/

function displayInfo(feature) {
    //console.log('displaying info..')
    var infoContent = buildPopupContent(feature)
        //console.log("info", infoContent)
    $('#infoContent').html(infoContent)
}

function normalizeName(source) {
    source = source.replace("_", " ").replace('of_', ' of ')
    source = source.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
    return source
}

function buildPopupContent(feature) {
    var subcontent = ''
    var propertyNames = ['sector', 'state', 'scope_of_work', 'duration', 'bmgf_point', 'grantee_organisation', 'beneficiary', 'title_of_grant', 'nature_of_work', 'focal_state', 'organisation']
    for (var i = 0; i < propertyNames.length; i++) {
        subcontent = subcontent.concat('<p><strong>' + normalizeName(propertyNames[i]) + ': </strong>' + feature.properties[propertyNames[i]] + '</p>')

    }
    return subcontent;
}

function showLoader() {
    $('.fa-spinner').addClass('fa-spin')
    $('.fa-spinner').show()
}

function hideLoader() {
    $('.fa-spinner').removeClass('fa-spin')
    $('.fa-spinner').hide()
}


function getData(queryUrl) {
    showLoader()
    $.post(queryUrl, function (data) {
        hideLoader()
        addDataToMap(data)
    }).fail(function () {
        console.log("error!")
    });
}

function getAdminLayers() {
    showLoader()
    var adminLayers = {}
    $.get('resources/state_boundary.geojson', function (stateData) {
        //add admin layers to map
        adminLayers['state'] = JSON.parse(stateData)
        $.get('resources/lga_boundary.geojson', function (lgaData) {
            adminLayers['lga'] = JSON.parse(lgaData)
                //return the layers
            addAdminLayersToMap(adminLayers)
        }).fail(function () {
            logError(null)
        })
    }).fail(function () {
        logError(null) //TODO: Fix this terrible code
    })
}

function logError(error) {
    console.log("error!")
}

getAdminLayers()
triggerUiUpdate()
