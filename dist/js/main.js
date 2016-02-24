var scope = '',
    sectors = [],
    geoData = null,
    dataLayer = null,
    markerGroup = null,
    stateData = null;

$(document).ready(function(){
    $('[data-toggle="tooltip"]').tooltip();
});

var style = {
        "clickable": true,
        "color": '#B81609',
        "fillColor": '#FFFFFF',
        "weight": 2.0,
        "opacity": 0.2,
        "fillOpacity": 0.1
    };
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
});

var map = L.map('map', {
    center: [10, 8],
    zoom: 8,
    zoomControl: false,
    minZoom: 6
    //layers:[stateLayer]
});


map.fitBounds([
    [2.668432, 4.277144], [14.680073, 13.892007]
]);

//https://maps.nlp.nokia.com/maptiler/v2/maptile/newest/normal.day.grey/{z}/{x}/{y}/256/png8?lg=eng&token=61YWYROufLu_f8ylE0vn0Q&app_id=qIWDkliFCtLntLma2e6O

L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
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
  console.log("Query ", query)
    return query;
}



function addDataToMap(geoData) {
    //remove all layers first
    if (dataLayer != null)
        map.removeLayer(dataLayer)

        if (markerGroup != null)
          map.removeLayer(markerGroup)


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

    markerGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true
    })

    dataLayer = L.geoJson(geoData, {
        pointToLayer: function (feature, latlng) {
            var marker = L.circleMarker(latlng, allColours[feature.properties.sector])
            //markerGroup.addLayer(marker);
            return marker
        },
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.cartodb_id) {
                layer.bindPopup(buildPopupContent(feature));
            }
        }
    })

    markerGroup.addLayer(dataLayer);
    map.addLayer(markerGroup);
    //map.fitBounds(markerGroup.getBounds());
    //dataLayer.addTo(map);

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
    return subcontent
}

function getData(queryUrl) {
    $('.fa-spinner').addClass('fa-spin')
    $('.fa-spinner').show()
    $.post(queryUrl, function (data) {
        $('.fa-spinner').removeClass('fa-spin')
        addDataToMap(data)
    }).done(function() {
      $('.fa-spinner').hide()
    }) ;
}

triggerUiUpdate()
