import React, {
  useCallback, useContext, useEffect, useState,
  useMemo, useLayoutEffect,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import debounce from 'lodash.debounce';
import DocumentContext from './context/DocumentContext';
import queries from '../lib/queries';
import mutations from '../lib/mutations';
import VisualisationContext from './context/VisualisationContext';
import PrefixSelect from './Select/PrefixSelect';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    maxWidth: 750,
    marginBottom: theme.spacing(1.5),
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

export type EditableIdentifierProps = {
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

  const initialPrefix = useMemo(() => queries.document.parsePrefixFromID(initialID), [initialID]);
  const initialName = useMemo(() => queries.document.parseNameFromID(initialID), [initialID]);

  const [changed, setChanged] = useState<boolean>(false);
  const [prefix, setPrefix] = useState<string>(initialPrefix);
  const [name, setName] = useState<string>(initialName);

  useLayoutEffect(() => {
    setPrefix(initialPrefix);
    setName(initialName);
    setChanged(false);
  }, [initialPrefix, initialName]);

  const prefixIsValid = prefix !== '';
  const nameIsValid = name !== '' && !queries.document.hasNode(`${prefix}:${name}`)(document);

  const debouncedUpdateIdentifier = useCallback(debounce((prevID: string, updatedID: string) => {
    setDocument(mutations.updateIdentifier(prevID, updatedID));
    if (onChange) onChange(updatedID);
  }, 1000), [document, setDocument, visualisationSettings, setVisualisationSettings]);

  useEffect(() => {
    const updatedID = prefix === 'default' ? name : `${prefix}:${name}`;

    if (
      changed
      && initialID.includes(initialPrefix)
      && initialID.includes(initialName)
      && prefixIsValid
      && nameIsValid
      && initialID !== updatedID
    ) {
      debouncedUpdateIdentifier(initialID, updatedID);
    }
  }, [changed, prefix, name, prefixIsValid, nameIsValid, initialID]);

  return (
    <Box className={classes.wrapper} display="flex">
      <PrefixSelect
        prefix={prefix}
        onChange={(updatedPrefix) => {
          setPrefix(updatedPrefix);
          if (!changed) setChanged(true);
        }}
        bundleID={bundleID}
      />
      <TextField
        variant="outlined"
        label="Name"
        value={name}
        onChange={({ target }) => {
          setName(target.value.replaceAll(' ', '').replaceAll(':', ''));
          if (!changed) setChanged(true);
        }}
        error={!nameIsValid && name !== initialName}
        classes={{ root: classes.nameTextFieldRoot }}
        InputProps={{ classes: { root: classes.nameInputRoot, input: classes.nameInput } }}
      />
    </Box>
  );
};

export default EditableIdentifier;
