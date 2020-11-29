import React, { useContext } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { RelationName, relations } from '../../util/document';

type NodeTabProps = {
  variant: 'agent' | 'activity' | 'entity';
  id: string;
  onIDChange?: (id: string) => void;
}

const NodeTab: React.FC<NodeTabProps> = ({ variant, id, onIDChange }) => {
  const { document, setDocument } = useContext(DocumentContext);

  const relationRangeIncludes = relations
    .filter(({ domain }) => domain === variant)
    .reduce((prev, { name }) => ({
      ...prev,
      [name]: queries.relation.getRangeWithDomain(document)(name, id),
    }), {} as { [key: string]: string[] });

  const handleRelationRangeChange = (relationName: RelationName) => (rangeIDs: string[]) => {
    const rangeIncludes = relationRangeIncludes[relationName];
    const add = rangeIDs.filter((rangeID) => !rangeIncludes.includes(rangeID));
    const remove = rangeIncludes.filter((rangeID) => !rangeIDs.includes(rangeID));

    add.forEach((activityID) => {
      const relationID = queries.relation.generateID(document);
      setDocument((prevDocument) => (
        mutations.relation.create(prevDocument)(relationName, relationID, id, activityID)));
    });
    remove.forEach((activityID) => {
      const relationID = queries.relation.getID(document)(relationName, id, activityID);
      if (!relationID) throw new Error('Could not find relationID');

      setDocument((prevDocument) => ({
        ...prevDocument,
        ...mutations.relation.delete(prevDocument)(relationName, relationID),
      }));
    });
  };

  const fullName = queries.node.getFullName(document)(id);

  return (
    <>
      <Box display="flex" mb={3}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {fullName}
        </Typography>
      </Box>
      <EditableIdentifier initialID={id} onChange={onIDChange} />
      {relations.filter(({ domain }) => domain === variant).map(({ name, range }) => (
        <NodeAutocomplete
          key={name}
          variant={range}
          label={name}
          value={relationRangeIncludes[name]}
          exclude={[id]}
          onChange={handleRelationRangeChange(name)}
        />
      ))}
    </>
  );
};

export default NodeTab;
