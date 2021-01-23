import React, { useContext, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Collapse from '@material-ui/core/Collapse';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import DocumentContext from '../contexts/DocumentContext';
import EditableIdentifier from '../EditableIdentifier';
import NodeAutocomplete from '../Autocomplete/NodeAutocomplete';
import queries from '../../util/queries';
import mutations from '../../util/mutations';
import { RelationName, relations } from '../../util/document';
import ColorPicker from '../ColorPicker';
import VisualisationContext from '../contexts/VisualisationContext';

const useStyles = makeStyles((theme) => ({
  collapseHeadingWrapper: {
    position: 'relative',
    left: -1 * theme.spacing(2),
  },
  collapseIconButton: {
    padding: theme.spacing(1),
  },
  collapseTypography: {
    fontWeight: 800,
  },
  collapse: {
    padding: theme.spacing(0, 0, 0, 3),
  },
}));

type NodeTabProps = {
  variant: 'agent' | 'activity' | 'entity';
  id: string;
  onIDChange?: (id: string) => void;
}

const NodeTab: React.FC<NodeTabProps> = ({ variant, id, onIDChange }) => {
  const { document, setDocument } = useContext(DocumentContext);
  const { visualisationSettings, setVisualisationSettings } = useContext(VisualisationContext);
  const classes = useStyles();

  const [collapsedSections, setCollapsedSections] = useState<boolean[]>([false, true, true]);
  const [collapseDefinition, setCollapseDefinition] = useState<boolean>(false);
  const [collapseRelationships, setCollapseRelationships] = useState<boolean>(true);
  const [collapseVisualisation, setCollapseVisualisation] = useState<boolean>(true);

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
      {collapsableSections.map(({ name, content }, i) => (
        <React.Fragment key={name}>
          <Divider />
          <Box display="flex" alignItems="center" className={classes.collapseHeadingWrapper}>
            <IconButton
              className={classes.collapseIconButton}
              onClick={() => setCollapsedSections([
                ...collapsedSections.slice(0, i),
                !collapsedSections[i],
                ...collapsedSections.slice(i + 1),
              ])}
            >
              <ArrowDropDownIcon style={{ transform: `rotate(${collapsedSections[i] ? -90 : 0}deg)` }} />
            </IconButton>
            <Typography className={classes.collapseTypography} variant="h5">{name}</Typography>
          </Box>
          <Collapse className={classes.collapse} in={!collapsedSections[i]}>
            {content}
          </Collapse>
        </React.Fragment>
      ))}
    </>
  );
};

export default NodeTab;
