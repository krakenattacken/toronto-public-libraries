let currentYear = 2023;
let currentProperty = 'visits';
let librariesData = {};
let chartInstance = null;
let currentLibrary = null;
let breaks = [];

const color1 = "hsl(205 100% 89%)";
const color2 = "hsl(208 85.8% 75.1%)";
const color3 = "hsl(208 81.9% 61%)";
const color4 = "hsl(210 100% 42.9%)"; // this is the main blue.
const color5 = "hsl(215 100% 32.5%)";
const color6 = "hsl(225 100% 22.2%)";
const strokeColor = "hsl(0 0% 100%)"; // white

// Initialize the map
let map = new maplibregl.Map({
    container: 'map',
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // to change
    center: [-79.4432, 43.7132],
    zoom: 10.5,
    bearing: -17,
    maxBounds: [[-80.95, 42.79212], [-77.900, 44.246449]]
});

map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

const popup = document.getElementById('popup');
const closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', function() {
    popup.classList.remove('show');
    const expanded = popup.classList.contains('show');
    closeButton.setAttribute('aria-expanded', expanded);
    currentLibrary = null;
    console.log(currentLibrary);
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

        map.addSource('libraries', {
            type: 'geojson',
            data: librariesData
        });

        // reference layers
        map.addSource('neighbourhoods', {
            type: 'geojson',
            data: 'data/toronto_neighbourhoods.geojson'
        })
        map.addSource('closest', {
            type: 'geojson',
            data: 'data/closest.geojson'
        })
        map.addLayer({
          id: 'neighbourhoods',
          type: 'line',
          source: 'neighbourhoods',
          layout: {visibility: 'none'},
          paint: {
            'line-color': 'hsla(287 100% 16% / 0.6)',
            'line-width': 1.5,
            "line-dasharray": [3, .7]
          }
        });
        map.addLayer({
          id: 'closest',
          type: 'line',
          source: 'closest',
          layout: {visibility: 'none'},
          paint: {
            'line-color': 'hsla(137 100% 16% / 0.6)',
            'line-width': 1.5,
            "line-dasharray": [3, .7]
          }
        });

        const tooltip = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        breaks = getJenks();
        map.addLayer({
            id: 'libraries',
            type: 'circle',
            source: 'libraries',
            paint: {
                'circle-color': color1,
                'circle-stroke-color': strokeColor,
                'circle-stroke-width': 1,
                'circle-radius': [
                  "step",
                  ["get", `${currentProperty}_${currentYear}`],
                  4, breaks[0],
                  8, breaks[1],
                  12, breaks[2],
                  16, breaks[3],
                  22, breaks[4],
                  26
                ]
            }
        });

        let currentFeatureCoordinates = undefined;
        map.on('mousemove', 'libraries', (e) => {
          const featureCoordinates = e.features[0].geometry.coordinates.toString();
          if (currentFeatureCoordinates !== featureCoordinates) {
            currentFeatureCoordinates = featureCoordinates;

            map.getCanvas().style.cursor = 'pointer';

            const coordinates = e.features[0].geometry.coordinates.slice();
            const description = e.features[0].properties.BranchName;
            
            tooltip.setLngLat(coordinates).setText(description).addTo(map);
          }
        });

        map.on('mouseleave', 'libraries', () => {
            currentFeatureCoordinates = undefined;
            map.getCanvas().style.cursor = '';
            tooltip.remove();
        });

        map.on('click', 'libraries', (e) => {
            map.flyTo({
                center: e.features[0].geometry.coordinates,
                zoom: 18
            });

            currentLibrary = e.features[0];

            document.getElementById('branch-name').textContent = currentLibrary.properties.BranchName;
            document.getElementById('branch-address').textContent = currentLibrary.properties.Address;
            document.getElementById('branch-telephone').textContent = currentLibrary.properties.Telephone;
            document.getElementById('branch-website').href = currentLibrary.properties.Website;
            document.getElementById('opening-year').textContent = currentLibrary.properties.PresentSiteYear;
            document.getElementById('branch-features').textContent = getBranchFeatures();
            document.getElementById('branch-workstations').textContent = currentLibrary.properties.Workstations;
            document.getElementById('branch-neighbourhood').textContent = currentLibrary.properties.NBHDName;
            const branchPhoto = document.getElementById('branch-photo');
            branchPhoto.src = currentLibrary.properties.PhotoURL;
            branchPhoto.alt = "Exterior of " + currentLibrary.properties.BranchName + " library";

            popup.classList.add('show');
            generateChart();
        });
        updateLayer();
    });
});

function getJenks() {
  const temp = librariesData.features.map(feature => feature.properties[`${currentProperty}_${currentYear}`] ?? 0);
  return ss.jenks(temp, 5);
}

