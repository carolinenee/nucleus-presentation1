# Food Programs in Peel Region: Web Map for Nucleus Independent Living

This web map was created by Caroline Nee, Muhammad Khalis bin Samion, and Polina Gorn for **Nucleus Independent Living**, as part of the **Sandbox Initiative** in *GGR472H1: Developing Web Maps*.  
The purpose of the map is to explore food deserts in the Peel Region (Mississauga, Brampton, and Caledon) based on several factors, including:

- Day of the week  
- Time of day  
- Mode of transit  
- Type of food program  

This map demonstrates that food deserts can exist even when food programs are present in the area, due to varying accessibility constraints.

---

## Data Sources

1. **Location of Food Programmes in Peel Region**  
   [Peel Data Portal - Food Programmes Layer](https://data.peelregion.ca/datasets/857c09ef7fbb41e18fc9c119aee8ee38_0/explore?location=43.713594%2C-79.809875%2C10.82)

2. **Road Network Data**  
   OpenStreetMap road network in Protocol Buffer Binary Format (PBF):  
   [BBBike Extract Service](https://extract.bbbike.org/)

3. **Public Transit Data (GTFS)**  
   General Transit Feed Specification (GTFS) datasets from the following transit agencies:
   - [GO Transit (Metrolinx)](https://www.metrolinx.com/en/about-us/open-data)
   - [MiWay (Mississauga)](https://www.mississauga.ca/miway-transit/developer-download/)
   - [Brampton Transit](https://geohub.brampton.ca/datasets/a355aabd5a8c490186bdce559c9c75fb/about)

---

## Methodology

**[r5py](https://r5py.readthedocs.io/)** was used to perform multimodal network analysis. The resulting accessibility data was visualized on the map using a hexgrid, showing food program accessibility by **walking** and **public transit**.

---

## Web Map Interactivity

To explore the map, users can:
1. Select the **day of the week** of interest  
2. Select the **time of day** (Morning / Afternoon / Evening)  
3. Choose the **type of food program** (e.g., Food bank, Soup kitchen, All)

Filtered results will display food program locations that match all selected criteria.  
Clicking a location reveals a **location profile** and the option to view **network analysis results** (walking or public transit).

---

## Limitations

- The network analysis is based on **static GTFS data** as of **April 2025**.
- Transit schedules and service availability may change, so the analysis should be **periodically updated** using `r5py` to maintain accuracy.

---

## Contact 

For more information or questions, please contact the authors through their emails:
- Caroline Nee:
- Muhammad Khalis bin Samion:
- Polina Gorn: polinavgorn@gmail.com
