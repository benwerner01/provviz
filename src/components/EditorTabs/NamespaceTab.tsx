import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { PROVJSONDocument } from '../../util/document';
import mutations from '../../util/mutations';
import DocumentContext from '../contexts/DocumentContext';
import { palette } from '../../util/dot';

const PREFIX_INPUT_WIDTH = 150;
const PREFIX_VALUE_WIDTH = 300;

type Namespace = {
  prefix: string;
  value: string;
}

const useEditableNamespaceStyles = makeStyles((theme) => ({
  wrapper: {
    '&:hover svg': {
      opacity: 1,
    },
  },
  prefixTextFieldRoot: {
    width: PREFIX_INPUT_WIDTH,
  },
  valueTextFieldRoot: {
    width: PREFIX_VALUE_WIDTH,
  },
  iconButton: {
    '& svg': {
      transition: theme.transitions.create('opacity'),
      opacity: 0,
      color: palette.danger.main,
    },
  },
}));

type EditableNamespaceProps = {
  initialNamespace: Namespace;
  updatePrefix: (name: string) => void;
  updateValue: (value: string) => void;
  isUniquePrefix: (name: string) => boolean;
  onDelete: () => void;
}

const EditableNamespace: React.FC<EditableNamespaceProps> = ({
  initialNamespace,
  updatePrefix,
  updateValue,
  isUniquePrefix,
  onDelete,
}) => {
  const classes = useEditableNamespaceStyles();

  const [prefix, setName] = useState<string>(initialNamespace.prefix);
  const [value, setValue] = useState<string>(initialNamespace.value);

  const nameIsValid = prefix !== '' && isUniquePrefix(prefix);
  const valueIsValid = value !== '';

  useEffect(() => {
    if (nameIsValid && prefix !== initialNamespace.prefix) updatePrefix(prefix);
  }, [prefix, nameIsValid]);

  useEffect(() => {
    if (valueIsValid && value !== initialNamespace.value) updateValue(value);
  }, [value, valueIsValid]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <Box className={classes.wrapper} display="flex" alignItems="center">
      <TextField
        value={prefix}
        onChange={handlePrefixChange}
        classes={{ root: classes.prefixTextFieldRoot }}
        error={!nameIsValid}
      />
      <TextField
        value={value}
        onChange={handleValueChange}
        classes={{ root: classes.valueTextFieldRoot }}
        error={!valueIsValid}
      />
      <IconButton onClick={onDelete} className={classes.iconButton}><DeleteIcon /></IconButton>
    </Box>
  );
};

type CreateNamespaceProps = {
  isUniquePrefix: (prefix: string) => boolean;
  onCreated: (namespace: Namespace) => void;
}

const CreateNamespace: React.FC<CreateNamespaceProps> = ({
  isUniquePrefix, onCreated,
}) => {
  const classes = useEditableNamespaceStyles();

  const [prefix, setPrefix] = useState<string>('');
  const [value, setValue] = useState<string>('');

  const prefixIsValid = prefix !== '' && isUniquePrefix(prefix);
  const valueIsValid = value !== '';

  const handlePrefixChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setPrefix(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleCreate = () => {
    if (prefixIsValid && valueIsValid) {
      onCreated({ prefix, value });
    }
  };

  return (
    <Box className={classes.wrapper} display="flex" alignItems="center">
      <TextField
        value={prefix}
        onChange={handlePrefixChange}
        classes={{ root: classes.prefixTextFieldRoot }}
        error={!prefixIsValid}
      />
      <TextField
        value={value}
        onChange={handleValueChange}
        classes={{ root: classes.valueTextFieldRoot }}
        error={!valueIsValid}
      />
      <Button onClick={handleCreate} variant="contained">Create</Button>
    </Box>
  );
};

type NamespaceTabProps = {

}

const mapDocumentToNamespaces = ({ prefix }: PROVJSONDocument) => Object
  .keys(prefix)
  .map((key) => ({ prefix: key, value: prefix[key] }));

const NamespaceTab: React.FC<NamespaceTabProps> = () => {
  const { document, setDocument } = useContext(DocumentContext);

  const [namespaces, setNamespaces] = useState<Namespace[]>(mapDocumentToNamespaces(document));
  const [creating, setCreating] = useState<boolean>(false);

  const updatePrefix = (index: number) => (prefix: string) => {
    const prevPrefix = namespaces[index].prefix;

    setNamespaces([
      ...namespaces.slice(0, index),
      { prefix, value: namespaces[index].value },
      ...namespaces.slice(index + 1),
    ]);

    setDocument((prev) => mutations.namespace.updatePrefix(prev)(prevPrefix, prefix));
  };

  const updateValue = (index: number) => (value: string) => {
    const { prefix } = namespaces[index];

    setNamespaces([
      ...namespaces.slice(0, index),
      { prefix, value },
      ...namespaces.slice(index + 1),
    ]);

    setDocument((prev) => mutations.namespace.updateValue(prev)(prefix, value));
  };

  const handleDelete = (index: number) => () => {
    const { prefix } = namespaces[index];

    setNamespaces([...namespaces.slice(0, index), ...namespaces.slice(index + 1)]);

    setDocument((prev) => mutations.namespace.delete(prev)(prefix));
  };

  const handleCreated = (namespace: Namespace) => {
    setCreating(false);
    setNamespaces([...namespaces, namespace]);
    setDocument((prev) => mutations.namespace.create(prev)(namespace.prefix, namespace.value));
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex">
          <Typography variant="h5" style={{ minWidth: PREFIX_INPUT_WIDTH }}>Prefix</Typography>
          <Typography variant="h5">Value</Typography>
        </Box>
        <Button
          onClick={() => setCreating(true)}
          variant="contained"
          color="primary"
          endIcon={<AddIcon />}
        >
          Namespace
        </Button>
      </Box>
      {namespaces.map((namespace, index) => (
        <EditableNamespace
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          initialNamespace={namespace}
          onDelete={handleDelete(index)}
          updatePrefix={updatePrefix(index)}
          updateValue={updateValue(index)}
          isUniquePrefix={(name: string) => namespaces
            .find((p, i) => i !== index && p.prefix === name) === undefined}
        />
      ))}
      {creating && (
        <CreateNamespace
          onCreated={handleCreated}
          isUniquePrefix={(name: string) => namespaces
            .find((p) => p.prefix === name) === undefined}
        />
      )}
    </>
  );
};

export default NamespaceTab;
