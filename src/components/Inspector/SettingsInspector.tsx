import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import Section from './Section';
import ColorPicker from '../ColorPicker';
import VisualisationContext, { defaultSettings, ProvenanceView, PROVENANCE_VIEW_NAMES } from '../contexts/VisualisationContext';
import { NodeVariant, NODE_VARIANTS } from '../../util/definition/document';
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

type SettingsInspectorProps = {

}

const SettingsInspector: React.FC<SettingsInspectorProps> = () => {
  const classes = useStyles();
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);

  const [namespaceOpen, setNamespaceOpen] = useState<boolean>(false);
  const [visualisationOpen, setVisualisationOpen] = useState<boolean>(false);

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

  const handleResetVisualisationSettings = () => setVisualisationSettings(defaultSettings);

  const { palette, view } = visualisationSettings;

  return (
    <>
      <Section
        open={namespaceOpen}
        toggleOpen={() => setNamespaceOpen(!namespaceOpen)}
        name="Namespace"
      >
        <Namespace />
      </Section>
      <Section
        open={visualisationOpen}
        toggleOpen={() => setVisualisationOpen(!visualisationOpen)}
        name="Visualisation"
      >
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
                checked={visualisationSettings.hideAllNodeAttributes}
                onChange={({ target }) => setVisualisationSettings((prev) => ({
                  ...prev, hideAllNodeAttributes: target.checked,
                }))}
                color="primary"
                name="hide"
              />
            )}
            label="Hide All Attributes"
          />
        </FormControl>
      </Section>
      <Button variant="contained" onClick={handleResetVisualisationSettings}>
        Reset Visualisation Settings
      </Button>
    </>
  );
};

export default SettingsInspector;
