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
import { NodeVariant, PROVVIZ_SHAPES, tbdIsNodeVariant } from '../util/definition/document';
import { PROVAttributeDefinition } from '../util/definition/attribute';
import queries from '../util/queries';
import DocumentContext from './contexts/DocumentContext';
import mutations from '../util/mutations';
import VisualisationContext from './contexts/VisualisationContext';
import ColorPicker from './ColorPicker';
import NodeAutocomplete from './Autocomplete/NodeAutocomplete';
import { RelationVariant } from '../util/definition/relation';

const useDateTimeStyles = makeStyles((theme) => ({
  root: {
    display: 'block',
    marginBottom: theme.spacing(2),
  },
}));

type DateTimeAttributeProps = {
  variant: NodeVariant | RelationVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const DateTimeAttribute: React.FC<DateTimeAttributeProps> = ({
  variant, domainID, attribute,
}) => {
  const classes = useDateTimeStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const attributeValue = queries.document.getAttributeValue(variant, domainID, attribute)(document);
  const attributeValueISOString = attributeValue
    ? new Date(attributeValue).toISOString()
    : undefined;

  const value = attributeValueISOString ? attributeValueISOString.slice(0, attributeValueISOString.length - 1) : '';

  return (
    <TextField
      label={attribute.name}
      type="datetime-local"
      classes={classes}
      value={value}
      onChange={(e) => setDocument(mutations.document.setAttribute(
        variant, domainID, attribute, (new Date(e.target.value)).toISOString(),
      ))}
      InputLabelProps={{ shrink: true }}
    />
  );
};

type ColorAttributeProps = {
  variant: NodeVariant | RelationVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const ColorAttribute: React.FC<ColorAttributeProps> = ({
  variant, domainID, attribute,
}) => {
  const { visualisationSettings } = useContext(VisualisationContext);
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentColor = () => {
    const currentValue = queries.document
      .getAttributeValue(variant, domainID, attribute)(document);

    return (currentValue && typeof currentValue === 'string')
      ? currentValue
      : undefined;
  };

  const currentColorValue = getCurrentColor();
  const defaultColorValue = tbdIsNodeVariant(variant)
    ? visualisationSettings.palette[variant]
    : '#FFFFFF';

  const onChangeComplete = (updatedColor: string) => {
    setDocument(mutations.document.setAttribute(variant, domainID, attribute, updatedColor));
  };

  const onClear = () => {
    if (currentColorValue !== undefined) {
      setDocument(mutations.document.deleteAttribute(variant, domainID, attribute.key));
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
  variant: NodeVariant | RelationVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const BooleanAttribute: React.FC<BooleanAttributeProps> = ({ variant, domainID, attribute }) => {
  const classes = useBooleanStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const attributeValue = queries.document
    .getAttributeValue(variant, domainID, attribute)(document);

  const checked = (
    attributeValue !== undefined
    && typeof attributeValue === 'boolean'
    && attributeValue === true
  );

  const onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    setDocument(mutations.document.setAttribute(variant, domainID, attribute, target.checked));
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
  variant: NodeVariant | RelationVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const ShapeAttribute: React.FC<ShapeAttributeProps> = ({ variant, domainID, attribute }) => {
  const classes = useShapeStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentShape = () => {
    const currentValue = queries.document
      .getAttributeValue(variant, domainID, attribute)(document);

    return (currentValue && typeof currentValue === 'string')
      ? currentValue
      : undefined;
  };

  const currentShapeValue = getCurrentShape();

  const onChange = (updatedShape: string) => {
    setDocument(mutations.document.setAttribute(variant, domainID, attribute, updatedShape));
  };

  const onClear = () => {
    if (currentShapeValue !== undefined) {
      setDocument(mutations.document.deleteAttribute(variant, domainID, attribute.key));
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

type NodeAttributeProps = {
  variant: NodeVariant | RelationVariant;
  domainID: string;
  attribute: PROVAttributeDefinition;
}

const NodeAttribute: React.FC<NodeAttributeProps> = ({ variant, domainID, attribute }) => {
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentValue = () => {
    const currentValue = queries.document
      .getAttributeValue(variant, domainID, attribute)(document);

    return (currentValue && typeof currentValue === 'string')
      ? currentValue
      : null;
  };

  const value = getCurrentValue();

  return (
    <NodeAutocomplete
      label={attribute.name}
      variant={attribute.range as NodeVariant}
      value={value}
      disableClearable={attribute.required}
      onChange={(updatedDocument, updatedValue) => {
        if (updatedValue) {
          setDocument(mutations.document
            .setAttribute(variant, domainID, attribute, updatedValue)(updatedDocument));
        } else if (!attribute.required) {
          setDocument(mutations.document
            .deleteAttribute(variant, domainID, attribute.key)(updatedDocument));
        }
      }}
    />
  );
};

type DefinedAttributeProps = {
  attribute: PROVAttributeDefinition;
  domainID: string;
  variant: NodeVariant | RelationVariant;
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
    {(attribute.range === 'entity' || attribute.range === 'activity' || attribute.range === 'agent') && (
      <NodeAttribute attribute={attribute} variant={variant} domainID={domainID} />
    )}
  </>
);

export default DefinedAttribute;
