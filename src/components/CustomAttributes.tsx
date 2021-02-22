import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import debounce from 'lodash.debounce';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Collapse from '@material-ui/core/Collapse';
import { AttributeValue, ATTRIBUTE_DEFINITIONS, NodeVariant } from '../util/document';
import queries from '../util/queries';
import DocumentContext from './contexts/DocumentContext';
import mutations from '../util/mutations';

const useCustomAttributeStyles = makeStyles((theme) => ({
  wrapper: {
    maxWidth: 750,
    paddingTop: theme.spacing(0.75),
    paddingBottom: theme.spacing(1.5),
    overflowX: 'scroll',
  },
  nameTextField: {
    width: 125,
  },
  valueTextField: {
    minWidth: 150,
    flexGrow: 1,
  },
  typeNameTextField: {
    transition: theme.transitions.create(['width', 'opacity']),
  },
  typeFormControl: {
    width: 125,
  },
  selectFormControlRoot: {
    flexShrink: 0,
    '& > .MuiInputBase-root': {
      borderRadius: 0,
    },
    '&:first-child > .MuiInputBase-root': {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    '&:last-child > .MuiInputBase-root': {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
  },
  select: {
    padding: theme.spacing(1.5),
  },
  selectLabelRoot: {
    backgroundColor: theme.palette.common.white,
  },
  textFieldRoot: {
    display: 'flex',
    flexShrink: 0,
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
      top: -7,
    },
    '& > .MuiInputBase-root': {
      borderRadius: 0,
    },
    '&:first-child > .MuiInputBase-root': {
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    '&:last-child > .MuiInputBase-root': {
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
  },
  textFieldInputRoot: {
    borderRadius: 0,
  },
  textFieldInput: {
    padding: theme.spacing(1.5),
  },
}));

type CustomAttributeProps = {
  name: string;
  value: AttributeValue;
  onNameChange: (updatedName: string) => void;
  onValueChange: (updatedValue: AttributeValue) => void;
}

const CustomAttribute: React.FC<CustomAttributeProps> = ({
  name, value, onNameChange, onValueChange,
}) => {
  if (typeof value === 'object' && Array.isArray(value)) throw new Error('LiteralArray not supported');
  const classes = useCustomAttributeStyles();

  const handleTypeChange = ({ target }: React.ChangeEvent<{ value: unknown; }>) => {
    const type = target.value;
    if (type === 'String') onValueChange('');
    if (type === 'Number') onValueChange(0);
    if (type === 'Boolean') onValueChange(true);
    if (type === 'Custom') onValueChange({ $: value.toString(), type: '' });
  };

  const valueType = typeof value === 'string'
    ? 'string'
    : typeof value === 'number'
      ? 'number'
      : typeof value === 'boolean'
        ? 'boolean'
        : 'custom';

  const textFieldClasses = { root: classes.textFieldRoot };
  const textFieldInputClasses = { root: classes.textFieldInputRoot, input: classes.textFieldInput };
  const selectClasses = { select: classes.select };
  const selectLabelClasses = { root: classes.selectLabelRoot };
  const selectFormControlClasses = { root: classes.selectFormControlRoot };

  return (
    <Box flexGrow={1} display="flex" className={classes.wrapper}>
      <TextField
        className={classes.nameTextField}
        classes={textFieldClasses}
        InputProps={{ classes: textFieldInputClasses }}
        variant="outlined"
        label="Name"
        value={name}
        onChange={({ target }) => onNameChange(target.value)}
      />
      {valueType === 'boolean' ? (
        <FormControl className={classes.valueTextField} classes={selectFormControlClasses} variant="outlined">
          <InputLabel classes={selectLabelClasses}>Value</InputLabel>
          <Select
            classes={selectClasses}
            value={value}
            onChange={({ target }) => onValueChange(target.value === 'true')}
          >
            <MenuItem value="true">True</MenuItem>
            <MenuItem value="false">False</MenuItem>
          </Select>
        </FormControl>
      ) : (
        <TextField
          className={classes.valueTextField}
          classes={textFieldClasses}
          InputProps={{ classes: textFieldInputClasses }}
          type={valueType === 'number' ? 'number' : 'text'}
          variant="outlined"
          label="Value"
          value={typeof value === 'object' ? value.$ : value}
          onChange={({ target }) => onValueChange(valueType === 'number'
            ? parseFloat(target.value)
            : target.value)}
        />
      )}
      <TextField
        style={{
          width: valueType === 'custom' ? 125 : 0,
          opacity: valueType === 'custom' ? 1 : 0,
        }}
        className={classes.typeNameTextField}
        classes={textFieldClasses}
        InputProps={{ classes: textFieldInputClasses }}
        variant="outlined"
        label="Type Name"
        disabled={typeof value !== 'object'}
        value={typeof value === 'object' ? value.type : ''}
        onChange={({ target }) => {
          if (typeof value === 'object') onValueChange({ ...value, type: target.value });
        }}
      />
      <FormControl className={classes.typeFormControl} variant="outlined" classes={selectFormControlClasses}>
        <InputLabel classes={selectLabelClasses}>Type</InputLabel>
        <Select
          classes={selectClasses}
          value={typeof value === 'string'
            ? 'String'
            : typeof value === 'number'
              ? 'Number'
              : typeof value === 'boolean'
                ? 'Boolean'
                : 'Custom'}
          onChange={handleTypeChange}
        >
          <MenuItem value="String">String</MenuItem>
          <MenuItem value="Number">Number</MenuItem>
          <MenuItem value="Boolean">Boolean</MenuItem>
          <MenuItem value="Custom">Custom</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

const useCustomAttributesStyles = makeStyles((theme) => ({
  button: {
    textTransform: 'none',
  },
  cancelButton: {
    marginRight: theme.spacing(1),
  },
}));

type Attribute = {
  key: string;
  prevName: string;
  name: string;
  value: AttributeValue;
}

let counter = 0;

const feshAttributeKey = () => {
  counter += 1;
  return counter.toString();
};

const mapDocumentAttributeEntryToAttribute = (
  [name, value]: [name: string, value: AttributeValue],
): Attribute => ({
  key: feshAttributeKey(),
  prevName: name,
  name,
  value,
});

type CustomAttributesProps = {
  nodeVariant: NodeVariant;
  nodeID: string;
}

const CustomAttributes: React.FC<CustomAttributesProps> = ({
  nodeVariant, nodeID,
}) => {
  const classes = useCustomAttributesStyles();
  const { document, setDocument } = useContext(DocumentContext);

  const [creating, setCreating] = useState<boolean>(false);
  const [creatingName, setCreatingName] = useState<string>('');
  const [creatingValue, setCreatingValue] = useState<AttributeValue>('');
  const [attributes, setAttributes] = useState<Attribute[]>(
    queries.node.getAttributes(nodeVariant, nodeID)(document)
      ?.filter(([key]) => ATTRIBUTE_DEFINITIONS.find((a) => a.key === key) === undefined)
      .map(mapDocumentAttributeEntryToAttribute) || [],
  );

  const resetCreating = () => {
    setCreating(false);
    setCreatingName('');
    setCreatingValue('');
  };

  useEffect(() => {
    const newAttributes = queries.node.getAttributes(nodeVariant, nodeID)(document);
    if (newAttributes) {
      resetCreating();
      setAttributes(newAttributes
        .filter(([key]) => ATTRIBUTE_DEFINITIONS.find((a) => a.key === key) === undefined)
        .map(mapDocumentAttributeEntryToAttribute));
    }
  }, [document, nodeID]);

  if (!attributes) throw new Error(`Could not get attributes for node ${nodeID}`);

  const debouncedUpdateName = useCallback(debounce(
    (key: string, prevName: string, newName: string) => {
      setDocument(mutations.node.setAttributeName(nodeVariant, nodeID, prevName, newName));
      setAttributes((prev) => {
        const index = prev.findIndex((a) => key === a.key);
        return index === -1
          ? prev
          : [
            ...prev.slice(0, index),
            { ...prev[index], prevName: newName },
            ...prev.slice(index + 1),
          ];
      });
    }, 300,
  ), [nodeID]);

  const debouncedUpdateValue = useCallback(debounce(
    (name: string, updatedValue: AttributeValue) => {
      setDocument(mutations.node.setAttributeValue(nodeVariant, nodeID, name, updatedValue));
    }, 300,
  ), [nodeID]);

  const handleNameChange = (key: string, prevName: string) => (updatedName: string) => {
    if (updatedName !== '') debouncedUpdateName(key, prevName, updatedName);
    setAttributes((prev) => {
      const index = prev.findIndex((a) => key === a.key);
      return index === -1
        ? prev
        : [
          ...prev.slice(0, index),
          { ...prev[index], name: updatedName },
          ...prev.slice(index + 1),
        ];
    });
  };

  const handleValueChange = (key: string, name: string) => (updatedValue: AttributeValue) => {
    debouncedUpdateValue(name, updatedValue);
    setAttributes((prev) => {
      const index = prev.findIndex((a) => key === a.key);
      return index === -1
        ? prev
        : [
          ...prev.slice(0, index),
          { ...prev[index], value: updatedValue },
          ...prev.slice(index + 1),
        ];
    });
  };

  const creatingIsValid = (
    creatingName !== ''
    && attributes.find(({ prevName }) => prevName === creatingName) === undefined
  );

  const handleCreate = () => {
    if (!creatingIsValid) return;
    const name = creatingName;
    const value = creatingValue;
    setDocument(mutations.node.createAttribute(nodeVariant, nodeID, name, value));
    setAttributes((prev) => [...prev, {
      key: feshAttributeKey(), prevName: name, name, value,
    }]);
    resetCreating();
  };

  const handleDelete = (key: string, name: string) => {
    setDocument(mutations.node.deleteAttribute(nodeVariant, nodeID, name));
    setAttributes((prev) => prev.filter((a) => a.key !== key));
  };

  return (
    <>
      {attributes.map(({
        key, prevName, name, value,
      }) => (
        <Box key={key} display="flex" alignItems="center">
          <CustomAttribute
            name={name}
            value={value}
            onNameChange={handleNameChange(key, prevName)}
            onValueChange={handleValueChange(key, prevName)}
          />
          <IconButton onClick={() => handleDelete(key, prevName)}><DeleteIcon /></IconButton>
        </Box>
      ))}
      <Collapse in={creating}>
        <CustomAttribute
          name={creatingName}
          value={creatingValue}
          onNameChange={setCreatingName}
          onValueChange={setCreatingValue}
        />
      </Collapse>
      {creating ? (
        <>
          <Button className={[classes.button, classes.cancelButton].join(' ')} variant="contained" onClick={resetCreating}>Cancel</Button>
          <Button className={classes.button} variant="contained" color="primary" disabled={!creatingIsValid} onClick={handleCreate}>Done</Button>
        </>
      ) : (
        <Button
          className={classes.button}
          onClick={() => setCreating(true)}
          variant="contained"
          color="primary"
          endIcon={<AddIcon />}
        >
          Create
        </Button>
      )}
    </>
  );
};

export default CustomAttributes;
