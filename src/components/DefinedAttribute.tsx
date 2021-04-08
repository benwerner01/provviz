import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { DateTimePicker } from '@material-ui/pickers';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import {
  AttributeValue, NodeVariant, PROVVIZ_SHAPES, tbdIsNodeVariant,
} from '../lib/definition/document';
import { PROVAttributeDefinition } from '../lib/definition/attribute';
import queries from '../lib/queries';
import DocumentContext from './contexts/DocumentContext';
import mutations from '../lib/mutations';
import VisualisationContext from './contexts/VisualisationContext';
import ColorPicker from './ColorPicker';
import NodeAutocomplete from './Autocomplete/NodeAutocomplete';
import { RelationVariant } from '../lib/definition/relation';

const useDateTimeStyles = makeStyles((theme) => ({
  root: {
    display: 'block',
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
  const { document, setDocument } = useContext(DocumentContext);

  const attributeValue = queries.document.getAttributeValue(variant, domainID, attribute)(document);

  return (
    <DateTimePicker
      label={attribute.name}
      value={attributeValue && typeof attributeValue === 'string'
        ? new Date(attributeValue)
        : undefined}
      onChange={(date) => setDocument(date
        ? mutations.document.setAttribute(variant, domainID, attribute, date.toISOString())
        : mutations.document.deleteAttribute(variant, domainID, attribute.name))}
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

    return currentValue
      ? queries.document.parseStringFromAttributeValue(currentValue)
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
    attributeValue !== null
    && queries.document.parseBooleanFromAttributeValue(attributeValue)
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

    return currentValue
      ? queries.document.parseStringFromAttributeValue(currentValue)
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
  bundleID?: string;
  attribute: PROVAttributeDefinition;
}

const NodeAttribute: React.FC<NodeAttributeProps> = ({
  variant, domainID, attribute, bundleID,
}) => {
  const { document, setDocument } = useContext(DocumentContext);

  const getCurrentValue = () => {
    const currentValue = queries.document
      .getAttributeValue(variant, domainID, attribute)(document);

    return currentValue
      ? queries.document.parseStringFromAttributeValue(currentValue) || null
      : null;
  };

  const value = getCurrentValue();

  return (
    <NodeAutocomplete
      label={attribute.name}
      variant={attribute.range as NodeVariant}
      value={value}
      disableClearable={attribute.required}
      bundleID={bundleID}
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
  bundleID?: string;
  variant: NodeVariant | RelationVariant;
}

const DefinedAttribute: React.FC<DefinedAttributeProps> = ({
  attribute, variant, domainID, bundleID,
}) => (
  <Box mb={1.5}>
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
      <NodeAttribute
        attribute={attribute}
        variant={variant}
        domainID={domainID}
        bundleID={bundleID}
      />
    )}
  </Box>
);

export default DefinedAttribute;
