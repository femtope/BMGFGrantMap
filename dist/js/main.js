var scope = '',
    sectors = [],
    geoData = null,
    dataLayer = null;
var map = L.map('map', {
    center: [10, 8],
    zoom: 8,
    zoomControl: false,
    minZoom: 6
});
/*
xMin: 2.668432
yMin: 4.277144
xMax:    14.680073
yMax:    13.892007
*/
map.fitBounds([
    [2.668432, 4.277144], [14.680073, 13.892007]
]);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpandmbXliNDBjZWd2M2x6bDk3c2ZtOTkifQ._QA7i5Mpkd_m30IGElHziw', {
    maxZoom: 18,
    id: 'mapbox.streets'
}).addTo(map);
new L.Control.Zoom({
    position: 'topright'
}).addTo(map);

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
    if (id != null) {
        if ($('#'.concat(id)).hasClass('btn-primary')) {
            $('#'.concat(id)).removeClass('btn-primary')
            $('#'.concat(id)).addClass('btn-success')
        } else if ($('#'.concat(id)).hasClass('btn-success')) {
            $('#'.concat(id)).removeClass('btn-success')
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
    return query;
}


function addDataToMap(geoData) {
    //remove all layers first
    if (dataLayer != null)
        map.removeLayer(dataLayer)

    /*    var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };*/
    var _radius = 7
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
    dataLayer = L.geoJson(geoData, {
        pointToLayer: function (feature, latlng) {
            var marker = L.circleMarker(latlng, allColours[feature.properties.sector]);
            return marker;
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.cartodb_id) {
                layer.bindPopup(buildPopupContent(feature));
            }
        }
    })

    dataLayer.addTo(map);
    //layer.bindPopup('<p>GID: ' + feature.properties.cartodb_id + '</p>');
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
    var propertyNames = ['sector', 'state', 'scope_of_work', 'duration', 'bmgf_point', 'amount_us', 'grantee_organisation', 'beneficiary', 'title_of_grant', 'nature_of_work', 'focal_state', 'organisation']
    for (var i = 0; i < propertyNames.length; i++) {
        subcontent = subcontent.concat('<p><strong>' + normalizeName(propertyNames[i]) + ': </strong>' + feature.properties[propertyNames[i]] + '</p>')
    }
    return subcontent
}

function getData(queryUrl) {
    $('.fa-spinner').addClass('fa-spin')
    $.post(queryUrl, function (data) {
        $('.fa-spinner').removeClass('fa-spin')
        addDataToMap(data)
    }).fail(function () {
        console.log("error!")
    });
}

triggerUiUpdate()