// Update layer style based on filters
function updateLayer() {
    breaks = getJenks();
    map.setPaintProperty('libraries', 'circle-color', [
      "step",
      ["get", `${currentProperty}_${currentYear}`],
      color1, breaks[0],
      color2, breaks[1],
      color3, breaks[2],
      color4, breaks[3],
      color5, breaks[4],
      color6
    ]);

    map.setPaintProperty('libraries', 'circle-radius', [
      "step",
      ["get", `${currentProperty}_${currentYear}`],
      4, breaks[0],
      8, breaks[1],
      12, breaks[2],
      16, breaks[3],
      20, breaks[4],
      24
    ]);
    updateLegend();
}

// populate year select
const yearSelect = document.getElementById('year-dropdown');
for (let year = 2013; year <= 2023; year++) {
  const option = document.createElement('option');
  option.value = year;
  option.text = year;
  yearSelect.appendChild(option);
}
yearSelect.value = currentYear;

//select update
document.getElementById('year-dropdown').addEventListener('change', (e) => {
  const selectedYear = parseInt(e.target.value, 10);
  currentYear = selectedYear;
  yearSelect.value = currentYear;
  updateLayer(`${currentProperty}_${currentYear}`);
  if (currentLibrary !== null) generateChart(currentLibrary);
});

// reference layers
document.getElementById('toggle-neighbourhoods').addEventListener('change', function (e) {
  const visibility = e.target.checked ? 'visible' : 'none';
  map.setLayoutProperty('neighbourhoods', 'visibility', visibility);
});
document.getElementById('toggle-closest').addEventListener('change', function (e) {
  const visibility = e.target.checked ? 'visible' : 'none';
  map.setLayoutProperty('closest', 'visibility', visibility);
});

// dropdown update
document.getElementById('property-dropdown').addEventListener('change', (e) => {
  currentProperty = e.target.value;
  updateLayer(`${currentProperty}_${currentYear}`);
  if (currentLibrary !== null) generateChart(currentLibrary);
});

function getCategory() {
  return (currentProperty === 'visits') ? 'VISITS'
  : (currentProperty === 'cards') ? 'CARD REGISTRATIONS'
  : 'CIRCULATED MATERIALS';
}

function generateChart() {
  const title = getCategory();

  const years = Array.from({length: 11}, (_, i) => 2013 + i);
  const data = years.map(year => {
    return currentLibrary.properties[`${currentProperty}_${year}`] ?? 0;
  });

  const yearIndex = years.indexOf(currentYear);
  const barColours = years.map((_, index) => { return index === yearIndex ? color4 : 'hsla(210 100% 42.9% / 0.34)'; });

  // global styles
  Chart.defaults.font.family = '"Open Sans", Arial, Helvetica, sans-serif';
  Chart.defaults.color = '#000';
  Chart.defaults.font.size = 10;

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(document.getElementById('chart'), {
    type: 'bar',
    options: {
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          title: { display: true, text: `${title}`},
        },
        y: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false }
      }
    },
    data: {
      labels: years,
      datasets: [
        {
          data: data,
          backgroundColor: barColours
        }
      ]
    }
  });
};

function getBranchFeatures() {
  const featureArray = [];
  if (currentLibrary.properties.KidsStop) { featureArray.push("Kids Stop"); }
  if (currentLibrary.properties.LeadingReading) { featureArray.push("Leading To Reading"); }
  if (currentLibrary.properties.CLC) { featureArray.push("Computer Learning Centre"); }
  if (currentLibrary.properties.DIH) { featureArray.push("Digital Innovation Hub"); }
  if (currentLibrary.properties.TeenCouncil) { featureArray.push("Teen Council"); }
  if (currentLibrary.properties.YouthHub) { featureArray.push("Youth Hub"); }
  if (currentLibrary.properties.AdultLiteracyProgram) { featureArray.push("Adult Literacy Program"); }

  const features = featureArray.join(", ");
  return (features === '') ? 'N/A' :features;
}

// legend
function updateLegend() {
  labels = document.querySelectorAll('.legend-label');
  labels.forEach((label, i) => {
    if (i === 0) {
      label.textContent = 0;  
    } else {
      label.textContent = "<" + Math.round(breaks[i] / 100) * 100;
    }
  })
  document.getElementById('legend-title').textContent = getCategory();
}
const colors = ["hsl(205 100% 0%)", "hsl(208 85.8% 75.1%)", "hsl(208 81.9% 61%)", "hsl(210 100% 42.9%)", "hsl(215 100% 32.5%)","hsl(225 100% 22.2%)"]
circles = document.querySelectorAll('#legend circle');
circles.forEach((circle, i) => {
  if (colors[i]) {
    circle.setAttribute('fill', colors[i]);
  }
})