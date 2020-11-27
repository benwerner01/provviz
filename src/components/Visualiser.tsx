import React, {
  useState, useEffect, useRef,
} from 'react';
import { select, BaseType, Selection } from 'd3';
import { wasmFolder } from '@hpcc-js/wasm';
import { Graphviz, graphviz } from 'd3-graphviz';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { mapDocumentToDots } from '../util/dot';
import {
  createActivity, createAgent, createEntity, PROVJSONDocument, tbdIsPROVJSONDocument,
} from '../util/document';
import DocumentContext from './contexts/DocumentContext';
import Editor, { EDITOR_CONTENT_HEIGHT } from './Editor';

export type VisualiserProps = {
  document: object;
  onChange?: (newDocumnet: object) => void;
  width: number;
  height: number;
  wasmFolderURL: string;
}

const HEADER_HEIGHT = 48;
const TABS_HEIGHT = 48;

interface NodeDatum {
  attributes: {
    id: string;
    class: string;
  }
  key: string;
  tag: string;
}

interface NodeEllipseChildDatum extends NodeDatum {
  center: { x: string; y: string; }
  tag: 'ellipse'
}

interface NodePolygonChildDatum extends NodeDatum {
  center: { x: string; y: string; }
  tag: 'polygon'
}

interface NodeGroupDatum extends NodeDatum {
  children: (NodeEllipseChildDatum | NodePolygonChildDatum)[];
  tag: 'g';
}

const useStyles = makeStyles((theme) => ({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderStyle: 'solid',
    borderColor: theme.palette.grey[300],
    borderWidth: 1,
  },
  heading: {
    height: HEADER_HEIGHT,
  },
  graphvizWrapper: {
    width: '100%',
    height: '100%',
    transition: theme.transitions.create('max-height'),
    overflow: 'hidden',
  },
}));

const Visualiser: React.FC<VisualiserProps> = ({
  wasmFolderURL, width, height, document, onChange,
}) => {
  if (!tbdIsPROVJSONDocument(document)) throw new Error('Could not parse PROV JSON Document');
  const classes = useStyles();
  const graphvizWrapper = useRef<HTMLDivElement>(null);

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);
  const [displayEditor, setDisplayEditor] = useState<boolean>(false);

  const [selectedNodeID, setSelectedNodeID] = useState<string | undefined>();
  const [
    graphvizInstance,
    setGraphvizInstance] = useState<Graphviz<BaseType, any, BaseType, any> | undefined>();
  const [
    d3Nodes,
    setD3Nodes,
  ] = useState<Selection<SVGGElement, NodeGroupDatum, SVGSVGElement, unknown> | undefined>();
  const [
    d3Edges,
    setD3Edges,
  ] = useState<Selection<SVGGElement, unknown, SVGSVGElement, unknown> | undefined>();

  const graphvizHeight = height - HEADER_HEIGHT - TABS_HEIGHT;

  useEffect(() => {
    wasmFolder(wasmFolderURL);

    if (graphvizWrapper.current) {
      setGraphvizInstance(
        graphviz(graphvizWrapper.current, { useWorker: false })
          .width(width)
          .height(graphvizHeight)
          .fit(true)
          .transition(() => 'ease'),
      );
    }
  }, [graphvizWrapper]);

  useEffect(() => {
    if (graphvizWrapper.current) {
      select<HTMLDivElement, unknown>(graphvizWrapper.current)
        .select<SVGSVGElement>('svg')
        .attr('width', `${width}px`)
        .attr('height', `${graphvizHeight}px`);
    }
  }, [graphvizWrapper, width, height]);

  useEffect(() => {
    if (graphvizInstance) {
      graphvizInstance
        .renderDot(mapDocumentToDots(localDocument))
        .on('end', () => {
          const svg = select(graphvizWrapper.current).select<SVGSVGElement>('svg');

          setD3Nodes(svg.selectAll<SVGGElement, NodeGroupDatum>('.node'));
          setD3Edges(svg.selectAll<SVGGElement, unknown>('.edge'));
        });
    }
  }, [graphvizInstance, localDocument]);

  useEffect(() => {
    if (graphvizWrapper.current && graphvizInstance && d3Nodes && d3Edges) {
      const svg = select<HTMLDivElement, unknown>(graphvizWrapper.current).select<SVGSVGElement>('svg');

      const selectedNodeGroup = selectedNodeID
        ? d3Nodes.filter(({ key }) => selectedNodeID === key)
        : undefined;

      const deselectedNodeGroups = d3Nodes.filter(({ key }) => selectedNodeID !== key);

      if (selectedNodeGroup) selectedNodeGroup.selectAll('ellipse, polygon').attr('stroke', 'red');
      if (deselectedNodeGroups) deselectedNodeGroups.selectAll('ellipse, polygon').attr('stroke', 'black');

      d3Nodes.on('mouseover', function mouseover() {
        const nodeGroup = select(this);
        nodeGroup.style('cursor', 'pointer');

        nodeGroup.selectAll('ellipse, polygon').attr('stroke', 'red');
      });

      d3Nodes.on('mouseout', function mouseout({ key }) {
        const nodeGroup = select(this);
        nodeGroup.style('cursor', 'default');

        if (key !== selectedNodeID) {
          nodeGroup.selectAll('ellipse, polygon').attr('stroke', 'black');
        }
      });

      d3Nodes.on('click', ({ key, children }) => {
        setSelectedNodeID(key);
        const zoom = graphvizInstance.zoomBehavior();

        const { center } = children.find(({ tag }) => tag === 'ellipse' || tag === 'polygon') || {};

        if (zoom && center) {
          const graph = svg.select<SVGGElement>('.graph');
          const graphHeight = graph.node()!.getBBox().height;
          const graphWidth = graph.node()!.getBBox().width;

          const { x, y } = center;
          const translateToX = parseFloat(x) + graphWidth / 2;
          const translateToY = parseFloat(y) + height / 2;

          // zoom.scaleTo(svg.transition(), 1);
          // zoom.translateTo(svg.transition(), translateToX, translateToY);
        }
      });
    }
  }, [d3Nodes, d3Edges, selectedNodeID]);

  const handleCreateAgent = () => {
    setLocalDocument(createAgent(localDocument)('test', '1'));
  };

  const handleCreateActivity = () => {
    setLocalDocument(createActivity(localDocument)('test', '1'));
  };

  const handleCreateEntity = () => {
    setLocalDocument(createEntity(localDocument)('test', '1'));
  };

  return (
    <DocumentContext.Provider value={{ document: localDocument, setDocument: setLocalDocument }}>
      <Box className={classes.wrapper} style={{ width, height }}>
        <Box display="flex" className={classes.heading}>
          <Button onClick={handleCreateAgent} variant="contained">Create Agent</Button>
          <Button onClick={handleCreateActivity} variant="contained">Create Activity</Button>
          <Button onClick={handleCreateEntity} variant="contained">Create Entity</Button>
        </Box>
        <div
          style={{ maxHeight: graphvizHeight }}
          className={classes.graphvizWrapper}
          ref={graphvizWrapper}
        />
        <Editor
          selectedNodeID={selectedNodeID}
          setSelectedNodeID={setSelectedNodeID}
          open={displayEditor}
          setOpen={setDisplayEditor}
        />
      </Box>
    </DocumentContext.Provider>
  );
};

export default Visualiser;
