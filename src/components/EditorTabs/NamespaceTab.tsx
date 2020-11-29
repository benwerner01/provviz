import React, { useState, useEffect, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { PROVJSONDocument } from '../../util/document';
import mutations from '../../util/mutations';
import DocumentContext from '../contexts/DocumentContext';

const PREFIX_INPUT_WIDTH = 150;
const PREFIX_VALUE_WIDTH = 300;

type Prefix = {
  name: string;
  value: string;
}

const useEditablePrefixStyles = makeStyles(() => ({
  nameTextFieldRoot: {
    width: PREFIX_INPUT_WIDTH,
  },
  valueTextFieldRoot: {
    width: PREFIX_VALUE_WIDTH,
  },
}));

type EditablePrefixProps = {
  initialPrefix: Prefix;
  updateName: (name: string) => void;
  updateValue: (value: string) => void;
  isUniqueName: (name: string) => boolean;
}

const EditablePrefix: React.FC<EditablePrefixProps> = ({
  initialPrefix,
  updateName,
  updateValue,
  isUniqueName,
}) => {
  const classes = useEditablePrefixStyles();

  const [name, setName] = useState<string>(initialPrefix.name);
  const [value, setValue] = useState<string>(initialPrefix.value);

  const nameIsValid = name !== '' && isUniqueName(name);
  const valueIsValid = value !== '';

  useEffect(() => {
    if (nameIsValid && name !== initialPrefix.name) updateName(name);
  }, [name, nameIsValid]);

  useEffect(() => {
    if (valueIsValid && value !== initialPrefix.value) updateValue(value);
  }, [value, valueIsValid]);

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <Box>
      <TextField
        value={name}
        onChange={handleNameChange}
        classes={{ root: classes.nameTextFieldRoot }}
        error={!nameIsValid}
      />
      <TextField
        value={value}
        onChange={handleValueChange}
        classes={{ root: classes.valueTextFieldRoot }}
        error={!valueIsValid}
      />
    </Box>
  );
};

type NamespaceTabProps = {

}

const mapDocumentToPrefixes = ({ prefix }: PROVJSONDocument) => Object
  .keys(prefix)
  .map((name) => ({ name, value: prefix[name] }));

const NamespaceTab: React.FC<NamespaceTabProps> = () => {
  const { document, setDocument } = useContext(DocumentContext);
  console.log('Document: ', document);

  const [prefixes, setPrefixes] = useState<Prefix[]>(mapDocumentToPrefixes(document));

  const updateName = (index: number) => (name: string) => {
    const prevName = prefixes[index].name;

    setPrefixes([
      ...prefixes.slice(0, index),
      { name, value: prefixes[index].value },
      ...prefixes.slice(index + 1, prefixes.length),
    ]);

    setDocument((prev) => mutations.prefix.updateName(prev)(prevName, name));
  };

  const updateValue = (index: number) => (value: string) => {
    const { name } = prefixes[index];

    setPrefixes([
      ...prefixes.slice(0, index),
      { name, value },
      ...prefixes.slice(index + 1, prefixes.length),
    ]);

    setDocument((prev) => mutations.prefix.updateValue(prev)(name, value));
  };

  return (
    <>
      <Box display="flex">
        <Typography variant="h5" style={{ minWidth: PREFIX_INPUT_WIDTH }}>Prefix</Typography>
        <Typography variant="h5">Value</Typography>
      </Box>
      {prefixes.map((prefix, index) => (
        <EditablePrefix
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          initialPrefix={prefix}
          updateName={updateName(index)}
          updateValue={updateValue(index)}
          isUniqueName={(name: string) => prefixes
            .find((p, i) => i !== index && p.name === name) === undefined}
        />
      ))}
    </>
  );
};

export default NamespaceTab;
