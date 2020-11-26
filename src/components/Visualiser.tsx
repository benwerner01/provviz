import React, {
  useState, useEffect, useRef,
} from 'react';
import { select, BaseType } from 'd3';
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
import EditablePrefixes from './EditablePrefixes';

export type VisualiserProps = {
  document: object;
  onChange?: (newDocumnet: object) => void;
  width: number;
  height: number;
  wasmFolderURL: string;
}

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

const useStyles = makeStyles(() => ({
  wrapper: {
    position: 'relative',
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: 1,
  },
  graphvizWrapper: {
    width: '100%',
    height: 'calc(100% - 36px)',
    overflow: 'hidden',
  },
}));

const Visualiser: React.FC<VisualiserProps> = ({
  wasmFolderURL, width, height, document, onChange,
}) => {
  if (!tbdIsPROVJSONDocument(document)) throw new Error('Could not parse PROV JSON Document');
  const classes = useStyles();

  const [localDocument, setLocalDocument] = useState<PROVJSONDocument>(document);

  const wrapper = useRef<HTMLDivElement>(null);
  const graphvizWrapper = useRef<HTMLDivElement>(null);

  const [
    graphvizInstance,
    setGraphvizInstance] = useState<Graphviz<BaseType, any, BaseType, any> | undefined>();
  const [selectedNodeID, setSelectedNodeID] = useState<string | undefined>();

  useEffect(() => {
    wasmFolder(wasmFolderURL);

    if (graphvizWrapper.current) {
      setGraphvizInstance(
        graphviz(graphvizWrapper.current, { useWorker: false })
          .width(width)
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
        .attr('height', null);
    }
  }, [graphvizWrapper, width, height]);

  useEffect(() => {
    if (graphvizInstance) {
      graphvizInstance
        .renderDot(mapDocumentToDots(localDocument))
        .on('end', () => {
          const svg = select(graphvizWrapper.current).select<SVGSVGElement>('svg');

          const nodes = svg.selectAll<SVGGElement, NodeGroupDatum>('.node');

          const edges = svg.selectAll<SVGGElement, unknown>('.edge');

          nodes.on('mouseover', function mouseover() {
            select(this).style('cursor', 'pointer');
          });
          nodes.on('mouseout', function mouseout() {
            select(this).style('cursor', 'default');
          });
          nodes.on('click', ({ key, children }) => {
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
        });
    }
  }, [graphvizInstance, localDocument]);

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
        <Box display="flex">
          <Button onClick={handleCreateAgent} variant="contained">Create Agent</Button>
          <Button onClick={handleCreateActivity} variant="contained">Create Activity</Button>
          <Button onClick={handleCreateEntity} variant="contained">Create Entity</Button>
        </Box>
        <div className={classes.graphvizWrapper} ref={graphvizWrapper} />
      </Box>
      <EditablePrefixes />
    </DocumentContext.Provider>
  );
};

export default Visualiser;
