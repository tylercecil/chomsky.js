import { Tree } from './tree';
import { Selection } from 'd3-selection';
import { hierarchy, tree as d3tree, HierarchyPointNode } from 'd3-hierarchy';

// TODO: Make a configuration object, which the user may update.
const nodeSize = 0.2;
const linkWidth = 0.01;
const margin = { x: 1.5 * nodeSize, y: 1.2 * nodeSize };
const maxScale = 150;

type Div = Selection<HTMLDivElement, string, HTMLElement, undefined>;
type SVG = Selection<SVGSVGElement, string, HTMLElement, undefined>;
type TreeData = HierarchyPointNode<Tree>;

/**
 * Renders `tree` into an SVG, and then sets the body of `div` to that SVG.
 *
 * @param {Tree} tree Tree to be rendered into SVG.
 * @param {Selection} div `<div>` to be associated with `tree`.
 */
export function render(tree: Tree, div: Div) {
  const root: TreeData = hierarchy(tree) as TreeData;
  const layout = d3tree().nodeSize([1, 1]);
  layout(root);

  div.html('');

  const svg = makeSVG(div, root);
  makeNodes(svg, root);
  makeLinks(svg, root);
  styleTree(svg);
}

function styleTree(svg: SVG) {
  svg.selectAll('g.nodes g.node ellipse').style('fill', 'white');
  svg
    .selectAll('g.links line')
    .style('stroke', 'black')
    .style('stroke-width', linkWidth);
}

function viewBox(root: TreeData) {
  // By default, the layout designates a node as being 1x1, so all calculations
  // here may be done as a percentage of that node size. The viewbox will
  // ultimately contain the entire tree.

  const max = { x: -Infinity, y: -Infinity };
  const min = { x: Infinity, y: Infinity };
  root.each((d) => {
    max.x = Math.max(d.x, max.x);
    max.y = Math.max(d.y, max.y);
    min.x = Math.min(d.x, min.x);
    min.y = Math.min(d.y, min.y);
  });

  return [
    min.x - margin.x,
    min.y - margin.y,
    max.x - min.x + 2 * margin.x,
    max.y - min.y + 2 * margin.y,
  ];
}

function makeSVG(div: Div, root: TreeData) {
  const vb = viewBox(root);
  const svg = div
    .append('svg')
    .attr('viewBox', vb.join(' '))
    .style('max-width', vb[2] * maxScale)
    .style('display', 'block')
    .style('margin', 'auto');
  svg.append('g').classed('links', true);
  svg.append('g').classed('nodes', true);

  return svg;
}

function makeNodes(svg: SVG, root: TreeData) {
  svg
    .select('g.nodes')
    .selectAll('g.node')
    .data(root.descendants())
    .join((enter) => {
      const node = enter.append('g').classed('node', true);
      node
        .append('ellipse')
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y)
        .attr('ry', nodeSize)
        .attr('rx', nodeSize);
      node
        .append('text')
        .text((d) => d.data.nodeType?.name ?? '')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y - 0.1 * nodeSize)
        .attr('font-size', nodeSize)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');
      node
        .append('text')
        .text((d) => d.data.leaf?.data ?? '')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y + nodeSize)
        .attr('font-size', nodeSize * 0.9)
        .attr('dominant-baseline', 'middle')
        .attr('text-anchor', 'middle');
      return node;
    });
}

function makeLinks(svg: SVG, root: TreeData) {
  svg
    .select('g.links')
    .selectAll('line.link')
    .data(root.links())
    .enter()
    .append('line')
    .classed('link', true)
    .attr('x1', (d) => d.source.x)
    .attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x)
    .attr('y2', (d) => d.target.y);
}
