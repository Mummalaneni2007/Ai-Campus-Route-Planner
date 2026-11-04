// ======================================
// VIGNAN UNIVERSITY CAMPUS ROUTE PLANNER
// ======================================

// 1. CAMPUS LOCATIONS
// Coordinates are approximate demonstration positions.
// Replace them with verified building coordinates later.

const locations = [
{
id: "main",
name: "Vignan University Main Building",
lat: 16.2333,
lng: 80.5509
},
{
id: "visvesvaraya",
name: "Visvesvaraya Block",
lat: 16.2340,
lng: 80.5515
},
{
id: "pharmacy",
name: "Vignan Pharmacy College",
lat: 16.2328,
lng: 80.5520
},
{
id: "playground",
name: "University Playground",
lat: 16.2345,
lng: 80.5498
},
{
id: "tennis",
name: "Tennis Courts",
lat: 16.2350,
lng: 80.5505
},
{
id: "ublock",
name: "U Block",
lat: 16.2325,
lng: 80.5500
},
{
id: "caffe",
name: "Caffe Club",
lat: 16.2337,
lng: 80.5495
},
{
id: "meat",
name: "Meat and Eat",
lat: 16.2319,
lng: 80.5510
}
];

// 2. GET HTML ELEMENTS

const startSelect = document.getElementById("start");
const destinationSelect = document.getElementById("destination");
const findButton = document.getElementById("find-route");
const resetButton = document.getElementById("reset-route");
const result = document.getElementById("result");

// 3. CHECK LEAFLET

if (typeof L === "undefined") {
result.textContent =
"Map library could not load. Check your internet connection and reload the page.";

throw new Error("Leaflet library is not loaded.");

}

// 4. INITIALIZE MAP

const map = L.map("map").setView(
[16.2333, 80.5509],
17
);

// 5. LOAD MAP TILES

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{
attribution: "© OpenStreetMap contributors",
maxZoom: 19
}
).addTo(map);

// 6. ADD MAP MARKERS

const markers = {};

locations.forEach(function(location) {

const marker = L.marker([  
    location.lat,  
    location.lng  
]).addTo(map);  

marker.bindPopup(  
    "<b>" + location.name + "</b>"  
);  

markers[location.id] = marker;

});

// 7. FILL LOCATION DROPDOWNS

locations.forEach(function(location) {

const option1 = document.createElement("option");  

option1.value = location.id;  
option1.textContent = location.name;  

startSelect.appendChild(option1);  


const option2 = document.createElement("option");  

option2.value = location.id;  
option2.textContent = location.name;  

destinationSelect.appendChild(option2);

});

// 8. ROUTE VARIABLES

let routeLine = null;
let startMarker = null;
let endMarker = null;

// 9. CALCULATE DISTANCE USING HAVERSINE

function calculateDistance(point1, point2) {

const earthRadius = 6371000;  

const lat1 = point1.lat * Math.PI / 180;  
const lat2 = point2.lat * Math.PI / 180;  

const differenceLat =  
    (point2.lat - point1.lat) * Math.PI / 180;  

const differenceLng =  
    (point2.lng - point1.lng) * Math.PI / 180;  

const a =  
    Math.sin(differenceLat / 2) ** 2 +  
    Math.cos(lat1) *  
    Math.cos(lat2) *  
    Math.sin(differenceLng / 2) ** 2;  

const c = 2 * Math.atan2(  
    Math.sqrt(a),  
    Math.sqrt(1 - a)  
);  

return earthRadius * c;

}

// 10. DISPLAY ROUTE INFORMATION

function showRouteInfo(distance, isEstimated) {

const walkingSpeed = 75; // metres per minute  

const minutes = Math.max(  
    1,  
    Math.round(distance / walkingSpeed)  
);  

const distanceText =  
    distance >= 1000  
    ? (distance / 1000).toFixed(2) + " km"  
    : Math.round(distance) + " metres";  

result.innerHTML = `  
    <div class="route-info">  
        <p>📍 Route successfully displayed!</p>  
        <p>📏 Distance: ${distanceText}</p>  
        <p>🚶 Estimated walking time: ${minutes} minutes</p>  
        <p>${isEstimated  
            ? "⚠️ Approximate straight-line estimate; not a verified walking route."  
            : "Walking time is an estimate. The route follows available mapped roads."}  
        </p>  
    </div>  
`;

}

// 11. CLEAR PREVIOUS ROUTE

function clearRoute() {

if (routeLine) {  
    map.removeLayer(routeLine);  
    routeLine = null;  
}  

if (startMarker) {  
    map.removeLayer(startMarker);  
    startMarker = null;  
}  

if (endMarker) {  
    map.removeLayer(endMarker);  
    endMarker = null;  
}

}

