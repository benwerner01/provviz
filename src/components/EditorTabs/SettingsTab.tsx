import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Section from './Section';
import ColorPicker from '../ColorPicker';
import VisualisationContext, { defaultSettings } from '../contexts/VisualisationContext';
import { NodeVariant, NODE_VARIANTS } from '../../util/document';

const useStyles = makeStyles((theme) => ({

}));

type SettingsTabProps = {

}

const SettingsTab: React.FC<SettingsTabProps> = () => {
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);

  const handleColorChange = (variant: NodeVariant) => (color: string) => {
    setVisualisationSettings((prev) => ({
      ...prev,
      palette: { ...prev.palette, [variant]: color },
    }));
  };

  const handleClear = (variant: NodeVariant) => () => {
    setVisualisationSettings((prev) => ({
      ...prev,
      palette: { ...prev.palette, [variant]: defaultSettings.palette[variant] },
    }));
  };

  const { palette } = visualisationSettings;

  return (
    <>
      <Section name="Visualisation">
        {NODE_VARIANTS.map((variant) => (
          <ColorPicker
            mb={1}
            label={`Default ${variant[0].toUpperCase()}${variant.slice(1)} Color`}
            initialColor={palette[variant]}
            onChange={handleColorChange(variant)}
            onClear={defaultSettings.palette[variant] === palette[variant]
              ? undefined
              : handleClear(variant)}
          />
        ))}
      </Section>
    </>
  );
};

export default SettingsTab;
