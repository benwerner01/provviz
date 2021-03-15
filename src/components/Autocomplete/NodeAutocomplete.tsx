import React, { useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import DocumentContext from '../contexts/DocumentContext';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { PROVJSONBundle } from '../../util/document';

type NodeAutocompleteProps = {
  label: string;
  value: string[];
  exclude?: string[];
  variant: 'agent' | 'activity' | 'entity';
  onChange: (updatedDocument: PROVJSONBundle, value: string[]) => void;
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
  inputRoot: {
    borderRadius: 8,
  },
}));

const NodeAutocomplete: React.FC<NodeAutocompleteProps> = ({
  label, value, variant, exclude, onChange,
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
    <Autocomplete<string | NewNode, true, false, true>
      multiple
      value={value}
      options={options}
      onChange={(_, updated) => {
        let updatedDocument = { ...document };
        const values = updated.map((item) => {
          if (typeof item === 'string') return item;
          const { prefix, name } = item;
          const id = prefix ? `${prefix}:${name}` : name;
          updatedDocument = mutations.document.create(variant, id)(updatedDocument);
          return id;
        });
        onChange(updatedDocument, values);
      }}
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
        : `Create ${variant[0].toUpperCase()}${variant.slice(1)} "${option.prefix ? `${option.prefix}:${option.name}` : option.name}"`)}
    />
  );
};

export default NodeAutocomplete;
