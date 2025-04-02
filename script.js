document.addEventListener('DOMContentLoaded', function () {

  mapboxgl.accessToken = "pk.eyJ1IjoiY2Fyb2xpbmVuZWUiLCJhIjoiY201b2RhZmxtMGthajJucHRxcW5heGxiNyJ9.NMKAQoQvhYJ8RQq0NQuYkA"; // token to use mapbox API 
  const map = new mapboxgl.Map({
    container: 'my-map', // map container ID
    style: 'mapbox://styles/mapbox/standard', // standard mapbox style 
    center: [-79.7018518888638, 43.668552107715904], // starting position [lng, lat] of Peel Region
    zoom: 9, // starting zoom level
  });

  map.on('load', () => {

    //loading food program point data
    map.addSource('food_data', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus/refs/heads/main/Food%20Services%20Locations%20and%20Day_Time%20Filters.geojson' // link to git hub raw data file
    });

    //adding the food program point data to the map 
    map.addLayer({
      id: 'food_data',
      type: 'circle',
      source: 'food_data',
      paint: {
        'circle-radius': 5,
        'circle-color': '#000000'
      }
    });

    //loading walk coverage data
    map.addSource('walk_data', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus/refs/heads/main/walk.geojson'
    });

    //adding the walk coverage data to the map
    map.addLayer({
      id: 'walk_data',
      type: 'fill',
      source: 'walk_data',
      paint: {
        'fill-opacity': 0.66
      }
    });

    //loading public transit coverage data
    map.addSource('pt_data', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus/refs/heads/main/totalpt.geojson'
    });

    //adding the public transit coverage data to the map
    map.addLayer({
      id: 'pt_data',
      type: 'fill',
      source: 'pt_data',
      paint: {
        'fill-opacity': 0.66
      }
    });

    map.addSource('boundaries', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus/refs/heads/main/peel_bound.geojson'
    });

    map.addLayer({
      id: 'boundaries',
      type: 'line',
      source: 'boundaries',
      paint: {
        'line-color': '#000000',
        'line-width': 2
      }
    });

    //setting both walking and public transit coverage layers to invisible at first because they will be activated later
    map.setLayoutProperty('walk_data', 'visibility', 'none');
    map.setLayoutProperty('pt_data', 'visibility', 'none');

    initCheckboxListeners();
      //ouline box for approximatelt ontario
const ontarioBbox = [-95.15625, 41.6766, -74.34375, 56.8594];
    // Add the geocoder to the map
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false, // Set to true if you want a marker at the location
      placeholder: 'Search for places or addresses',
      bbox: ontarioBbox, // Restrict results to Ontario
      countries: 'ca' // Further restrict to Canada
    });

    // Add geocoder to the map
    map.addControl(
      geocoder,
      'top-left' // Position og geocoder relative to map 
    );

    // listen for geocoder result event
    geocoder.on('result', (e) => {
      console.log('Selected location:', e.result);
    });
  });
  
  let selectedDay = null;
  let selectedTime = null;
  let selectedProgram = null;
  let foodProg = null;
  
  // Function to update filters when checkboxes are clicked
  function updateFilters() {
      console.log('Updating filters with day:', selectedDay, 'time:', selectedTime, 'program:', selectedProgram);
  
      // Only apply filters when ALL THREE are selected
      if (selectedDay && selectedTime && selectedProgram) {
          const timeIndex = { morning: 0, afternoon: 1, evening: 2 }[selectedTime];
          
          // Create day/time filter
          const dayTimeFilter = [
              '==',
              ['at', timeIndex, ['coalesce', ['get', selectedDay], ['literal', [0, 0, 0]]]],
              1
          ];
  
          // Create program filter
          const programFilter = selectedProgram === "Other" 
              ? [
                  '!',
                  ['match',
                      ['get', 'PROGRAM'],
                      ['Food Pantry', 'Food Bank', 'Soup Kitchen', 'Multi-Service'],
                      true,
                      false
                  ]
                ]
              : ['==', ['get', 'PROGRAM'], selectedProgram];
  
          // Apply both filters
          map.setFilter('food_data', ['all', dayTimeFilter, programFilter]);
      } else {
          // Show all features if not all three filters are selected
          map.setFilter('food_data', ['all']);
      }
  
      if (foodProg) updateLayers();
  }
  
  // Program type filter event listeners
  document.querySelectorAll('.program-option').forEach(item => {
      item.addEventListener('click', (e) => {
          e.preventDefault();
          selectedProgram = e.target.dataset.program;
  
          document.querySelectorAll('.program-option').forEach(opt => opt.classList.remove('active'));
          e.target.classList.add('active');
  
          updateFilters();
      });
  });
  
