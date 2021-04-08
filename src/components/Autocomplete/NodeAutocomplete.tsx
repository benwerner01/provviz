import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import DocumentContext from '../context/DocumentContext';
import queries from '../../lib/queries';
import mutations from '../../lib/mutations';
import { PROVJSONBundle } from '../../lib/definition/document';
import { filterOptions, NewNode, parseNewNodeFromInput } from './util';

type NodeAutocompleteProps = {
  label: string;
  value: string | null;
  disableClearable?: boolean;
  exclude?: string[];
  variant: 'agent' | 'activity' | 'entity';
  bundleID?: string;
  onChange: (updatedDocument: PROVJSONBundle, value: string | null) => void;
}

const useAutocompleteStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 500,
  },
  inputRoot: {
    borderRadius: 8,
    '&[class*="MuiOutlinedInput-root"] ': {
      paddingTop: theme.spacing(1.5),
      paddingLeft: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      '&.MuiAutocomplete-input:first-child': {
        padding: 0,
      },
    },
  },
}));

const useStyles = makeStyles((theme) => ({
  textFieldRoot: {
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
      top: -7,
    },
  },
}));

const NodeAutocomplete: React.FC<NodeAutocompleteProps> = ({
  label, value, disableClearable, variant, exclude, bundleID, onChange,
}) => {
  const { document } = useContext(DocumentContext);

  const classes = useStyles();
  const autocompleteClasses = useAutocompleteStyles();

  const [inputValue, setInputValue] = useState<string>('');

  const options = queries.node.getAll(variant)(document)
    .filter((o) => !exclude || !exclude.includes(o));

  return (
    <Autocomplete<string | NewNode, false, true | false>
      value={value}
      inputValue={inputValue}
      options={options}
      disableClearable={disableClearable}
      onChange={(_, updatedValue) => {
        let updatedDocument = { ...document };
        if (typeof updatedValue === 'string' || updatedValue === null) {
          onChange(updatedDocument, updatedValue);
        } else {
          const { prefix, name } = updatedValue;
          const id = prefix ? `${prefix}:${name}` : name;
          updatedDocument = mutations.document.create(variant, id)(updatedDocument);
          onChange(updatedDocument, id);
        }
      }}
      onInputChange={(_, updatedInputValue) => setInputValue(updatedInputValue.replaceAll(' ', '').replaceAll(':', ''))}
      classes={autocompleteClasses}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          classes={{ root: classes.textFieldRoot }}
          placeholder={`${variant[0].toUpperCase()}${variant.slice(1)}...`}
        />
      )}
      filterOptions={(currentOptions, params) => [
        ...filterOptions(currentOptions, params),
        (params.inputValue === '' ? [] : parseNewNodeFromInput(document, bundleID)(params.inputValue)),
      ].flat()}
      getOptionLabel={(option) => (typeof option === 'string'
        ? option
        : `Create ${variant[0].toUpperCase()}${variant.slice(1)} "${option.prefix ? `${option.prefix}:${option.name}` : option.name}"`)}
    />
  );
};

export default NodeAutocomplete;
