import React, {
  useCallback, useContext, useEffect, useState,
} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FromControl from '@material-ui/core/FormControl';
import Box from '@material-ui/core/Box';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import debounce from 'lodash.debounce';
import DocumentContext from './contexts/DocumentContext';
import queries from '../util/queries';
import mutations from '../util/mutations';

const useStyles = makeStyles((theme) => ({
  wrapper: {
    maxWidth: 500,
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
  onChange?: (id: string) => void;
}

const EditableIdentifier: React.FC<EditableIdentifierProps> = ({
  initialID, onChange,
}) => {
  const { document, setDocument } = useContext(DocumentContext);
  const classes = useStyles();

  const initialPrefix = initialID.split(':')[0];
  const initialName = initialID.split(':')[1];

  const [prefix, setPrefix] = useState<string>(initialPrefix);
  const [name, setName] = useState<string>(initialName);

  useEffect(() => {
    setPrefix(initialPrefix);
    setName(initialName);
  }, [initialPrefix, initialName]);

  const prefixIsValid = prefix !== '';
  const nameIsValid = name !== ''
    && !queries.bundle.hasAgent(document)(`${prefix}:${name}`)
    && !queries.bundle.hasActivity(document)(`${prefix}:${name}`)
    && !queries.bundle.hasEntity(document)(`${prefix}:${name}`);

  const debouncedUpdateIdentifier = useCallback(debounce((prevID: string, updatedID: string) => {
    setDocument((prev) => mutations.updateIdentifier(prev)(prevID, updatedID));
    if (onChange) onChange(updatedID);
  }, 200), [document]);

  useEffect(() => {
    const updatedID = `${prefix}:${name}`;
    if (prefixIsValid && nameIsValid && initialID !== updatedID) {
      debouncedUpdateIdentifier(initialID, updatedID);
    }
  }, [prefix, name, prefixIsValid, nameIsValid, initialID]);

  const handlePrefixChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const updatedPrefix = e.target.value as string;
    setPrefix(updatedPrefix);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setName(e.target.value);
  };

  return (
    <Box className={classes.wrapper} display="flex">
      <FromControl variant="outlined" classes={{ root: classes.prefixFormControlRoot }}>
        <InputLabel className={classes.prefixLabel}>Prefix</InputLabel>
        <Select
          value={prefix}
          onChange={handlePrefixChange}
          classes={{ select: classes.prefixSelect }}
        >
          {Object.keys(document.prefix).map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </Select>
      </FromControl>
      <TextField
        variant="outlined"
        label="Name"
        value={name}
        onChange={handleNameChange}
        error={!nameIsValid && name !== initialName}
        classes={{ root: classes.nameTextFieldRoot }}
        InputProps={{ classes: { root: classes.nameInputRoot, input: classes.nameInput } }}
      />
    </Box>
  );
};

export default EditableIdentifier;
