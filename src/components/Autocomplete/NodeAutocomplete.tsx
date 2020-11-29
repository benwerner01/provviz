import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import DocumentContext from '../contexts/DocumentContext';
import queries from '../../util/queries';
import mutations from '../../util/mutations';

type NodeAutocompleteProps = {
  label: string;
  value: string[];
  exclude?: string[];
  variant: 'agent' | 'activity' | 'entity';
  onChange: (value: string[]) => void;
}

const filter = createFilterOptions<string | { createNode: string }>();

const useAutocompleteStyles = makeStyles((theme) => ({
  root: {
    maxWidth: 500,
    marginBottom: theme.spacing(2),
  },
  inputRoot: {
    borderRadius: 8,
  },
}));

const NodeAutocomplete: React.FC<NodeAutocompleteProps> = ({
  label, value, variant, exclude, onChange,
}) => {
  const { document, setDocument } = useContext(DocumentContext);

  const autocompleteClasses = useAutocompleteStyles();

  const options = queries[variant].getAll(document).filter((o) => !exclude || !exclude.includes(o));

  const defaultPrefix = queries.prefix.getAll(document)[0];

  return (
    <Autocomplete<string | { createNode: string; }, true, false, true>
      multiple
      value={value}
      options={options}
      onChange={(_, updated) => onChange(updated.map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        setDocument((prevDocument) => (
          mutations[variant].create(prevDocument)(defaultPrefix, item.createNode)));
        return `${defaultPrefix}:${item.createNode}`;
      }))}
      classes={autocompleteClasses}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          placeholder={`${variant[0].toUpperCase()}${variant.slice(1)}...`}
        />
      )}
      filterOptions={(currentOptions, params) => [
        ...filter(currentOptions, params),
        (params.inputValue === '' ? [] : { createNode: params.inputValue }),
      ].flat()}
      getOptionLabel={(option) => (typeof option === 'string'
        ? option
        : `Create ${variant[0].toUpperCase()}${variant.slice(1)} "${defaultPrefix}:${option.createNode}"`)}
    />
  );
};

export default NodeAutocomplete;
