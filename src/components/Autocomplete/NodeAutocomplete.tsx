import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import DocumentContext from '../contexts/DocumentContext';
import queries from '../../util/queries';

type NodeAutocompleteProps = {
  label: string;
  value: string[];
  exclude?: string[];
  variant: 'agent' | 'activity' | 'entity';
  onChange: (value: string[]) => void;
}

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
  const { document } = useContext(DocumentContext);

  const autocompleteClasses = useAutocompleteStyles();

  const options = queries[variant].getAll(document).filter((o) => !exclude || !exclude.includes(o));

  return (
    <Autocomplete<string, true, false, true>
      multiple
      value={value}
      options={options}
      onChange={(_, updated) => onChange(updated)}
      classes={autocompleteClasses}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          label={label}
          placeholder={`${variant[0].toUpperCase()}${variant.slice(1)}...`}
        />
      )}
    />
  );
};

export default NodeAutocomplete;
