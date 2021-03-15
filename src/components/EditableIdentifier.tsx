import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import debounce from 'lodash.debounce';
import DocumentContext from './contexts/DocumentContext';
import queries from '../util/queries';
import mutations from '../util/mutations';
import VisualisationContext from './contexts/VisualisationContext';
import PrefixSelect from './Select/PrefixSelect';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    maxWidth: 750,
    marginBottom: theme.spacing(2),
  },
  prefixFormControlRoot: {
    '& div': {
      borderRadius: 8,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  prefixSelect: {
    padding: theme.spacing(1.5),
  },
  prefixLabel: {
    backgroundColor: theme.palette.common.white,
  },
  nameTextFieldRoot: {
    display: 'flex',
    flexGrow: 1,
  },
  nameInputRoot: {
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  nameInput: {
    padding: theme.spacing(1.5),
  },
}));

type EditableIdentifierProps = {
  initialID: string;
  bundleID?: string;
  onChange?: (id: string) => void;
}

const EditableIdentifier: React.FC<EditableIdentifierProps> = ({
  initialID, bundleID, onChange,
}) => {
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);
  const { document, setDocument } = useContext(DocumentContext);
  const classes = useStyles();

  const initialPrefix = queries.document.parsePrefixFromID(initialID) || 'default';
  const initialName = queries.document.parseNameFromID(initialID);

  const [prefix, setPrefix] = useState<string>(initialPrefix);
  const [name, setName] = useState<string>(initialName);

  useEffect(() => {
    setPrefix(initialPrefix);
    setName(initialName);
  }, [initialPrefix, initialName]);

  const prefixIsValid = prefix !== '';
  const nameIsValid = name !== '' && !queries.document.hasNode(`${prefix}:${name}`)(document);

  const debouncedUpdateIdentifier = useCallback(debounce((prevID: string, updatedID: string) => {
    setDocument(mutations.updateIdentifier(prevID, updatedID));
    if (onChange) onChange(updatedID);
  }, 200), [document, setDocument, visualisationSettings, setVisualisationSettings]);

  useEffect(() => {
    const updatedID = prefix === 'default' ? name : `${prefix}:${name}`;
    if (prefixIsValid && nameIsValid && initialID !== updatedID) {
      debouncedUpdateIdentifier(initialID, updatedID);
    }
  }, [prefix, name, prefixIsValid, nameIsValid, initialID]);

  return (
    <Box className={classes.wrapper} display="flex">
      <PrefixSelect prefix={prefix} onChange={setPrefix} bundleID={bundleID} additionalPrefixes={['default']} />
      <TextField
        variant="outlined"
        label="Name"
        value={name}
        onChange={({ target }) => setName(target.value.replaceAll(' ', ''))}
        error={!nameIsValid && name !== initialName}
        classes={{ root: classes.nameTextFieldRoot }}
        InputProps={{ classes: { root: classes.nameInputRoot, input: classes.nameInput } }}
      />
    </Box>
  );
};

export default EditableIdentifier;