// 12. FIND ROUTE

async function findRoute() {

    const start = startSelect.value;
    const end = destinationSelect.value;

    if (!start || !end) {
        result.textContent = "Please select both locations.";
        return;
    }

    if (start === end) {
        result.textContent = "Choose different locations.";
        return;
    }

    clearRoute();

    findButton.disabled = true;
    findButton.textContent = "Finding Route...";

    result.textContent = "Connecting to Python backend...";

    try {

        // Send request to Flask
        const response = await fetch("/api/route", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                start: start,
                end: end
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Route not found");
        }

        // Convert backend location IDs into map coordinates
        const routeCoordinates = data.route.map(id => {
            const location = locations.find(item => item.id === id);

            return [location.lat, location.lng];
        });

        // Draw route on Leaflet map
        routeLine = L.polyline(routeCoordinates, {
            color: "#16a34a",
            weight: 6
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), {
            padding: [50, 50]
        });

        // Display start and destination markers
        const startLocation = locations.find(item => item.id === start);
        const endLocation = locations.find(item => item.id === end);

        startMarker = L.marker([
            startLocation.lat,
            startLocation.lng
        ]).addTo(map);

        endMarker = L.marker([
            endLocation.lat,
            endLocation.lng
        ]).addTo(map);

        result.innerHTML = `
            <div class="route-info">
                <h3>Shortest Route Found!</h3>
                <p>Route: ${data.route.map(id =>
                    locations.find(item => item.id === id).name
                ).join(" → ")}</p>
                <p>Distance: ${data.distance} metres</p>
                <p>Walking Time: ${data.walking_time} minutes</p>
                <p>Calculated using Python NetworkX</p>
            </div>
        `;

    } catch (error) {

        result.textContent = "Error: " + error.message;

    } finally {

        findButton.disabled = false;
        findButton.textContent = "Find Shortest Route";

    }
}

// 13. RESET ROUTE

function resetRoute() {

clearRoute();  

startSelect.value = "";  
destinationSelect.value = "";  

result.textContent =  
    "Your route information will appear here.";  

map.setView(  
    [16.2333, 80.5509],  
    17  
);

}

// 14. BUTTON EVENTS

findButton.addEventListener(
"click",
findRoute
);

resetButton.addEventListener(
"click",
resetRoute
);

// 15. CLICK MARKERS TO VIEW LOCATIONS

Object.keys(markers).forEach(function(id) {

markers[id].on("click", function() {  

    const location = locations.find(  
        item => item.id === id  
    );  

    result.textContent =  
        "Selected campus location: " + location.name;  

});

});

// 16. INITIAL MAP DISPLAY

const allLocations = locations.map(function(location) {
return [location.lat, location.lng];
});

map.fitBounds(allLocations, {
padding: [40, 40]
});

console.log(
"Vignan University Campus Route Planner loaded successfully!"
);
// 17. CURRENT LOCATION FEATURE

function showCurrentLocation() {

    if (!navigator.geolocation) {
        alert("Location detection is not supported.");
        return;
    }

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            L.marker([lat, lng])
                .addTo(map)
                .bindPopup("Your Current Location")
                .openPopup();

            map.setView([lat, lng], 18);

        },

        function(error) {
            alert("Unable to detect your location. Please allow location access.");
        }

    );
}
// 18. CURRENT LOCATION AND NEAREST CAMPUS POINT

let currentLocationMarker = null;

function showCurrentLocation() {

    if (!navigator.geolocation) {
        result.textContent = "GPS is not supported by your browser.";
        return;
    }

    result.textContent = "Detecting your location...";

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            const current = {
                lat: lat,
                lng: lng
            };

            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }

            currentLocationMarker = L.marker([lat, lng])
                .addTo(map)
                .bindPopup("Your Current Location")
                .openPopup();

            map.setView([lat, lng], 18);

            // Find nearest known campus location
            let nearest = null;
            let shortestDistance = Infinity;

            locations.forEach(function(location) {

                const distance = calculateDistance(
                    current,
                    location
                );

                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearest = location;
                }

            });

            if (shortestDistance > 500) {
                result.textContent =
                    "Your detected location is more than 500 metres from the nearest listed campus point. Please check your GPS location.";
                return;
            }

            // Automatically select nearest campus point
            startSelect.value = nearest.id;

            result.innerHTML = `
                <h3>Location Detected!</h3>
                <p>Nearest campus point: ${nearest.name}</p>
                <p>Approximate distance: ${Math.round(shortestDistance)} metres</p>
                <p>Select your destination and click Find Shortest Route.</p>
            `;

        },

        function(error) {
            result.textContent =
                "Location error: " + error.message;
        },

        {
            enableHighAccuracy: true,
            timeout: 10000
        }

    );
}