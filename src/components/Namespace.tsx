import React, {
  useState, useEffect, useContext, useRef, useCallback,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import VisibilityIcon from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import debounce from 'lodash.debounce';
import { PROVJSONDocument } from '../util/document';
import mutations from '../util/mutations';
import DocumentContext from './contexts/DocumentContext';
import { palette } from '../util/theme';
import VisualisationContext, { HiddenNamespace } from './contexts/VisualisationContext';

const PREFIX_INPUT_WIDTH = 150;
const PREFIX_VALUE_WIDTH = 300;

type Namespace = {
  key: string;
  prefix: string;
  value: string;
}

const useEditableNamespaceStyles = makeStyles((theme) => ({
  wrapper: {
    '&:hover svg': {
      opacity: 1,
    },
    '& > :not(:first-child)': {
      marginLeft: theme.spacing(1),
    },
  },
  errorText: {
    color: palette.danger.main,
  },
  prefixTextFieldRoot: {
    width: PREFIX_INPUT_WIDTH,
  },
  valueTextFieldRoot: {
    width: PREFIX_VALUE_WIDTH,
  },
  iconButton: {
    padding: 6,
    '& svg': {
      transition: theme.transitions.create('opacity'),
      opacity: 0,
    },
  },
  deleteIconButton: {
    '& svg': {
      color: palette.danger.main,
    },
  },
}));

type EditableNamespaceProps = {
  initialNamespace: Namespace;
  isHidden: boolean;
  bundleID?: string;
  updatePrefix: (name: string) => void;
  updateValue: (value: string) => void;
  isUniquePrefix: (name: string) => boolean;
  onDelete: () => void;
}

const matchesHiddenNamespace = (prefix: string, bundleID?: string) => (hidden: HiddenNamespace) => (
  hidden.prefix === prefix && hidden.bundleID === bundleID
);

const EditableNamespace: React.FC<EditableNamespaceProps> = ({
  initialNamespace,
  isHidden,
  bundleID,
  updatePrefix,
  updateValue,
  isUniquePrefix,
  onDelete,
}) => {
  const { setVisualisationSettings } = useContext(VisualisationContext);
  const classes = useEditableNamespaceStyles();

  const [prevPrefix, setPrevPrefix] = useState<string>(initialNamespace.prefix);
  const [prefix, setPrefix] = useState<string>(initialNamespace.prefix);
  const [prevValue, setPrevValue] = useState<string>(initialNamespace.value);
  const [value, setValue] = useState<string>(initialNamespace.value);

  const prefixIsUnique = isUniquePrefix(prefix);

  const prefixIsValid = prefix !== '' && prefixIsUnique;
  const valueIsValid = value !== '';

  useEffect(() => {
    if (prefixIsValid && prefix !== initialNamespace.prefix) {
      updatePrefix(prefix);
      setPrevPrefix(prefix);
    }
  }, [prefix, prefixIsValid]);

  useEffect(() => {
    if (valueIsValid && value !== initialNamespace.value) {
      updateValue(value);
      setPrevValue(value);
    }
  }, [value, valueIsValid]);

  const handlePrefixChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setPrefix(e.target.value.replaceAll(' ', ''));
  };

  const handlePrefixBlur = () => {
    if (!prefixIsValid) setPrefix(prevPrefix);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value.replaceAll(' ', ''));
  };

  const handleValueBlur = () => {
    if (!valueIsValid) setValue(prevValue);
  };

  const toggleHidden = () => setVisualisationSettings((prev) => ({
    ...prev,
    hiddenNamespaces: prev.hiddenNamespaces.find(
      matchesHiddenNamespace(prevPrefix, bundleID),
    ) === undefined
      ? [...prev.hiddenNamespaces, { prefix: prevPrefix, bundleID }]
      : prev.hiddenNamespaces.filter((h) => !matchesHiddenNamespace(prevPrefix, bundleID)(h)),
  }));

  return (
    <Box className={classes.wrapper} display="flex" alignItems="flex-start">
      <Box>
        <TextField
          value={prefix}
          onChange={handlePrefixChange}
          onBlur={handlePrefixBlur}
          classes={{ root: classes.prefixTextFieldRoot }}
          error={!prefixIsValid}
        />
        <Collapse in={!prefixIsValid}>
          {prefix === '' && (
            <Typography className={classes.errorText}>Prefix is required</Typography>
          )}
          {!prefixIsUnique && (
            <Typography className={classes.errorText}>Prefix already exists</Typography>
          )}
        </Collapse>
      </Box>
      <Box>
        <TextField
          value={value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
          classes={{ root: classes.valueTextFieldRoot }}
          error={!valueIsValid}
        />
        <Collapse in={!valueIsValid}>
          {value === '' && (
            <Typography className={classes.errorText}>Value is required</Typography>
          )}
        </Collapse>
      </Box>
      <IconButton onClick={toggleHidden} className={classes.iconButton}>
        {isHidden
          ? <VisibilityIcon style={{ opacity: 1 }} />
          : <VisibilityOffIcon />}
      </IconButton>
      <IconButton onClick={onDelete} className={[classes.iconButton, classes.deleteIconButton].join(' ')}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
};

type CreateNamespaceProps = {
  isUniquePrefix: (prefix: string) => boolean;
  onCancel: () => void;
  onCreated: (namespace: Omit<Namespace, 'key'>) => void;
}

const CreateNamespace: React.FC<CreateNamespaceProps> = ({
  isUniquePrefix, onCreated, onCancel,
}) => {
  const prefixInputRef = useRef<HTMLInputElement>(null);
  const classes = useEditableNamespaceStyles();

  const [prefix, setPrefix] = useState<string>('');
  const [changedPrefix, setChangedPrefix] = useState<boolean>(false);
  const [value, setValue] = useState<string>('');
  const [changedValue, setChangedValue] = useState<boolean>(false);

  useEffect(() => {
    if (prefixInputRef.current) prefixInputRef.current.focus();
  }, [prefixInputRef]);

  const prefixIsUnique = isUniquePrefix(prefix);

  const prefixIsValid = prefix !== '' && prefixIsUnique;
  const valueIsValid = value !== '';

  const handlePrefixChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!changedPrefix) setChangedPrefix(true);
    setPrefix(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (!changedValue) setChangedValue(true);
    setValue(e.target.value);
  };

  const reset = () => {
    setPrefix('');
    setValue('');
  };

  const handleCancel = () => {
    onCancel();
    reset();
  };

  const handleCreate = () => {
    if (prefixIsValid && valueIsValid) {
      onCreated({ prefix, value });
      reset();
    }
  };

  return (
    <Box className={classes.wrapper} display="flex" alignItems="flex-start">
      <Box>
        <TextField
          value={prefix}
          onChange={handlePrefixChange}
          classes={{ root: classes.prefixTextFieldRoot }}
          error={!prefixIsValid && changedPrefix}
          inputRef={prefixInputRef}
        />
        <Collapse in={!prefixIsValid && changedPrefix}>
          {prefix === '' && (
            <Typography className={classes.errorText}>Prefix is required</Typography>
          )}
          {!prefixIsUnique && (
            <Typography className={classes.errorText}>Prefix already exists</Typography>
          )}
        </Collapse>
      </Box>
      <Box>
        <TextField
          value={value}
          onChange={handleValueChange}
          classes={{ root: classes.valueTextFieldRoot }}
          error={!valueIsValid && changedValue}
        />
        <Collapse in={!valueIsValid && changedValue}>
          {value === '' && (
          <Typography className={classes.errorText}>Value is required</Typography>
          )}
        </Collapse>
      </Box>
      <Button onClick={handleCancel} variant="contained">Cancel</Button>
      <Button
        disabled={!prefixIsValid || !valueIsValid}
        color="primary"
        onClick={handleCreate}
        variant="contained"
      >
        Create
      </Button>
    </Box>
  );
};

