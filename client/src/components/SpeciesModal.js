import { Modal, Box } from '@mui/material';
import { SpeciesCard } from './SpeciesCard';

export const SpeciesModal = ({ open, onClose, speciesData, isLoading }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="species-modal"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: 800,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <SpeciesCard data={speciesData} isLoading={isLoading} />
      </Box>
    </Modal>
  );
};