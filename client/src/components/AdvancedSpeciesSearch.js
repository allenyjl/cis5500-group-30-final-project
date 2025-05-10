// AdvancedSpeciesSearch.js
import { useState, useCallback } from 'react';
import { Checkbox, Container, FormControlLabel, Grid, Slider, TextField, Button, Link } from '@mui/material';
import LazyTable from './LazyTable';
import { SpeciesModal}  from './SpeciesModal';

const API_URL = 'http://localhost:8080';

export default function AdvancedSpeciesSearch() {
    // Form states (what user inputs)
    const [scientificName, setScientificName] = useState('');
    const [depth, setDepth] = useState([0, 11000]);
    const [sightings, setSightings] = useState([1, 200000]);
    const [tempEnabled, setTempEnabled] = useState(false);
    const [temperature, setTemperature] = useState([0, 40]);
    const [marine, setMarine] = useState(false);
    const [brackish, setBrackish] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [loadingSpecies, setLoadingSpecies] = useState(false);

    // Function to fetch species details
    const fetchSpeciesDetails = async (scientificName) => {
      setLoadingSpecies(true);
      try {
          const response = await fetch(`${API_URL}/species/details/${encodeURIComponent(scientificName)}`);
          
          if (!response.ok) {
              const errorData = await response.json();
              if (response.status === 404) {
                  console.error('Species not found:', errorData.message);
                  setSelectedSpecies({ error: 'Species not found' });
              } else {
                  console.error('Server error:', errorData.message);
                  setSelectedSpecies({ error: 'Server error occurred' });
              }
              return;
          }
  
          const data = await response.json();
          setSelectedSpecies(data);
      } catch (error) {
          console.error('Network error:', error);
          setSelectedSpecies({ error: 'Network error occurred' });
      } finally {
          setLoadingSpecies(false);
      }
    };

    const columns = [
        {
            field: 'scientificName',
            headerName: 'Scientific Name',
            width: 300,
            renderCell: (row) => (
                <Link
                  component="span"  // using span instead of button
                  onClick={() => {
                    setModalOpen(true);
                    fetchSpeciesDetails(row.scientificName);
                  }}
                  sx={{ 
                    color: 'primary.main',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {row.scientificName}
                </Link>
              )
        },
        { field: 'num_sightings', headerName: 'Number of Sightings', width: 200 }
    ];

    // Search state (what we actually search with)
    const [searchParams, setSearchParams] = useState({
        scientificName: '',
        depth: [0, 11000],
        sightings: [1, 1000000],
        tempEnabled: false,
        temperature: [0, 40],
        marine: false,
        brackish: false
    });

    const handleSearch = () => {
        // Update search parameters only when search is clicked
        setSearchParams({
            scientificName,
            depth,
            sightings,
            tempEnabled,
            temperature,
            marine,
            brackish
        });
    };

    // Create URL based on search parameters, not form state
    const getSearchUrl = useCallback(() => {
      const params = new URLSearchParams({
          scientificName: searchParams.scientificName,
          depth_min: searchParams.depth[0],
          depth_max: searchParams.depth[1],
          sightings_min: searchParams.sightings[0],
          sightings_max: searchParams.sightings[1],
          marine: searchParams.marine,
          brackish: searchParams.brackish, // This line is unchanged
          page_size: 10 // Add page size here
      });
  
      if (searchParams.tempEnabled) {
          params.append('temp_min', searchParams.temperature[0]);
          params.append('temp_max', searchParams.temperature[1]);
      }
  
      // Add page number to the URL separately
      const url = `${API_URL}/search_species?${params.toString()}`;
      return url;
  }, [searchParams]);

    return (
        <Container>
            <h2>Advanced Species Search</h2>
            <Grid container spacing={6}>
                {/* Scientific Name with Search Button */}
                <Grid item xs={12}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={10}>
                            <TextField
                                label="Scientific Name"
                                value={scientificName}
                                onChange={(e) => setScientificName(e.target.value)}
                                style={{ width: "100%" }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={2}>
                            <Button 
                                variant="contained" 
                                onClick={handleSearch}
                                fullWidth
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Depth Slider */}
                <Grid item xs={6}>
                    <p>Depth Range (m)</p>
                    <Slider
                        value={depth}
                        min={0}
                        max={11000}
                        onChange={(e, newValue) => setDepth(newValue)}
                        valueLabelDisplay='auto'
                    />
                </Grid>

                {/* Sightings Slider */}
                <Grid item xs={6}>
                    <p>Number of Sightings</p>
                    <Slider
                        value={sightings}
                        min={1}
                        max={200000}
                        onChange={(e, newValue) => setSightings(newValue)}
                        valueLabelDisplay='auto'
                    />
                </Grid>

                {/* Temperature Section */}
                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={tempEnabled}
                                onChange={(e) => setTempEnabled(e.target.checked)}
                            />
                        }
                        label="Filter by Temperature"
                    />
                </Grid>
                {tempEnabled && (
                    <Grid item xs={12}>
                        <p>Temperature Range (°C)</p>
                        <Slider
                            value={temperature}
                            min={0}
                            max={40}
                            onChange={(e, newValue) => setTemperature(newValue)}
                            valueLabelDisplay='auto'
                        />
                    </Grid>
                )}

                {/* Habitat Checkboxes */}
                <Grid item xs={6}>
                    <FormControlLabel
                        control={<Checkbox checked={marine} onChange={(e) => setMarine(e.target.checked)} />}
                        label="Marine"
                    />
                </Grid>
                <Grid item xs={6}>
                    <FormControlLabel
                        control={<Checkbox checked={brackish} onChange={(e) => setBrackish(e.target.checked)} />}
                        label="Brackish"
                    />
                </Grid>
            </Grid>

            <LazyTable
                route={getSearchUrl()}
                columns={columns}
                defaultPageSize={10}
                rowsPerPageOptions={[5, 10, 25]}
            />

            {/* Modal component */}
            <SpeciesModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                speciesData={selectedSpecies}
                isLoading={loadingSpecies}
            />
        </Container>
    );
}