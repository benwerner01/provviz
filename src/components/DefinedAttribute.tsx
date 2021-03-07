import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { NodeVariant, PROVAttributeDefinition, PROVVIZ_SHAPES } from '../util/document';
import queries from '../util/queries';
import DocumentContext from './contexts/DocumentContext';
import mutations from '../util/mutations';
import VisualisationContext from './contexts/VisualisationContext';
import ColorPicker from './ColorPicker';

const useDateTimeStyles = makeStyles((theme) => ({
  root: {
    display: 'block',
    marginBottom: theme.spacing(2),
  },
}));

type DateTimeAttributeProps = {
  variant: NodeVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const DateTimeAttribute: React.FC<DateTimeAttributeProps> = ({
  variant, domainID, attribute,
}) => {
  const classes = useDateTimeStyles();
  const { document, setDocument } = useContext(DocumentContext);

  return (
    <TextField
      label={attribute.name}
      type="datetime-local"
      classes={classes}
      value={queries.document.getAttributeValue(variant, domainID, attribute)(document) || ''}
      onChange={(e) => setDocument(
        mutations.node.setAttribute(variant, domainID, attribute, e.target.value),
      )}
      InputLabelProps={{ shrink: true }}
    />
  );
};

type ColorAttributeProps = {
  variant: NodeVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const ColorAttribute: React.FC<ColorAttributeProps> = ({
  variant, domainID, attribute,
}) => {
  const { visualisationSettings } = useContext(VisualisationContext);
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentColor = () => {
    const currentValue = queries.node.getAttributeValue(variant, domainID, attribute.key)(document);

    return (currentValue && typeof currentValue === 'string')
      ? currentValue
      : undefined;
  };

  const currentColorValue = getCurrentColor();
  const defaultColorValue = visualisationSettings.palette[variant];

  const onChangeComplete = (updatedColor: string) => {
    setDocument(mutations.node.setAttribute(variant, domainID, attribute, updatedColor));
  };

  const onClear = () => {
    if (currentColorValue !== undefined) {
      setDocument(mutations.node.deleteAttribute(variant, domainID, attribute.key));
    }
  };

  return (
    <ColorPicker
      mb={1}
      label={attribute.name}
      initialColor={currentColorValue || defaultColorValue}
      onChange={onChangeComplete}
      onClear={currentColorValue === undefined ? undefined : onClear}
    />
  );
};

const useBooleanStyles = makeStyles((theme) => ({
  formControl: {
    display: 'block',
  },
  formControlLabel: {
    marginLeft: 0,
  },
}));

type BooleanAttributeProps = {
  variant: NodeVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const BooleanAttribute: React.FC<BooleanAttributeProps> = ({ variant, domainID, attribute }) => {
  const classes = useBooleanStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const attributeValue = queries.node.getAttributeValue(variant, domainID, attribute.key)(document);

  const checked = (
    attributeValue !== undefined
    && typeof attributeValue === 'boolean'
    && attributeValue === true
  );

  const onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(mutations.node.setAttribute(variant, domainID, attribute, target.checked));
  };

  return (
    <FormControl className={classes.formControl}>
      <FormControlLabel
        className={classes.formControlLabel}
        labelPlacement="start"
        control={(
          <Checkbox
            checked={checked}
            onChange={onChange}
            color="primary"
            name={attribute.name}
          />
            )}
        label={attribute.name}
      />
    </FormControl>
  );
};

const useShapeStyles = makeStyles((theme) => ({
  wrapper: {
    maxWidth: 300,
  },
  formControlRoot: {
    flexGrow: 1,
  },
  clearIconButton: {
    padding: theme.spacing(0.5),
  },
  clearIconButtonWrapper: {
    transition: theme.transitions.create('max-width'),
    overflow: 'hidden',
  },
}));

type ShapeAttributeProps = {
  variant: NodeVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const ShapeAttribute: React.FC<ShapeAttributeProps> = ({ variant, domainID, attribute }) => {
  const classes = useShapeStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentShape = () => {
    const currentValue = queries.node.getAttributeValue(variant, domainID, attribute.key)(document);

    return (currentValue && typeof currentValue === 'string')
      ? currentValue
      : undefined;
  };

  const currentShapeValue = getCurrentShape();

  const onChange = (updatedShape: string) => {
    setDocument(mutations.node.setAttribute(variant, domainID, attribute, updatedShape));
  };

  const onClear = () => {
    if (currentShapeValue !== undefined) {
      setDocument(mutations.node.deleteAttribute(variant, domainID, attribute.key));
    }
  };

  return (
    <Box className={classes.wrapper} display="flex" alignItems="flex-end">
      <FormControl classes={{ root: classes.formControlRoot }}>
        <InputLabel>{attribute.name}</InputLabel>
        <Select
          value={currentShapeValue || ''}
          onChange={({ target }) => onChange(target.value as string)}
        >
          {PROVVIZ_SHAPES.map((shape) => <MenuItem key={shape} value={shape}>{shape}</MenuItem>)}
        </Select>
      </FormControl>
      <Box
        style={{
          maxWidth: currentShapeValue === undefined ? 0 : 300,
        }}
        className={classes.clearIconButtonWrapper}
      >
        <IconButton
          className={classes.clearIconButton}
          onClick={onClear}
          disabled={currentShapeValue === undefined}
        >
          <CloseIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

type DefinedAttributeProps = {
  attribute: PROVAttributeDefinition;
  domainID: string;
  variant: NodeVariant;
}

const DefinedAttribute: React.FC<DefinedAttributeProps> = ({ attribute, variant, domainID }) => (
  <>
    {attribute.range === 'DateTime' && (
      <DateTimeAttribute attribute={attribute} variant={variant} domainID={domainID} />
    )}
    {attribute.range === 'Color' && (
      <ColorAttribute attribute={attribute} variant={variant} domainID={domainID} />
    )}
    {attribute.range === 'Boolean' && (
      <BooleanAttribute attribute={attribute} variant={variant} domainID={domainID} />
    )}
    {attribute.range === 'Shape' && (
      <ShapeAttribute attribute={attribute} variant={variant} domainID={domainID} />
    )}
  </>
);

export default DefinedAttribute;
