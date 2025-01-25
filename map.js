let currentYear = 2023;
let currentProperty = 'visits';
let librariesData = {}; 
let yearLabel = document.getElementById('year');
yearLabel.textContent = currentYear;

let map = new maplibregl.Map({
    container: 'map', 
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", 
    center: [-79.4432, 43.7132], 
    zoom: 10.5,
    maxBounds: [[-80.95, 42.79212], [-77.900, 44.246449]]
});

// Add controls
map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

// Popup
const popup = document.getElementById('popup');
const closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', function() {
    popup.classList.remove('show');
    const expanded = popup.classList.contains('show');
    closeButton.setAttribute('aria-expanded', expanded);
});

d3.json('data/libraries.geojson', (err, data) => {
    if (err) throw err;
    librariesData = data;

    map.on('load', function() {
        map.addSource('torontoBoundary', {
            type: 'geojson',
            data: 'data/toronto-outline.geojson'
        });

        map.addLayer({
            id: 'torontoBoundary',
            type: 'line',
            source: 'torontoBoundary',
            paint: {
                'line-color': '#7d8a9b',
                'line-width': 3,
                'line-opacity': 1,
                "line-dasharray": [3, .4]
            }
        });

        map.addSource('notToronto', {
            type: 'geojson',
            data: 'data/not-toronto.geojson'
        });

        map.addLayer({
            id: 'notToronto',
            type: 'fill',
            source: 'notToronto',
            paint: {
                'fill-color': '#beb9b1',
                'fill-opacity': 0.5 
            }
        });

        // map.addSource('neighbourhoods', {
        //     type: 'geojson',
        //     data: 'data/toronto_neighbourhoods.geojson'
        // });

        // map.addLayer({
        //     id: 'neighbourhoods',
        //     type: 'fill',
        //     source: 'neighbourhoods',
        //     paint: {
        //         'fill-color': "#3d3d3d",
        //         'fill-opacity': 0.2
        //     }
        // });

        map.addSource('libraries', {
            type: 'geojson',
            data: librariesData
        });

        map.addLayer({
            id: 'libraries',
            type: 'circle',
            source: 'libraries',
            paint: {
                'circle-color': ["interpolate",
                    ["linear"],
                    ["get", `${currentProperty}_${currentYear}`],
                    10000, "#94d2ff",
                    1000000, "#001c71"
                ],
                'circle-stroke-color': '#fff',
                'circle-stroke-width': 1,
                'circle-radius': ["interpolate",
                    ["linear"],
                    ["get", `${currentProperty}_${currentYear}`],
                    10000, 5,
                    1000000, 25
                ]
            },
        });
       
        map.on('mouseenter', 'libraries', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
      
        map.on('mouseleave', 'libraries', () => {
          map.getCanvas().style.cursor = '';
        });
      
        map.on('click', 'libraries', (e) => {
          map.flyTo({
              center: e.features[0].geometry.coordinates,
              zoom: 17
          });
      
          // popup info
          const name = e.features[0].properties.BranchName;
          const address = e.features[0].properties.Address;
          const website = e.features[0].properties.Website;
          const telephone = e.features[0].properties.Telephone;
          const photo = e.features[0].properties.PhotoURL;
      
          document.getElementById('branch-name').textContent = name;
          document.getElementById('branch-address').textContent = address;
          document.getElementById('branch-telephone').textContent = telephone;
          const branchWebsite = document.getElementById('branch-website');
          branchWebsite.href = website;
          branchWebsite.textContent = website;
          const branchPhoto = document.getElementById('branch-photo')
          branchPhoto.src = photo;
          branchPhoto.alt = "Exterior of " + name + " library";
      
          popup.classList.add('show');
        });

        updateLayer(`${currentProperty}_${currentYear}`);
    });
});

// Update the layer based on the selected year
function updateLayer(year) {
    // will likely change null value styling... tdb
    map.setPaintProperty('libraries', 'circle-color', [
        "case",
        ['==', ['get', `${currentProperty}_${currentYear}`], null],
        "#333333ab",
        ["interpolate", ["linear"], ["get", `${currentProperty}_${currentYear}`],
        10000, "#7ac8ff",
        1000000, "#001c71"]
    ]);

    map.setPaintProperty('libraries', 'circle-radius', [
        "interpolate",
        ["linear"],
        ["get", `${currentProperty}_${currentYear}`],
        10000, 5,
        1000000, 25
    ]);
}

// slider update
document.getElementById('slider').addEventListener('input', (e) => {
  const selectedYear = parseInt(e.target.value, 10);
  currentYear = selectedYear;
  yearLabel.textContent = currentYear;
  updateLayer(`${currentProperty}_${currentYear}`);
});

document.getElementById('property-dropdown').addEventListener('change', (e) => {
  currentProperty = e.target.value;
  updateLayer(`${currentProperty}_${currentYear}`);
})
