import { Card, CardContent, Typography, Grid, Divider } from '@mui/material';

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return 'Data not available';
  return `${value.toFixed(2)} ${unit}`;
};

const formatBoolean = (value) => {
  if (value === null || value === undefined) return 'Data not available';
  return value ? 'Yes' : 'No';
};

export const SpeciesCard = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">
            Loading details for species...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" color="error">
            Error loading species data
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Add handling for error messages
  if (data.error) {
    return (
        <Card>
            <CardContent>
                <Typography variant="h6" color="error">
                    {data.error}
                </Typography>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header Section */}
        <Typography variant="h5" gutterBottom>
          {data.scientificName}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Family: {data.family || 'Data not available'}
        </Typography>
        
        <Divider sx={{ my: 2 }} />

        {/* Habitat Section */}
        <Typography variant="h6" gutterBottom>
          Habitat Classification
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>Marine: {formatBoolean(data.marine)}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Brackish: {formatBoolean(data.brackish)}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Environmental Parameters */}
        <Typography variant="h6" gutterBottom>
          Environmental Parameters
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          All values represent averages from collected data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>Depth: {formatValue(data.averagedepth, 'm')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Temperature: {formatValue(data.averagetemperature, '°C')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Salinity: {formatValue(data.averagesalinity, 'PSU')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>pH: {formatValue(data.averageph, '')}</Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Chemical Parameters */}
        <Typography variant="h6" gutterBottom>
          Chemical Parameters
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          All values represent averages from collected data
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography>Phosphate: {formatValue(data.averagephosphate, 'μmol/L')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Nitrate: {formatValue(data.averagenitrate, 'μmol/L')}</Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography>Chlorophyll: {formatValue(data.averagechlorophyll, 'mg/m³')}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};