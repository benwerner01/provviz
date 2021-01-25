import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Section from './Section';
import ColorPicker from '../ColorPicker';
import VisualisationContext, { defaultSettings, ProvenanceView, PROVENANCE_VIEW_NAMES } from '../contexts/VisualisationContext';
import { NodeVariant, NODE_VARIANTS } from '../../util/document';
import Namespace from '../Namespace';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: 300,
    marginBottom: theme.spacing(1),
  },
  formControlCheckbox: {
    display: 'block',
  },
  formControlLabel: {
    marginLeft: 0,
  },
}));

type SettingsTabProps = {

}

const SettingsTab: React.FC<SettingsTabProps> = () => {
  const classes = useStyles();
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);

  const handleColorChange = (variant: NodeVariant) => (color: string) => {
    setVisualisationSettings((prev) => ({
      ...prev,
      palette: { ...prev.palette, [variant]: color },
    }));
  };

  const handleColorClear = (variant: NodeVariant) => () => {
    setVisualisationSettings((prev) => ({
      ...prev,
      palette: { ...prev.palette, [variant]: defaultSettings.palette[variant] },
    }));
  };

  const handleProvenanceViewChange = (e: React.ChangeEvent<{ value: unknown; }>) => {
    setVisualisationSettings((prev) => ({
      ...prev,
      view: (e.target.value as ProvenanceView) || null,
    }));
  };

  const { palette, view } = visualisationSettings;

  return (
    <>
      <Section name="Namespace"><Namespace /></Section>
      <Section name="Visualisation">
        <FormControl className={classes.formControl}>
          <InputLabel id="provenance-view-select-label">Provenance View</InputLabel>
          <Select
            labelId="provenance-view-select-label"
            id="provenance-view-select"
            value={view || ''}
            onChange={handleProvenanceViewChange}
          >
            <MenuItem value="">None</MenuItem>
            {PROVENANCE_VIEW_NAMES.map((name) => (
              <MenuItem key={name} value={name}>{`${name} View`}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {NODE_VARIANTS.map((variant) => (
          <ColorPicker
            mb={1}
            key={variant}
            label={`Default ${variant[0].toUpperCase()}${variant.slice(1)} Color`}
            initialColor={palette[variant]}
            onChange={handleColorChange(variant)}
            onClear={defaultSettings.palette[variant] === palette[variant]
              ? undefined
              : handleColorClear(variant)}
          />
        ))}
        <FormControl className={classes.formControlCheckbox}>
          <FormControlLabel
            className={classes.formControlLabel}
            labelPlacement="start"
            control={(
              <Checkbox
                checked={visualisationSettings.hideAllNodeProperties}
                onChange={({ target }) => setVisualisationSettings((prev) => ({
                  ...prev, hideAllNodeProperties: target.checked,
                }))}
                color="primary"
                name="hide"
              />
            )}
            label="Hide All Properties"
          />
        </FormControl>
      </Section>
    </>
  );
};

export default SettingsTab;
