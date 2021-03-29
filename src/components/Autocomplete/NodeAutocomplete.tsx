import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import DocumentContext from '../contexts/DocumentContext';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { PROVJSONBundle } from '../../util/definition/document';

type NodeAutocompleteProps = {
  label: string;
  value: string | null;
  disableClearable?: boolean;
  exclude?: string[];
  variant: 'agent' | 'activity' | 'entity';
  onChange: (updatedDocument: PROVJSONBundle, value: string | null) => void;
}

type NewNode = {
  prefix?: string;
  name: string;
}

const filter = createFilterOptions<string | NewNode>();

const useAutocompleteStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    maxWidth: 500,
  },
  textFieldRoot: {
    '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
      top: -7,
    },
  },
  inputRoot: {
    borderRadius: 8,
  },
  input: {
    padding: theme.spacing(1.5),
  },
}));

const NodeAutocomplete: React.FC<NodeAutocompleteProps> = ({
  label, value, disableClearable, variant, exclude, onChange,
}) => {
  const { document } = useContext(DocumentContext);

  const autocompleteClasses = useAutocompleteStyles();

  const options = queries.node.getAll(variant)(document)
    .filter((o) => !exclude || !exclude.includes(o));

  const parseNewNodeFromInput = (input: string): NewNode => ({
    prefix: queries.document.parsePrefixFromID(input),
    name: queries.document.parseNameFromID(input),
  });

  return (
    <Autocomplete<string | NewNode, false, true | false>
      value={value}
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
      classes={autocompleteClasses}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          classes={{ root: autocompleteClasses.textFieldRoot }}
          InputProps={{
            ...params.InputProps,
            classes: {
              root: autocompleteClasses.inputRoot,
              input: autocompleteClasses.input,
            },
          }}
          placeholder={`${variant[0].toUpperCase()}${variant.slice(1)}...`}
        />
      )}
      filterOptions={(currentOptions, params) => [
        ...filter(currentOptions, params),
        (params.inputValue === '' ? [] : parseNewNodeFromInput(params.inputValue)),
      ].flat()}
      getOptionLabel={(option) => (typeof option === 'string'
        ? option
        : `Create ${variant[0].toUpperCase()}${variant.slice(1)} "${option.prefix ? `${option.prefix}:${option.name}` : option.name}"`)}
    />
  );
};

export default NodeAutocomplete;
