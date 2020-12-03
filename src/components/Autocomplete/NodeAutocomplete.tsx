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

type NewNode = {
  prefix: string;
  name: string;
}

const filter = createFilterOptions<string | NewNode>();

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

  const parseNewNodeFromInput = (input: string): NewNode => (
    input.includes(':')
      ? { prefix: input.split(':')[0], name: input.split(':').slice(1).join('') }
      : { prefix: defaultPrefix, name: input }
  );

  return (
    <Autocomplete<string | NewNode, true, false, true>
      multiple
      value={value}
      options={options}
      onChange={(_, updated) => onChange(updated.map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        const { prefix, name } = item;
        setDocument((prevDocument) => mutations[variant].create(prevDocument)(prefix, name));
        return `${prefix || defaultPrefix}:${name}`;
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
        (params.inputValue === '' ? [] : parseNewNodeFromInput(params.inputValue)),
      ].flat()}
      getOptionLabel={(option) => (typeof option === 'string'
        ? option
        : `Create ${variant[0].toUpperCase()}${variant.slice(1)} "${option.prefix}:${option.name}"`)}
    />
  );
};

export default NodeAutocomplete;
