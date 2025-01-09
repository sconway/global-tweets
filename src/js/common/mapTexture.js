import * as THREE from 'three'
import { geoEquirectangular, geoPath, select } from 'd3';

var projection = geoEquirectangular()
  .translate([1024, 512])
  .scale(325);

export function mapTexture(geojson, fillColor, strokeColor) {
  var texture, context, canvas;

  canvas = select("body").append("canvas")
    .style("display", "none")
    .attr("width", "2048px")
    .attr("height", "1024px");

  context = canvas.node().getContext("2d");

  var path = geoPath()
    .projection(projection)
    .context(context);

  context.strokeStyle = strokeColor || "transparent";
  context.lineWidth   = 1;
  context.fillStyle   = fillColor || "#CDB380";

  context.beginPath();

  path(geojson);

  if (fillColor) {
    context.fill();
  }

  context.stroke();

  // DEBUGGING - Really expensive, disable when done.
  // console.log(canvas.node().toDataURL());

  texture = new THREE.Texture(canvas.node());
  texture.needsUpdate = true;

  canvas.remove();

  return texture;
}
