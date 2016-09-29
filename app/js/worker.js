/* globals flights, LatLon, THREE */
(function(self) {
	'use strict';

	self.importScripts('homepage.js');

	function xyzFromLatLng(lat, lng, r) {
		var phi = (90 - lat) * Math.PI / 180;
		var theta = (360 - lng) * Math.PI / 180;

		return {
			x : r * Math.sin(phi) * Math.cos(theta),
			y : r * Math.cos(phi),
			z : r * Math.sin(phi) * Math.sin(theta)
		};
	}

	function latlngInterPoint(lat1, lng1, lat2, lng2, offset) {
		lat1 = lat1 * Math.PI / 180.0;
		lng1 = lng1 * Math.PI / 180.0;
		lat2 = lat2 * Math.PI / 180.0;
		lng2 = lng2 * Math.PI / 180.0;

		var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lng1 - lng2) / 2), 2)));
		var A = Math.sin((1 - offset) * d) / Math.sin(d);
		var B = Math.sin(offset * d) / Math.sin(d);
		var x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
		var y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
		var z = A * Math.sin(lat1) + B * Math.sin(lat2);
		var lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))) * 180 / Math.PI;
		var lng = Math.atan2(y, x) * 180 / Math.PI;

		return {
			lat : lat,
			lng : lng
		};
	}

	// vars
	var earthRadius = 0.85;
	var num_control_points = 32;
	var spline_control_points = 8;
	var count = flights.length;
	var colors = new Float32Array(count * 3 * 2 * num_control_points);
	var line_positions = new Float32Array(count * 3 * 2 * num_control_points);

	// points
	// var p = 0;
	// var positions = new Float32Array(count * 3);
	// var pointColors = new Float32Array(count * 3);
	// var sizes = new Float32Array(count);

	// iterate
	flights.slice(0, count).forEach(function(flight, i) {
		if(i % 2 === 0) {
			return;
		}

		// seperate raw values
		var start_lat = flight[0];
		var start_lng = flight[1];
		var end_lat = flight[2];
		var end_lng = flight[3];

		var p1 = new LatLon(start_lat, start_lng);
		var p2 = new LatLon(end_lat, end_lng);

		// guard - only show distances greater than 200 km
		if( p1.distanceTo(p2) / 1000 < 200 ) {
			return;
		}

		// get points for spline
		var j = 0;
		var points = [];
		var max_height = Math.random() * 0.04;
		while(j < spline_control_points) {
			var arc_angle = j * 180.0 / spline_control_points;
			var arc_radius = earthRadius + Math.sin(arc_angle * Math.PI / 180.0) * max_height;
			var latlng = latlngInterPoint(start_lat, start_lng, end_lat, end_lng, j / spline_control_points);
			var xyz = xyzFromLatLng(latlng.lat, latlng.lng, arc_radius);
			var point = new THREE.Vector3(xyz.x, xyz.y, xyz.z);
			points.push(point);
			j++;
		}

		// create spline
		var spline = new THREE.CatmullRomCurve3(points);

		// get flight path
		j = 0;
		while(j < num_control_points) {
			var start_pos = spline.getPoint(j / (num_control_points - 1));
			var end_pos = spline.getPoint((j + 1) / (num_control_points - 1));

			line_positions[(i * num_control_points + j) * 6 + 0] = start_pos.x;
			line_positions[(i * num_control_points + j) * 6 + 1] = start_pos.y;
			line_positions[(i * num_control_points + j) * 6 + 2] = start_pos.z;
			line_positions[(i * num_control_points + j) * 6 + 3] = end_pos.x;
			line_positions[(i * num_control_points + j) * 6 + 4] = end_pos.y;
			line_positions[(i * num_control_points + j) * 6 + 5] = end_pos.z;

			colors[(i * num_control_points + j) * 6 + 0] = 1.0;
			colors[(i * num_control_points + j) * 6 + 1] = 0.4;
			colors[(i * num_control_points + j) * 6 + 2] = 1.0;
			colors[(i * num_control_points + j) * 6 + 3] = 1.0;
			colors[(i * num_control_points + j) * 6 + 4] = 0.4;
			colors[(i * num_control_points + j) * 6 + 5] = 1.0;
			j++;
		}

		// get point
		// positions[3 * p + 0] = 0;
		// positions[3 * p + 1] = 0;
		// positions[3 * p + 2] = 0;

		// pointColors[3 * p + 0] = Math.random();
		// pointColors[3 * p + 1] = Math.random();
		// pointColors[3 * p + 2] = Math.random();

		// sizes[p] = 0.03;

		// p++;
	});

	self.postMessage({
		paths : {
			line_positions : line_positions,
			colors : colors,
		},
		// points : {
		// 	positions : positions,
		// 	pointColors : pointColors,
		// 	sizes : sizes,
		// },
	});

})(this);
