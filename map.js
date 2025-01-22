/* popup not working*/
let map = new maplibregl.Map({
  container: 'map', 
  style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", 
  center: [-79.4532, 43.7132], 
  zoom: 10.5,
  maxBounds: [[-80.95, 42.79212], [-77.900, 44.246449]]
});

//add zoom and rotation
map.addControl(new maplibregl.NavigationControl(), 'top-right');

//add scalebar
let scale = new maplibregl.ScaleControl({
  unit: 'metric'
})
map.addControl(scale, 'bottom-left');

//add geojson layers
map.on('load', function() {
  map.addSource('libraries', {
    type: 'geojson',
    data: 'data/libraries.geojson'
  });
  
  // map.addSource('neighbourhoods', {
  //   type: 'geojson',
  //   data: 'data/toronto_neighbourhoods.geojson'
  // });

  map.addSource('torontoBoundary', {
    type: 'geojson',
    data: 'data/toronto-outline.geojson'
  })

  map.addSource('notToronto', {
    type: 'geojson',
    data: 'data/not-toronto.geojson'
  })

  map.addLayer({
    id: 'libraries',
    type: 'circle',
    source: 'libraries',
    layout: {}, //??
    paint: {
      'circle-color': ["interpolate",
        ["linear"],
        ["get", "circulation_2012"],
        10000,"#7ac8ff",
        1000000, "#001c71"
      ],
        //'#005FC0',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1,
      // 'circle-radius': [
      //   "match",
      //   ["get", "ServiceTier"],
      //   "DL", 6,
      //   "RR", 8,
      //   4
      // ]
      
        'circle-radius': ["interpolate",
        ["linear"],
        ["get", "circulation_2012"],
         10000, 5,
         1000000, 25
        ]
    }
  });

  map.addLayer({
    id: 'torontoBoundary',
    type: 'line',
    source: 'torontoBoundary',
    layout: {
    },
    paint: {
      'line-color': '#7d8a9b',
      'line-width': 3,
      'line-opacity': 1,
      "line-dasharray": [3, .4]
    }
  })

  map.addLayer({
    id: 'notToronto',
    type: 'fill',
    source: 'notToronto',
    layout: {
    },
    paint: {
      'fill-color': '#beb9b1',
      'fill-opacity': 0.5 
    }
  })

  // map.addLayer({
  //   id: 'neighbourhoods',
  //   type: 'line',
  //   source: 'neighbourhoods',
  //   layout: {},
  //   paint: {
  //     'line-color': '#FF5733',
  //     'line-opacity': 0.2
  //   }
  // });


  map.on('mouseenter', 'libraries', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'libraries', () => {
    map.getCanvas().style.cursor = '';
  });

  map.on('click', 'libraries', (e) => {
    map.flyTo({
        center: e.features[0].geometry.coordinates,
        zoom: 16
    });

    const coordinates = features[0].geometry.coordinates.slice();
    const title = features[0].properties.BranchName;
    const address = e.features[0].properties.Address;

    const htmlContent = "<h2>" + title + "</h2>"
                        "<p>Address:" + address +"</p>"
    const popup = new maplibregl.Popup({ closeButton: true,
      closeOnClick: true,
      maxWidth: 'none',})
    
    popup.setLngLat(coordinates)
      .setHTML(htmlContent)
      .addTo(map);

  });
});