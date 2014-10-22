// couple of constants
var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var WIDTH = 1000;
var HEIGHT = 600;

var FOV = 30;
var NEAR = 1;
var FAR = 4000;

var quakeData;

// some global variables and initialization code
// simple basic renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize(WIDTH, HEIGHT);
renderer.setClearColor(0x000000);

// add it to the target element
var mapDiv = document.getElementById("globe");
mapDiv.appendChild(renderer.domElement);

// setup a camera that points to the center
var camera = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, NEAR, FAR);
camera.position.set(POS_X, POS_Y, POS_Z);
camera.lookAt(new THREE.Vector3(0, 0, 0));

var controls;
controls = new THREE.OrbitControls(camera);
controls.addEventListener('change', render);

// create a basic scene and add the camera
var scene = new THREE.Scene();
scene.add(camera);

var earth = new THREE.Object3D();
scene.add(earth);


// we wait until the document is loaded before loading the
// density data.
$(document).ready(function () {
  //jQuery.get('data/usgs-past-month.geojson', function (data) {
  jQuery.getJSON("data/usgs-past-month.geojson", function (data) {
    // console.log(data);
    //quakeData = JSON.parse(data);
    parseQuakes(data);
    addLights();
    addEarth();
    // addClouds();
    render();
    animate();
  });
});

function parseQuakes(data) {

  var quakes = data.features;

  // the geometry that will contain all our cubes
  var totalGeom = new THREE.Geometry();
  // material to use for each of our elements. Could use a set of materials to
  // add colors relative to the density. Not done here.
  var cubeMat = new THREE.MeshLambertMaterial({
    color: 0x0000ff,
    opacity: 0.6,
    emissive: 0xff0000,
    transparent: true
  });

  var lat, lng, depth, mag;

  // console.log(quakes[0]);
  quakes.forEach(function (quake) {
    lng = quake.geometry.coordinates[0];
    lat = quake.geometry.coordinates[1];
    depth = quake.geometry.coordinates[2];
    mag = quake.properties.mag;
    // console.log(lat + '|' + lng + '|' + depth + '|' + mag);

    //get the data, and set the offset, we need to do this since the x,y coordinates
    // //from the data aren't in the correct format
    // var x = parseInt(data[i][0]) + 180;
    // var y = parseInt((data[i][1]) - 84) * -1;
    // var value = parseFloat(data[i][2]);

    // calculate the position where we need to start the cube
    var position = latLongToVector3(lat, lng, 500, -depth / 10 + mag * 5 / 2);
    // console.log(position);

    // create the cube
    var cubeGeom = new THREE.BoxGeometry(2, 2, mag * 5);

    //var cubeMesh = new THREE.Mesh(cubeGeom, cubeMat);
    var cubeMesh = new THREE.Mesh(cubeGeom);
    cubeMesh.position.copy(position);
    cubeMesh.lookAt(new THREE.Vector3(0, 0, 0));

    // merge with main model
    cubeMesh.updateMatrix();
    totalGeom.merge(cubeMesh.geometry, cubeMesh.matrix);
    // scene.add(cubeMesh);
  });


  // create a new mesh, containing all the other meshes.
  var totalMat = new THREE.MeshNormalMaterial({
    color: 0xffffff,
    opacity: 0.8,
    emissive: 0xffffff,
    wireframe: false,
    //transparent: true
  });
  var total = new THREE.Mesh(totalGeom, totalMat);
  // var total = new THREE.Mesh(totalGeom, cubeMat);

  // and add the total mesh to the scene
  earth.add(total);
}

// add a simple light
function addLights() {
  light = new THREE.DirectionalLight(0x7EC0EE, 5, 1);
  light.position.set(POS_X, POS_Y, POS_Z);
  scene.add(light);

  var ambientLight = new THREE.AmbientLight(0xffffff);
  scene.add(ambientLight);
  render();
}

// add the earth
function addEarth() {
  // var spGeo = new THREE.SphereGeometry(600, 50, 50);
  // var planetTexture = THREE.ImageUtils.loadTexture("assets/world-big-2-grey.jpg");
  // var mat2 = new THREE.MeshPhongMaterial({
  //   map: planetTexture,
  //   perPixel: false,
  //   shininess: 0.2
  // });
  // sp = new THREE.Mesh(spGeo, mat2);
  // scene.add(sp);

  var loader = new THREE.TextureLoader();
  loader.load('assets/world-big-2-grey.jpg', function (texture) {

    var geometry = new THREE.SphereGeometry(500, 50, 50);


    //texture.magFilter = THREE.NearestFilter;
    //texture.minFilter = THREE.LinearMipMapLinearFilter;
    // texture.needsUpdate = true;
    //var maxAnisotropy = renderer.getMaxAnisotropy();
    texture.anisotropy = 256;
    var earthMat = new THREE.MeshBasicMaterial({
      map: texture,
      overdraw: 1,
      opacity: 0.85,
      transparent: true
    });
    var bg = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true
    });
    //var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, [earth, bg]);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([earthMat]));
    earth.add(mesh);
    render();
  });
}

// add clouds
function addClouds() {
  var spGeo = new THREE.SphereGeometry(510, 50, 50);
  var cloudsTexture = THREE.ImageUtils.loadTexture("assets/earth_clouds_1024.png");
  var materialClouds = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    map: cloudsTexture,
    transparent: true,
    opacity: 0.3
  });

  meshClouds = new THREE.Mesh(spGeo, materialClouds);
  meshClouds.scale.set(1.015, 1.015, 1.015);
  earth.add(meshClouds);
  render();
}

// convert the positions from a lat, lon to a position on a sphere.
function latLongToVector3(lat, lon, radius, height) {
  var phi = (lat) * Math.PI / 180;
  var theta = (lon - 180) * Math.PI / 180;

  var x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
  var y = (radius + height) * Math.sin(phi);
  var z = (radius + height) * Math.cos(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}


// render the scene
function render() {
  //var timer = Date.now() * 0.0005;
  //camera.position.x = (Math.cos(timer) * 1800);
  //camera.position.z = (Math.sin(timer) * 1800);
  //camera.lookAt(scene.position);
  earth.rotation.y += 0.001;
  light.position = camera.position;
  light.lookAt(scene.position);
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
  controls.update();
}

// function animate() {

//   requestAnimationFrame(animate);

//   controls.update();

//   var timer = Date.now() * 0.0005;
//   camera.position.x = (Math.cos(timer) * 1800);
//   camera.position.z = (Math.sin(timer) * 1800);
//   //camera.lookAt(scene.position);

//   renderer.render(scene, camera);
// }


// from http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data
function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );


  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;


  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec(strData)) {

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
    ) {

      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);

    }


    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[2]) {

      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(
        new RegExp("\"\"", "g"),
        "\""
      );

    }
    else {

      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];

    }


    // Now that we have our value string, let's add
    // it to the data array.
    arrData[arrData.length - 1].push(strMatchedValue);
  }

  // Return the parsed data.
  return (arrData);
}
