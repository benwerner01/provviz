import React, { useContext } from 'react';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { RelationName, relations } from '../../util/document';
import ColorPicker from '../ColorPicker';
import VisualisationContext from '../contexts/VisualisationContext';
import Section from './Section';

type NodeTabProps = {
  variant: 'agent' | 'activity' | 'entity';
  id: string;
  onIDChange?: (id: string) => void;
}

const NodeTab: React.FC<NodeTabProps> = ({ variant, id, onIDChange }) => {
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);

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

  const handleColorChange = (updatedColor: string) => {
    const existingOverrideIndex = visualisationSettings.palette.overrides
      .findIndex(({ nodeID }) => nodeID === id);

    setVisualisationSettings((prev) => ({
      ...prev,
      palette: {
        ...prev.palette,
        overrides: existingOverrideIndex < 0
          ? [...prev.palette.overrides, { nodeID: id, color: updatedColor }]
          : [
            ...prev.palette.overrides.slice(0, existingOverrideIndex),
            { nodeID: id, color: updatedColor },
            ...prev.palette.overrides.slice(existingOverrideIndex + 1),
          ],
      },
    }));
  };

  const handleClearOverridingColor = () => {
    const existingOverrideIndex = visualisationSettings.palette.overrides
      .findIndex(({ nodeID }) => nodeID === id);

    if (existingOverrideIndex >= 0) {
      setVisualisationSettings((prev) => ({
        ...prev,
        palette: {
          ...prev.palette,
          overrides: [
            ...prev.palette.overrides.slice(0, existingOverrideIndex),
            ...prev.palette.overrides.slice(existingOverrideIndex + 1),
          ],
        },
      }));
    }
  };

  const overridingColor = visualisationSettings.palette.overrides
    .find(({ nodeID }) => nodeID === id)?.color;

  const color = overridingColor || visualisationSettings.palette[variant];

  const collapsableSections = [
    {
      name: 'Definition',
      initiallyOpen: true,
      content: (
        <>
          <EditableIdentifier initialID={id} onChange={onIDChange} />
        </>
      ),
    },
    {
      name: 'Relationships',
      content: relations.filter(({ domain }) => domain === variant).map(({ name, range }) => (
        <NodeAutocomplete
          key={name}
          variant={range}
          label={name}
          value={relationRangeIncludes[name]}
          exclude={[id]}
          onChange={handleRelationRangeChange(name)}
        />
      )),
    },
    {
      name: 'Visualisation',
      content: (
        <>
          <ColorPicker
            label="Override Color"
            initialColor={color}
            onChange={handleColorChange}
            onClear={overridingColor ? handleClearOverridingColor : undefined}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <Box display="flex" mb={1}>
        <Typography variant="h5">
          <strong>
            {`${variant[0].toUpperCase()}${variant.slice(1)}: `}
          </strong>
          {fullName}
        </Typography>
      </Box>
      <Divider />
      {collapsableSections.map(({ initiallyOpen, name, content }) => (
        <Section key={name} initiallyOpen={initiallyOpen} name={name}>{content}</Section>
      ))}
    </>
  );
};

export default NodeTab;