type NamespaceProps = {
  bundleID?: string;
}

let counter = 0;

const generateKey = () => {
  counter += 1;
  return counter.toString();
};

const sortNamespaces = (a: Namespace, b: Namespace) => (
  a.prefix.charCodeAt(0) - b.prefix.charCodeAt(0));

const mapDocumentToNamespaces = (bundleID?: string) => ({
  prefix, bundle,
}: PROVJSONDocument) => Object
  .entries((bundleID ? bundle?.[bundleID].prefix : prefix) || {})
  .map(([key, value]) => ({ key: generateKey(), prefix: key, value }))
  .sort(sortNamespaces);

const namespaceHasChanged = (namespaces: Namespace[], bundleID?: string) => (
  document: PROVJSONDocument,
): boolean => {
  const prefixObject = (bundleID ? document.bundle?.[bundleID].prefix : document) || {};
  return (
    namespaces.length !== Object.keys(prefixObject).length
  || (Object.entries(prefixObject).find(([p, v]) => {
    const namespace = namespaces.find(({ prefix }) => prefix === p);
    if (!namespace || namespace.value !== v) return true;
    return false;
  }) !== undefined)
  );
};

const NamespaceComponent: React.FC<NamespaceProps> = ({ bundleID }) => {
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);
  const { document, setDocument } = useContext(DocumentContext);

  const [namespaces, setNamespaces] = useState<Namespace[]>(
    mapDocumentToNamespaces(bundleID)(document),
  );
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    // If any namespace has changed...
    if (namespaceHasChanged(namespaces, bundleID)(document)) {
      // ...let's update the local state of the namespaces
      setNamespaces(mapDocumentToNamespaces(bundleID)(document));
    }
  }, [document, bundleID]);

  const debouncedUpdatePrefix = useCallback((index: number) => debounce((prefix: string) => {
    const { key } = namespaces[index];
    const prevPrefix = namespaces[index].prefix;

    setNamespaces([
      ...namespaces.slice(0, index),
      { key, prefix, value: namespaces[index].value },
      ...namespaces.slice(index + 1),
    ]);

    setDocument(mutations.namespace.updatePrefix(prevPrefix, prefix, bundleID));

    if (visualisationSettings.hiddenNamespaces.find((h) => h.prefix === prevPrefix) !== undefined) {
      setVisualisationSettings((prev) => ({
        ...prev,
        hiddenNamespaces: prev.hiddenNamespaces.map((hidden) => (
          matchesHiddenNamespace(prefix, bundleID)(hidden) ? { prefix, bundleID } : hidden
        )),
      }));
    }
  }, 200), [visualisationSettings, namespaces, setDocument, bundleID]);

  const debouncedUpdateValue = useCallback((index: number) => debounce((value: string) => {
    const { key, prefix } = namespaces[index];

    setNamespaces([
      ...namespaces.slice(0, index),
      { key, prefix, value },
      ...namespaces.slice(index + 1),
    ]);

    setDocument(mutations.namespace.updateValue(prefix, value, bundleID));
  }, 200), [namespaces, setDocument, bundleID]);

  const handleDelete = (index: number) => () => {
    const { prefix } = namespaces[index];

    setNamespaces([...namespaces.slice(0, index), ...namespaces.slice(index + 1)]);

    setDocument(mutations.namespace.delete(prefix, bundleID));
  };

  const handleCreated = (namespace: Omit<Namespace, 'key'>) => {
    setCreating(false);
    setNamespaces([...namespaces, { ...namespace, key: `${namespaces.length}-${namespace.prefix}` }]);
    setDocument(mutations.namespace.create(namespace.prefix, namespace.value, bundleID));
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex">
          <Typography variant="h5" style={{ minWidth: PREFIX_INPUT_WIDTH }}>Prefix</Typography>
          <Typography variant="h5">Value</Typography>
        </Box>
        <Button
          disabled={creating}
          onClick={() => setCreating(true)}
          variant="contained"
          color="primary"
          endIcon={<AddIcon />}
        >
          Namespace
        </Button>
      </Box>
      {creating && (
        <CreateNamespace
          onCancel={() => setCreating(false)}
          onCreated={handleCreated}
          isUniquePrefix={(name: string) => (
            namespaces.find((p) => p.prefix === name) === undefined)}
        />
      )}
      {namespaces.map((namespace, index) => (
        <EditableNamespace
          key={namespace.key}
          bundleID={bundleID}
          isHidden={visualisationSettings
            .hiddenNamespaces
            .find(matchesHiddenNamespace(namespace.prefix, bundleID)) !== undefined}
          initialNamespace={namespace}
          onDelete={handleDelete(index)}
          updatePrefix={debouncedUpdatePrefix(index)}
          updateValue={debouncedUpdateValue(index)}
          isUniquePrefix={(name: string) => namespaces
            .find((p, i) => i !== index && p.prefix === name) === undefined}
        />
      ))}
    </>
  );
};

export default NamespaceComponent;