// Day filter event listener
document.querySelectorAll('.day-option').forEach(item => {
  item.addEventListener('click', (e) => {
      e.preventDefault();
      selectedDay = e.target.dataset.day;
      console.log('Day selected:', selectedDay); // Debug log
      document.querySelectorAll('.day-option').forEach(opt => opt.classList.remove('active'));
      e.target.classList.add('active');
      updateFilters();
  });
});

// Time filter event listener 
document.querySelectorAll('.time-option').forEach(item => {
  item.addEventListener('click', (e) => {
      e.preventDefault();
      selectedTime = e.target.dataset.time;
      console.log('Time selected:', selectedTime); // Debug log
      document.querySelectorAll('.time-option').forEach(opt => opt.classList.remove('active'));
      e.target.classList.add('active');
      updateFilters();
  });
});

// Program filter event listener
document.querySelectorAll('.program-option').forEach(item => {
  item.addEventListener('click', (e) => {
      e.preventDefault();
      selectedProgram = e.target.dataset.program;
      console.log('Program selected:', selectedProgram); // Debug log
      document.querySelectorAll('.program-option').forEach(opt => opt.classList.remove('active'));
      e.target.classList.add('active');
      updateFilters();
  });
});

  document.getElementById('reset-filters').addEventListener('click', () => {
    selectedDay = null;
    selectedTime = null;
    selectedProgram = null;

    document.querySelectorAll('.day-option, .time-option, .program-option').forEach(opt => opt.classList.remove('active'));

    map.setFilter('food_data', ['all']);

    document.getElementById('walk_pt').checked = false;
    document.getElementById('walk').disabled = true;
    document.getElementById('walk_pt').disabled = true;

    map.flyTo({
      center: [-79.7018518888638, 43.668552107715904],
      zoom: 9,
      essential: true
    });

    map.setLayoutProperty('walk_data', 'visibility', 'none');
    map.setLayoutProperty('pt_data', 'visibility', 'none');

    document.getElementById('walk_legend').style.display = 'none';
    document.getElementById('pt_legend').style.display = 'none';
    // **Reset program details container**
    document.getElementById('program-name').textContent = "Select a program";
    document.getElementById('program-address').textContent = "";
    document.getElementById('program-phone').textContent = "";
    document.getElementById('program-hours').textContent = "";
    document.getElementById('program-website').textContent="";
    
  });

  //-------------------------------------------------------------------------------------------------------------------------

  //From Khalis separate files
  map.on('click', 'food_data', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const programName = e.features[0].properties.NAME || "Unknown Name";
    const programAddress = e.features[0].properties.ADRESS || "Unknown Address";
    const programWebsite = e.features[0].properties.WEBSITE || "No Available Website";
    const programPhone = e.features[0].properties.PHONE || "No Known Phone Number";
    const programHours = e.features[0].properties.HOURS || "Unknown Hours";


    map.flyTo({
      center: coordinates,
      zoom: 11,
      essential: true
    });
    //info container data 
    foodProg = e.features[0].properties.OBJECTID.toString();
    console.log('foodProg set to:', foodProg);

    document.getElementById('walk').disabled = false;
    document.getElementById('walk_pt').disabled = false;

    // Update the details container
    document.getElementById('program-name').textContent = programName;
    document.getElementById('program-address').textContent = programAddress;
    document.getElementById('program-phone').textContent = programPhone;
    document.getElementById('program-hours').textContent = programHours;
    // get website URL 
    const websiteElement = document.getElementById('program-website');
    if (programWebsite) {
        websiteElement.innerHTML = `<a href="${programWebsite}" target="_blank">${programWebsite}</a>`;
    } else {
        websiteElement.textContent = "No website available";
    }
    document.getElementById('program-website').innerHTML = programWebsite ? `<a href="${programWebsite}" target="_blank">${programWebsite}</a>` : "No website available";


    initCheckboxListeners();

    updateLayers();
  });

  function initCheckboxListeners() {
    document.getElementById('walk').addEventListener('change', function () {
      console.log('Walk checkbox toggled:', this.checked);
      if (this.checked) {
        document.getElementById('walk_pt').checked = false; // Disable the other checkbox
      } else {
        document.getElementById('walk_pt').checked = true; // Re-enable the other checkbox
      }
      updateLayers(); // Update the map layers
    });

    document.getElementById('walk_pt').addEventListener('change', function () {
      console.log('Walk + PT checkbox toggled:', this.checked);
      if (this.checked) {
        document.getElementById('walk').checked = false; // Disable the other checkbox
      } else {
        document.getElementById('walk').checked = true; // Re-enable the other checkbox
      }
      updateLayers(); // Update the map layers
    });
  };

  function updateLayers() {
    if (!foodProg) return;

    if (document.getElementById('walk').checked) {
      filterWalkPolygons(foodProg);
      map.setLayoutProperty('pt_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'block';
      document.getElementById('pt_legend').style.display = 'none';
    } else if (document.getElementById('walk_pt').checked) {
      filterPTPolygons(foodProg);
      map.setLayoutProperty('walk_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'none';
      document.getElementById('pt_legend').style.display = 'block';
    } else {
      map.setLayoutProperty('walk_data', 'visibility', 'none');
      map.setLayoutProperty('pt_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'none';
      document.getElementById('pt_legend').style.display = 'none';
    }

  }

  function filterWalkPolygons(foodProg) {
    // Set visibility
    map.setLayoutProperty('walk_data', 'visibility', 'visible');

    map.setPaintProperty('walk_data', 'fill-color', [
      'case',
      ['==', ['get', foodProg], null], 'rgba(0,0,0,0)',
      ['step', ['to-number', ['get', foodProg]],
        '#063b00', 10,
        '#089000', 20,
        '#0eff00', 30,
        'rgba(0,0,0,0)'
      ]
    ]);
  }

  function filterPTPolygons(foodProg) {

    concatProg = foodProg + '_' + selectedDay + selectedTime;

    map.setLayoutProperty('pt_data', 'visibility', 'visible');

    map.setPaintProperty('pt_data', 'fill-color', [
      'case',
      ['==', ['get', concatProg], null], 'rgba(0,0,0,0)',
      ['step', ['to-number', ['get', concatProg]],
        '#4c00a4', 30,
        '#00bbd1', 45,
        '#00fff3', 60,
        'rgba(0,0,0,0)'
      ]
    ]);
  }
  //time indicator stuff 
  function updateTimeIndicator() {
    const timeIndicator = document.getElementById('time-indicator');
    
    // Create parts of the message based on selections
    const dayPart = selectedDay ? selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1) : "";
    const timePart = selectedTime ? selectedTime.charAt(0).toUpperCase() + selectedTime.slice(1) : "";
    const programPart = selectedProgram || "";
    
    // Build the full message
    let message = "";
    
    if (dayPart || timePart || programPart) {
        message = "Showing: ";
        
        const parts = [];
        if (dayPart) parts.push(dayPart);
        if (timePart) parts.push(timePart);
        if (programPart) parts.push(programPart);
        
        message += parts.join(" • ");
    } else {
        message = "No filters selected";
    }
    
    // Update the element
    timeIndicator.textContent = message;
}

// Event listeners for day options
document.querySelectorAll('.day-option').forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        selectedDay = this.getAttribute('data-day');
        document.getElementById('day-dropdown').textContent = this.textContent;
        updateTimeIndicator();
    });
});

// Event listeners for time options
document.querySelectorAll('.time-option').forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        selectedTime = this.getAttribute('data-time');
        document.getElementById('time-dropdown').textContent = this.textContent;
        updateTimeIndicator();
    });
});

// Event listeners for program options
document.querySelectorAll('.program-option').forEach(option => {
    option.addEventListener('click', function(e) {
        e.preventDefault();
        selectedProgram = this.getAttribute('data-program');
        document.getElementById('program-dropdown').textContent = this.textContent;
        updateTimeIndicator();
    });
});

// Reset filters button
document.getElementById('reset-filters').addEventListener('click', function() {
    // Reset selected values
    selectedDay = null;
    selectedTime = null;
    selectedProgram = null;
    
    // Reset dropdown button text
    document.getElementById('day-dropdown').textContent = 'Select a Day';
    document.getElementById('time-dropdown').textContent = 'Select a Time';
    document.getElementById('program-dropdown').textContent = 'Type of Program';
    
    // Update the time indicator
    updateTimeIndicator();
});

// Initialize the time indicator
updateTimeIndicator();
  

}
);
