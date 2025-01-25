let currentYear = 2023;
let currentProperty = 'visits';
let librariesData = {};
let chartInstance = null;
let currentLibrary = '';
let yearLabel = document.getElementById('year');
yearLabel.textContent = currentYear;

let map = new maplibregl.Map({
    container: 'map', 
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // to change
    center: [-79.4432, 43.7132], 
    zoom: 10.5,
    bearing: -17,
    maxBounds: [[-80.95, 42.79212], [-77.900, 44.246449]]
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');
map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

const popup = document.getElementById('popup');
const closeButton = document.getElementById('close-button');
closeButton.addEventListener('click', function() {
    popup.classList.remove('show');
    const expanded = popup.classList.contains('show');
    closeButton.setAttribute('aria-expanded', expanded); // aria-expanded never gets updated...
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
          generateChart(currentLibrary);
        });

        updateLayer();
    });
});

// Update layer style based on filters
function updateLayer() {
    // will likely change null value styling... tbd
    map.setPaintProperty('libraries', 'circle-color', [
        "case",
        ['==', ['get', `${currentProperty}_${currentYear}`], null],
        "#333333ab",
        ["interpolate", ["linear"], ["get", `${currentProperty}_${currentYear}`],
        10000, "#7ac8ff",
        1000000, "#001c71"]],
        { duration: 500,
          easing: 'linear'
        }
      );

    map.setPaintProperty('libraries', 'circle-radius', [
        "interpolate",
        ["linear"],
        ["get", `${currentProperty}_${currentYear}`],
        10000, 5,
        1000000, 25],
        { duration: 500,
          easing: 'linear'
        }
      );
}

// slider update
document.getElementById('slider').addEventListener('input', (e) => {
  const selectedYear = parseInt(e.target.value, 10);
  currentYear = selectedYear;
  yearLabel.textContent = currentYear;
  updateLayer(`${currentProperty}_${currentYear}`);
  generateChart(currentLibrary);
});
// dropdown update
document.getElementById('property-dropdown').addEventListener('change', (e) => {
  currentProperty = e.target.value;
  updateLayer(`${currentProperty}_${currentYear}`);
  generateChart(currentLibrary);
});

function getChartTitle() {
  return (currentProperty === 'visits') ? 'VISITS'
  : (currentProperty === 'cards') ? 'CARD REGISTRATIONS'
  : 'CIRCULATED MATERIALS';
}

function generateChart(library) {
  const title = getChartTitle();

  const years = Array.from({length: 11}, (_, i) => 2013 + i);
  const data = years.map(year => { 
    const value = library.properties[`${currentProperty}_${year}`];
    return value !== undefined ? value : 0;
  });

  const yearIndex = years.indexOf(currentYear);
  const barColours = years.map((_, index) => { return index === yearIndex ? '#006ddb' : '#006ddb57'; });

  // is there a better place to put this
  Chart.defaults.font.family = '"Open Sans", Arial, Helvetica, sans-serif';
  Chart.defaults.color = '#000';
  Chart.defaults.font.size = 10;

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(document.getElementById('chart'), {
    type: 'bar',
    options: {
      indexAxis: 'y',
      aspectRatio: 1.5,
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
  
  return features;
}
