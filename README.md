# Toronto Public Library Map

An interactive map visualizing statistics about Toronto Public Library branches bewteen 2013 and 2023. 

## To Do
- [x] Make point styling breakpoints dynamic (currently jenks 5 classes)
- [ ] Legend. 
- [ ] Max point styling dynamic based on browser window size
- [ ] Merge Osborne and Merril with Lillian H. Smith. 
- [ ] Voronoi?
- [ ] Add aggregation by sq. ft, population, etc.
 
## Tools
MapLibre GL JS, Chart.js, simple-statistics, D3. Made with vanilla JS, HTML, CSS. 

## Data Sources:
All data from the Toronto Open Data Portal.
- Toronto region boundary (https://open.toronto.ca/dataset/regional-municipal-boundary/) 
- Library branch general information (https://open.toronto.ca/dataset/library-branch-general-information/)
- Library visits (https://open.toronto.ca/dataset/library-visits/)
- Library circulation (https://open.toronto.ca/dataset/library-circulation/)
- Library card registrations (https://open.toronto.ca/dataset/library-card-registrations/)

data/libraries.geojson joins all four of the library datasets, minus branches without coordinates. The fields cards_{year} correspond to card registrations, visit_{year} to visits, and circulation_{year} to circulation. 