import React, {
  useState, useEffect, useContext, useRef, useCallback, useLayoutEffect,
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
import Tooltip from '@material-ui/core/Tooltip';
import debounce from 'lodash.debounce';
import { PROVJSONDocument } from '../util/definition/document';
import mutations from '../util/mutations';
import DocumentContext from './contexts/DocumentContext';
import { palette } from '../util/theme';
import VisualisationContext, { HiddenNamespace } from './contexts/VisualisationContext';
import queries from '../util/queries';

const NAMESPACE_PREFIX_WIDTH = 150;
const NAMESPACE_VALUE_WIDTH = 300;

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
    width: NAMESPACE_PREFIX_WIDTH,
  },
  valueTextFieldRoot: {
    width: NAMESPACE_VALUE_WIDTH,
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
  editable: boolean;
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
  editable,
  bundleID,
  updatePrefix,
  updateValue,
  isUniquePrefix,
  onDelete,
}) => {
  const { document } = useContext(DocumentContext);
  const { setVisualisationSettings } = useContext(VisualisationContext);
  const classes = useEditableNamespaceStyles();

  const [prevPrefix, setPrevPrefix] = useState<string>(initialNamespace.prefix);
  const [prefix, setPrefix] = useState<string>(initialNamespace.prefix);
  const [prevValue, setPrevValue] = useState<string>(initialNamespace.value);
  const [value, setValue] = useState<string>(initialNamespace.value);

  const [agentsInNamespace, setAgentsInNamespace] = useState<number>(0);
  const [entitiesInNamespace, setEntitiesInNamespace] = useState<number>(0);
  const [activitiesInNamespace, setActivitiesInNamespace] = useState<number>(0);
  const [bundlesInNamespace, setBundlesInNamespace] = useState<number>(0);
  const [attributesInNamespace, setAttributesInNamespace] = useState<number>(0);

  useLayoutEffect(() => {
    setAgentsInNamespace(queries.node
      .getAllInNamespace('activity', initialNamespace.prefix)(document).length);
    setEntitiesInNamespace(queries.node
      .getAllInNamespace('entity', initialNamespace.prefix)(document).length);
    setActivitiesInNamespace(queries.node
      .getAllInNamespace('activity', initialNamespace.prefix)(document).length);
    setBundlesInNamespace(queries.bundle
      .getAllInNamespace(initialNamespace.prefix)(document).length);
    setAttributesInNamespace(queries.document
      .getAttributesInNamespace(initialNamespace.prefix)(document).length);
  }, [initialNamespace.prefix, document]);

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

  const canDelete = (
    agentsInNamespace === 0
      && entitiesInNamespace === 0
      && activitiesInNamespace === 0
      && bundlesInNamespace === 0
      && attributesInNamespace === 0
  );

  const handleDelete = () => {
    if (canDelete) onDelete();
  };

  return (
    <Box className={classes.wrapper} display="flex" alignItems="center">
      <Box style={{ width: NAMESPACE_PREFIX_WIDTH }}>
        {editable
          ? (
            <>
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
            </>
          ) : <Typography>{prefix}</Typography>}
      </Box>
      <Box style={{ width: NAMESPACE_VALUE_WIDTH }}>
        {editable
          ? (
            <>
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
            </>
          ) : <Typography>{value}</Typography>}
      </Box>
      <Tooltip title={<Typography>{isHidden ? 'Show in Visualisation' : 'Hide in Visualisation'}</Typography>}>
        <IconButton onClick={toggleHidden} className={classes.iconButton}>
          {isHidden
            ? <VisibilityIcon style={{ opacity: 1 }} />
            : <VisibilityOffIcon />}
        </IconButton>
      </Tooltip>
      {editable && (
        <Tooltip
          title={(
            <Typography>
              {canDelete
                ? 'Delete'
                : (
                  <>
                    {'Cannot delete namespace that is being used by '}
                    {[
                      agentsInNamespace > 0 ? `${agentsInNamespace} Agent${agentsInNamespace === 1 ? '' : 's'}` : [],
                      entitiesInNamespace > 0 ? `${entitiesInNamespace} Entit${agentsInNamespace === 1 ? 'y' : 'ies'}` : [],
                      activitiesInNamespace > 0 ? `${activitiesInNamespace} Activit${activitiesInNamespace === 1 ? 'y' : 'ies'}` : [],
                      bundlesInNamespace > 0 ? `${bundlesInNamespace} Bundle${bundlesInNamespace === 1 ? '' : 's'}` : [],
                      attributesInNamespace > 0 ? `${attributesInNamespace} Attribute${attributesInNamespace === 1 ? '' : 's'}` : [],
                    ].flat().map((item, i, all) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <React.Fragment key={i}>
                        <strong>{item}</strong>
                        {(i === all.length - 1 ? '' : i === all.length - 2 ? ' and ' : ', ')}
                      </React.Fragment>
                    ))}
                  </>
                )}
            </Typography>
          )}
        >
          <IconButton onClick={handleDelete} className={[classes.iconButton, classes.deleteIconButton].join(' ')}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      )}
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
  .entries((bundleID ? bundle?.[bundleID]?.prefix : prefix) || {})
  .map(([key, value]) => ({ key: generateKey(), prefix: key, value }))
  .sort(sortNamespaces);

const namespaceHasChanged = (namespaces: Namespace[], bundleID?: string) => (
  document: PROVJSONDocument,
): boolean => {
  const prefixObject = (bundleID ? document.bundle?.[bundleID]?.prefix : document.prefix) || {};
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
    const prevPrefix = namespaces[index].prefix;

    setNamespaces((prev) => [
      ...prev.slice(0, index),
      { ...prev[index], prefix },
      ...prev.slice(index + 1),
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
  }, 200), [visualisationSettings, namespaces, setNamespaces, setDocument, bundleID]);

  const debouncedUpdateValue = useCallback((index: number) => debounce((value: string) => {
    setNamespaces((prev) => [
      ...prev.slice(0, index),
      { ...prev[index], value },
      ...prev.slice(index + 1),
    ]);
    const { prefix } = namespaces[index];
    setDocument(mutations.namespace.updateValue(prefix, value, bundleID));
  }, 200), [namespaces, setDocument, setNamespaces, bundleID]);

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
          <Typography variant="h5" style={{ minWidth: NAMESPACE_PREFIX_WIDTH }}>Prefix</Typography>
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
      {namespaces.map((namespace, index) => (
        <EditableNamespace
          key={namespace.key}
          bundleID={bundleID}
          editable={!(!bundleID && ['prov', 'xsd'].includes(namespace.prefix))}
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
      {creating && (
        <CreateNamespace
          onCancel={() => setCreating(false)}
          onCreated={handleCreated}
          isUniquePrefix={(name: string) => (
            namespaces.find((p) => p.prefix === name) === undefined)}
        />
      )}
    </>
  );
};

export default NamespaceComponent;
