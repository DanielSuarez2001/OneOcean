import 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

let methods = 
{
    validateCoords(coordinate, fieldName) {
        let coordinateSanatized;
        if (!coordinate)
        {
            throw `${fieldName} must be provided`;
        }
        if (typeof coordinate !== 'number')
        {
            if (typeof coordinate === 'string')
            {
                coordinateSanatized = +(coordinate.trim());
                if (Number.isNaN(coordinateSanatized))
                {
                    throw `if ${fieldName} is a string it must be in number form`;
                }
            }
            else
            {
                throw `${fieldName} must be a number or string in number form`;
            }
        }
        else 
        {
            coordinateSanatized = coordinate;
        }
        return coordinateSanatized;
    },
    convertGeoObjectToMarker(geoObject) {
        if (!geoObject || typeof geoObject !== 'object' )
        {
            throw `geoObject must be provided and a object ${geoObject}`;
        }
        if (!geoObject.type || !geoObject.coordinates)
        {
            throw 'geoObject must contain attributes: type and coordinates'
        }

        let markerLat = this.validateCoords(geoObject.coordinates[1], 'markerLat');
        let markerLon = this.validateCoords(geoObject.coordinates[0], 'markerLon');
        let marker = L.marker([markerLat, markerLon]);
        return marker;
    },
    convertBeachToMarker(beachObject) {
        if (!beachObject || typeof beachObject !== 'object')
        {
            throw `beachObject must be provided and a valid beach object with a geoObject property ${beachObject}`;
        }
        if (typeof beachObject._id === 'object')
        {
            beachObject._id = beachObject._id.toString();
        }
        let marker = this.convertGeoObjectToMarker(beachObject.geoObject);
        marker.bindPopup(`<b>${beachObject.beachName}</b><br>${beachObject.city}, ${beachObject.county}<br><a href="/beaches/${beachObject._id}">View Details</a>`);
        return marker;
    },
    initializeMap(divId, defaultViewCoords, zoomLevel) {
        if (!divId)
        {
            throw 'divId must be provided';
        }
        if (!defaultViewCoords)
        {
            defaultViewCoords = [37.76440868707054, -122.50798339662812];
        }
        if (!zoomLevel)
        {
            zoomLevel = 13;
        }

        if (typeof divId !== 'string')
        {
            throw 'divId must be a string';
        }
        if (!Array.isArray(defaultViewCoords) || defaultViewCoords.length !== 2)
        {
            throw 'defaultViewCoords must be an array of length 2';
        }
        if (typeof zoomLevel !== 'number')
        {
            throw 'zoomLevel must be a number';
        }

        let map = L.map(divId).setView(defaultViewCoords, zoomLevel);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', 
        {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        return map;
    },
    createProximityCircle()
    {

    }
}

try {
    const map = methods.initializeMap("map");
    let beachData = document.getElementById('beach-data')
    if (!beachData)
    {
        throw 'No data for beaches found'
    }

    beachData = JSON.parse(beachData.innerText);
    if (Array.isArray(beachData))
    {
        for (const beach of beachData)
        {
            methods.convertBeachToMarker(beach).addTo(map);
        }
    }   
    else if (typeof beachData === 'object')
    {
        methods.convertBeachToMarker(beachData).addTo(map);
    }
    else
    {
        throw 'invalid beachData provided';
    }
} catch (e) {
    console.log(e);
}






