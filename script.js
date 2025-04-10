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
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus-presentation1/refs/heads/main/data/peel_fp.geojson' // link to git hub raw data file
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
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus-presentation1/refs/heads/main/data/walk.geojson'
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
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus-presentation1/refs/heads/main/data/totalpt.geojson'
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

    //adding the peel region boundaries to the map 
    map.addSource('boundaries', {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/carolinenee/nucleus-presentation1/refs/heads/main/data/peel_bound.geojson'
    });

    map.addLayer({
      id: 'boundaries',
      type: 'line',
      source: 'boundaries',
      paint: {
        'line-color': '#000000',
        'line-width': 1
      }
    });

    //setting both walking and public transit coverage layers to invisible at first because they will be activated later
    map.setLayoutProperty('walk_data', 'visibility', 'none');
    map.setLayoutProperty('pt_data', 'visibility', 'none');

    initCheckboxListeners();

    //ouline box for peel region 
    const peelBbox = [-80.2, 43.4, -79.1, 44.2];

    // Add the geocoder to the map
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for places or addresses',
      bbox: peelBbox, // Restrict results to peel
      countries: 'ca' // Further restrict to Canada
    });

    // Add geocoder to the map
    map.addControl(
      geocoder,
      'top-right' // Position og geocoder relative to map 
    );

    // listen for geocoder result event
    geocoder.on('result', (e) => {
      console.log('Selected location:', e.result);
    });
  });

  //innitially no selections for day, time or food program 
  let selectedDay = null;
  let selectedTime = null;
  let selectedProgram = null;
  let foodProg = null;

  // Updates map filters based on user selections but only applies filters when all three selections are made.
  function updateFilters() {
    console.log('Updating filters with day:', selectedDay, 'time:', selectedTime, 'program:', selectedProgram);

    let filter = ['all']; // Start with an 'all' filter

    // Only apply filters when ALL THREE are selected
    if (selectedDay && selectedTime && selectedProgram) {
      const timeIndex = { morning: 0, afternoon: 1, evening: 2 }[selectedTime];
      const dayTimeFilter = [
        '==',
        ['at', timeIndex, ['coalesce', ['get', selectedDay], ['literal', [0, 0, 0]]]],
        1
      ];
      filter.push(dayTimeFilter);

      const programFilter = selectedProgram === "Other"
        ? [
          '!',
          ['match',
            ['downcase', ['get', 'LEGEND']], // Case-insensitive check
            ['food pantry', 'food bank', 'community meal program (soup kitchen)', 'multi-service program'],
            true,
            false
          ]
        ]
        : ['==', ['downcase', ['get', 'LEGEND']], selectedProgram.toLowerCase()];

      filter.push(programFilter);
    }

    // Apply the final filter
    map.setFilter('food_data', filter);

    if (foodProg) updateLayers();
  }

  //event listener for closing popup 
  document.querySelector('.close-btn').addEventListener('click', function () {
    document.getElementById('popup').style.display = 'none';
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

  // everything the page needs to do to reset (filters, innitial map view, remove program details content and legend)
  document.getElementById('reset-filters').addEventListener('click', () => {
    // unselect day time and program for filtering
    selectedDay = null;
    selectedTime = null;
    selectedProgram = null;

    // Reset the text on the dropdown buttons 
    document.getElementById('day-dropdown').textContent = 'Select a Day';
    document.getElementById('time-dropdown').textContent = 'Select a Time';
    document.getElementById('program-dropdown').textContent = 'Type of Program';

    document.querySelectorAll('.day-option, .time-option, .program-option').forEach(opt => opt.classList.remove('active'));

    // show all food programs again (remove filtering)
    map.setFilter('food_data', ['all']);

    // remove chekmarks for hexgrid selection
    document.getElementById('walk').checked = false;
    document.getElementById('walk').disabled = true;
    document.getElementById('walk_pt').checked = false;
    document.getElementById('walk_pt').disabled = true;
    // go back to the maps innitial view 
    map.flyTo({
      center: [-79.7018518888638, 43.668552107715904],
      zoom: 9,
      essential: true
    });
    // remove hexgrid 
    map.setLayoutProperty('walk_data', 'visibility', 'none');
    map.setLayoutProperty('pt_data', 'visibility', 'none');

    document.getElementById('walk_legend').style.display = 'none';
    document.getElementById('pt_legend').style.display = 'none';
    // Reset program details container so that no location is selected
    document.getElementById('program-name').textContent = "Select a program";
    document.getElementById('program-address').textContent = "";
    document.getElementById('program-phone').textContent = "";
    document.getElementById('program-hours').textContent = "";
    document.getElementById('program-website').textContent = "";
  });

  //the function for the button that shows the walking network analysis for all the food programs
  function showTotalWalk() {
    selectedDay = null;
    selectedTime = null;
    selectedProgram = null;

    // Resets dropdown button text
    document.getElementById('day-dropdown').textContent = 'Select a Day';
    document.getElementById('time-dropdown').textContent = 'Select a Time';
    document.getElementById('program-dropdown').textContent = 'Type of Program';

    //Removes all the previous filters
    document.querySelectorAll('.day-option, .time-option, .program-option').forEach(opt => opt.classList.remove('active'));

    // Resets point data filter
    map.setFilter('food_data', ['all']);

    // Disables the Walk/Public Transit filters used for a single location
    document.getElementById('walk').checked = false;
    document.getElementById('walk').disabled = true;
    document.getElementById('walk_pt').checked = false;
    document.getElementById('walk_pt').disabled = true;

    // Resets the zoom and positioning of the map to the initial view
    map.flyTo({
      center: [-79.7018518888638, 43.668552107715904],
      zoom: 9,
      essential: true
    });

    //disables public transit hexgrid visibility
    map.setLayoutProperty('pt_data', 'visibility', 'none');

    //resets the program bio information
    document.getElementById('pt_legend').style.display = 'none';
    document.getElementById('program-name').textContent = "Select a program";
    document.getElementById('program-address').textContent = "";
    document.getElementById('program-phone').textContent = "";
    document.getElementById('program-hours').textContent = "";
    document.getElementById('program-website').textContent = "";

    //turns on all the walk network analyses for all locations
    map.setLayoutProperty('walk_data', 'visibility', 'visible');
    map.setPaintProperty('walk_data', 'fill-color', [
      'case',
      ['==', ['get', 'lowest_travel'], null], 'rgba(0,0,0,0)',
      ['step', ['to-number', ['get', 'lowest_travel']],
        '#063b00', 10,
        '#089000', 20,
        '#0eff00', 30,
        'rgba(0,0,0,0)'
      ]
    ]);
    document.getElementById('walk_legend').style.display = 'block'; //enables the legend

  };

  document.getElementById('show-all-walk').addEventListener('click', showTotalWalk); //encoding the event listener that shows all walking hexgrids once the user clicks on the button

  //the function for the button that shows the public transit network analysis for all the food programs
  function showTotalPT() {
    selectedDay = null;
    selectedTime = null;
    selectedProgram = null;

    // Reset dropdown button text
    document.getElementById('day-dropdown').textContent = 'Select a Day';
    document.getElementById('time-dropdown').textContent = 'Select a Time';
    document.getElementById('program-dropdown').textContent = 'Type of Program';

    //Removes all the previous filters
    document.querySelectorAll('.day-option, .time-option, .program-option').forEach(opt => opt.classList.remove('active'));

    // Resets point data filter
    map.setFilter('food_data', ['all']);

    // Disables the Walk/Public Transit filters used for a single location
    document.getElementById('walk').checked = false;
    document.getElementById('walk').disabled = true;
    document.getElementById('walk_pt').checked = false;
    document.getElementById('walk_pt').disabled = true;

    // Resets the zoom and positioning of the map to the initial view
    map.flyTo({
      center: [-79.7018518888638, 43.668552107715904],
      zoom: 9,
      essential: true
    });

    //disables walking hexgrid visibility
    map.setLayoutProperty('walk_data', 'visibility', 'none');

    //resets the program bio information
    document.getElementById('walk_legend').style.display = 'none';
    document.getElementById('program-name').textContent = "Select a program";
    document.getElementById('program-address').textContent = "";
    document.getElementById('program-phone').textContent = "";
    document.getElementById('program-hours').textContent = "";
    document.getElementById('program-website').textContent = "";

    //turns on all the public transit network analyses for all locations
    map.setLayoutProperty('pt_data', 'visibility', 'visible');
    map.setPaintProperty('pt_data', 'fill-color', [
      'case',
      ['==', ['get', 'lowest_travel'], null], 'rgba(0,0,0,0)',
      ['step', ['to-number', ['get', 'lowest_travel']],
        '#4c00a4', 10,
        '#00bbd1', 20,
        '#00fff3', 30,
        'rgba(0,0,0,0)'
      ]
    ]);

    document.getElementById('pt_legend').style.display = 'block'; //enables the legend

  };

  document.getElementById('show-all-pt').addEventListener('click', showTotalPT); //encoding the event listener that shows all walking hexgrids once the user clicks on the button

  //-------------------------------------------------------------------------------------------------------------------------

  //From Khalis separate files
  map.on('click', 'food_data', (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const programName = e.features[0].properties.NAME || "Unknown Name";
    const programAddress = e.features[0].properties.ADDRESS || "Unknown Address";
    const programWebsite = e.features[0].properties.WEBSITE || "No Available Website";
    const programPhone = e.features[0].properties.PHONE || "No Known Phone Number";
    const programHours = e.features[0].properties.HOURS || "Unknown Hours";

    map.flyTo({
      center: coordinates,
      zoom: 11,
      essential: true
    });

    //show legend row 
    document.getElementById('legend-row').style.display = 'block';

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
      console.log('PT checkbox toggled:', this.checked);
      if (this.checked) {
        document.getElementById('walk').checked = false; // Disable the other checkbox
      } else {
        document.getElementById('walk').checked = true; // Re-enable the other checkbox
      }
      updateLayers(); // Update the map layers
    });
  };

  //A function to update layer visibility based on the user choice (walking/public transit filter)
  function updateLayers() {
    if (!foodProg) return;

    if (document.getElementById('walk').checked) {
      filterWalkPolygons(foodProg);
      map.setLayoutProperty('pt_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'block';
      document.getElementById('pt_legend').style.display = 'none'; //this statement disables the public transit layer and legend and turns on the legend on the walking hexgrids if the user chooses to enable the walking data
    } else if (document.getElementById('walk_pt').checked) {
      filterPTPolygons(foodProg);
      map.setLayoutProperty('walk_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'none';
      document.getElementById('pt_legend').style.display = 'block'; //this statement disables the walking hexgrids and its legend and enables the public transit data and legend if the user chooses to enable the walking data
    } else {
      map.setLayoutProperty('walk_data', 'visibility', 'none');
      map.setLayoutProperty('pt_data', 'visibility', 'none');
      document.getElementById('walk_legend').style.display = 'none';
      document.getElementById('pt_legend').style.display = 'none'; //If neither of the options are chosen (e.g., the filters are reset), then both layers are disabled
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

  //this function shows the hexgrid on public transit for an individual food program based on the filters
  function filterPTPolygons(foodProg) {

    concatProg = foodProg + '_' + selectedDay + selectedTime;

    map.setLayoutProperty('pt_data', 'visibility', 'visible');

    map.setPaintProperty('pt_data', 'fill-color', [
      'case',
      ['==', ['get', concatProg], null], 'rgba(0,0,0,0)',
      ['step', ['to-number', ['get', concatProg]],
        '#4c00a4', 10,
        '#00bbd1', 20,
        '#00fff3', 30,
        'rgba(0,0,0,0)'
      ]
    ]);
  }

  // Event listeners for day options
  document.querySelectorAll('.day-option').forEach(option => {
    option.addEventListener('click', function (e) {
      e.preventDefault();
      selectedDay = this.getAttribute('data-day');
      document.getElementById('day-dropdown').textContent = this.textContent;
    });
  });

  // Event listeners for time options
  document.querySelectorAll('.time-option').forEach(option => {
    option.addEventListener('click', function (e) {
      e.preventDefault();
      selectedTime = this.getAttribute('data-time');
      document.getElementById('time-dropdown').textContent = this.textContent;
    });
  });

  // Event listeners for program options
  document.querySelectorAll('.program-option').forEach(option => {
    option.addEventListener('click', function (e) {
      e.preventDefault();
      selectedProgram = this.getAttribute('data-program');
      document.getElementById('program-dropdown').textContent = this.textContent;
    });
  });


});