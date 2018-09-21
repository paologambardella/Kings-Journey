(function (console, $hx_exports) { "use strict";
var Cube = $hx_exports.Cube = function(x,y,z) {
	this.v = [x,y,z];
};
Cube.direction = function(i) {
	return new Cube(Cube._directions[i][0],Cube._directions[i][1],Cube._directions[i][2]);
};
Cube.makeLine = function(A,B) {
	var d = A.subtract(B);
	var N = 0;
	var _g = 0;
	while(_g < 3) {
		var i = _g++;
		var j = (i + 1) % 3;
		var distance = Std["int"](Math.abs(d.v[i] - d.v[j]));
		if(distance > N) N = distance;
	}
	var cubes = [];
	var prev = new Cube(0,0,-999);
	var _g1 = 0;
	var _g2 = N + 1;
	while(_g1 < _g2) {
		var i1 = _g1++;
		var c = A.add(d.scale(i1 / N)).round();
		if(!c.equals(prev)) {
			cubes.push(c);
			prev = c;
		}
	}
	return cubes;
};
Cube.prototype = {
	toString: function() {
		return this.v.join(",");
	}
	,equals: function(other) {
		return this.v[0] == other.v[0] && this.v[1] == other.v[1] && this.v[2] == other.v[2];
	}
	,scale: function(f) {
		return new Cube(f * this.v[0],f * this.v[1],f * this.v[2]);
	}
	,add: function(other) {
		return new Cube(this.v[0] + other.v[0],this.v[1] + other.v[1],this.v[2] + other.v[2]);
	}
	,subtract: function(other) {
		return new Cube(this.v[0] - other.v[0],this.v[1] - other.v[1],this.v[2] - other.v[2]);
	}
	,rotateLeft: function() {
		return new Cube(-this.v[1],-this.v[2],-this.v[0]);
	}
	,rotateRight: function() {
		return new Cube(-this.v[2],-this.v[0],-this.v[1]);
	}
	,length: function() {
		var len = 0.0;
		var _g = 0;
		while(_g < 3) {
			var i = _g++;
			if(Math.abs(this.v[i]) > len) len = Math.abs(this.v[i]);
		}
		return len;
	}
	,round: function() {
		var r = [];
		var sum = 0;
		var _g = 0;
		while(_g < 3) {
			var i = _g++;
			r[i] = Math.round(this.v[i]);
			sum += r[i];
		}
		if(sum != 0) {
			var e = [];
			var worst_i = 0;
			var _g1 = 0;
			while(_g1 < 3) {
				var i1 = _g1++;
				e[i1] = Math.abs(r[i1] - this.v[i1]);
				if(e[i1] > e[worst_i]) worst_i = i1;
			}
			r[worst_i] = -sum + r[worst_i];
		}
		return new Cube(r[0],r[1],r[2]);
	}
};
var Grid = $hx_exports.Grid = function(scale,orientation,shape) {
	this.scale = scale;
	this.orientation = orientation;
	this.hexes = shape;
};
Grid.boundsOfPoints = function(points) {
	var minX = 0.0;
	var minY = 0.0;
	var maxX = 0.0;
	var maxY = 0.0;
	var _g = 0;
	while(_g < points.length) {
		var p = points[_g];
		++_g;
		if(p.x < minX) minX = p.x;
		if(p.x > maxX) maxX = p.x;
		if(p.y < minY) minY = p.y;
		if(p.y > maxY) maxY = p.y;
	}
	return { minX : minX, maxX : maxX, minY : minY, maxY : maxY};
};
Grid.twoAxisToCube = function(hex) {
	return new Cube(hex.q,-hex.r - hex.q,hex.r);
};
Grid.cubeToTwoAxis = function(cube) {
	return new Hex(cube.v[0] | 0,cube.v[2] | 0);
};
Grid.oddQToCube = function(hex) {
	var x = hex.q;
	var z = hex.r - (hex.q - (hex.q & 1) >> 1);
	return new Cube(x,-x - z,z);
};
Grid.cubeToOddQ = function(cube) {
	var x = cube.v[0] | 0;
	var z = cube.v[2] | 0;
	return new Hex(x,z + (x - (x & 1) >> 1));
};
Grid.evenQToCube = function(hex) {
	var x = hex.q;
	var z = hex.r - (hex.q + (hex.q & 1) >> 1);
	return new Cube(x,-x - z,z);
};
Grid.cubeToEvenQ = function(cube) {
	var x = cube.v[0] | 0;
	var z = cube.v[2] | 0;
	return new Hex(x,z + (x + (x & 1) >> 1));
};
Grid.oddRToCube = function(hex) {
	var z = hex.r;
	var x = hex.q - (hex.r - (hex.r & 1) >> 1);
	return new Cube(x,-x - z,z);
};
Grid.cubeToOddR = function(cube) {
	var x = cube.v[0] | 0;
	var z = cube.v[2] | 0;
	return new Hex(x + (z - (z & 1) >> 1),z);
};
Grid.evenRToCube = function(hex) {
	var z = hex.r;
	var x = hex.q - (hex.r + (hex.r & 1) >> 1);
	return new Cube(x,-x - z,z);
};
Grid.cubeToEvenR = function(cube) {
	var x = cube.v[0] | 0;
	var z = cube.v[2] | 0;
	return new Hex(x + (z + (z & 1) >> 1),z);
};
Grid.trapezoidalShape = function(minQ,maxQ,minR,maxR,toCube) {
	var hexes = [];
	var _g1 = minQ;
	var _g = maxQ + 1;
	while(_g1 < _g) {
		var q = _g1++;
		var _g3 = minR;
		var _g2 = maxR + 1;
		while(_g3 < _g2) {
			var r = _g3++;
			hexes.push(toCube(new Hex(q,r)));
		}
	}
	return hexes;
};
Grid.triangularShape = function(size) {
	var hexes = [];
	var _g1 = 0;
	var _g = size + 1;
	while(_g1 < _g) {
		var k = _g1++;
		var _g3 = 0;
		var _g2 = k + 1;
		while(_g3 < _g2) {
			var i = _g3++;
			hexes.push(new Cube(i,-k,k - i));
		}
	}
	return hexes;
};
Grid.hexagonalShape = function(size) {
	var hexes = [];
	var _g1 = -size;
	var _g = size + 1;
	while(_g1 < _g) {
		var x = _g1++;
		var _g3 = -size;
		var _g2 = size + 1;
		while(_g3 < _g2) {
			var y = _g3++;
			var z = -x - y;
			if(Math.abs(x) <= size && Math.abs(y) <= size && Math.abs(z) <= size) hexes.push(new Cube(x,y,z));
		}
	}
	return hexes;
};
Grid.prototype = {
	hexToCenter: function(cube) {
		var s;
		var size = this.scale / 2;
		if(this.orientation) s = new ScreenCoordinate(Math.sqrt(3) * cube.v[0] + Math.sqrt(3) / 2 * cube.v[2],1.5 * cube.v[2]); else s = new ScreenCoordinate(1.5 * cube.v[0],Math.sqrt(3) / 2 * cube.v[0] + Math.sqrt(3) * cube.v[2]);
		return s.scale(size);
	}
	,cartesianToHex: function(p) {
		var size = this.scale / 2;
		p = p.scale(1 / size);
		if(this.orientation) {
			var q = Math.sqrt(3) / 3 * p.x + -0.333333333333333315 * p.y;
			var r = 0.66666666666666663 * p.y;
			return new Cube(q,-q - r,r);
		} else {
			var q1 = 0.66666666666666663 * p.x;
			var r1 = -0.333333333333333315 * p.x + Math.sqrt(3) / 3 * p.y;
			return new Cube(q1,-q1 - r1,r1);
		}
	}
	,bounds: function() {
		var _g = this;
		var centers = Lambda.array(this.hexes.map(function(hex) {
			return _g.hexToCenter(hex);
		}));
		var b1 = Grid.boundsOfPoints(this.polygonVertices());
		var b2 = Grid.boundsOfPoints(centers);
		return { minX : b1.minX + b2.minX, maxX : b1.maxX + b2.maxX, minY : b1.minY + b2.minY, maxY : b1.maxY + b2.maxY};
	}
	,polygonVertices: function() {
		var points = [];
		var _g = 0;
		while(_g < 6) {
			var i = _g++;
			var angle;
			angle = 2 * Math.PI * (2 * i - (this.orientation?3:0)) / 12;
			points.push(new ScreenCoordinate(0.5 * this.scale * Math.cos(angle),0.5 * this.scale * Math.sin(angle)));
		}
		return points;
	}
};
var Hex = $hx_exports.Hex = function(q,r) {
	this.q = q;
	this.r = r;
};
Hex.prototype = {
	toString: function() {
		return this.q + ":" + this.r;
	}
};
var HxOverrides = function() { };
HxOverrides.iter = function(a) {
	return { cur : 0, arr : a, hasNext : function() {
		return this.cur < this.arr.length;
	}, next : function() {
		return this.arr[this.cur++];
	}};
};
var Lambda = function() { };
Lambda.array = function(it) {
	var a = [];
	var $it0 = $iterator(it)();
	while( $it0.hasNext() ) {
		var i = $it0.next();
		a.push(i);
	}
	return a;
};
var ScreenCoordinate = $hx_exports.ScreenCoordinate = function(x,y) {
	this.x = x;
	this.y = y;
};
ScreenCoordinate.prototype = {
	equals: function(p) {
		return this.x == p.x && this.y == p.y;
	}
	,toString: function() {
		return this.x + "," + this.y;
	}
	,length_squared: function() {
		return this.x * this.x + this.y * this.y;
	}
	,length: function() {
		return Math.sqrt(this.length_squared());
	}
	,normalize: function() {
		var d = this.length();
		return new ScreenCoordinate(this.x / d,this.y / d);
	}
	,scale: function(d) {
		return new ScreenCoordinate(this.x * d,this.y * d);
	}
	,rotateLeft: function() {
		return new ScreenCoordinate(this.y,-this.x);
	}
	,rotateRight: function() {
		return new ScreenCoordinate(-this.y,this.x);
	}
	,add: function(p) {
		return new ScreenCoordinate(this.x + p.x,this.y + p.y);
	}
	,subtract: function(p) {
		return new ScreenCoordinate(this.x - p.x,this.y - p.y);
	}
	,dot: function(p) {
		return this.x * p.x + this.y * p.y;
	}
	,cross: function(p) {
		return this.x * p.y - this.y * p.x;
	}
	,distance: function(p) {
		return this.subtract(p).length();
	}
};
var Std = function() { };
Std["int"] = function(x) {
	return x | 0;
};
function $iterator(o) { if( o instanceof Array ) return function() { return HxOverrides.iter(o); }; return typeof(o.iterator) == 'function' ? $bind(o,o.iterator) : o.iterator; }
var $_, $fid = 0;
function $bind(o,m) { if( m == null ) return null; if( m.__id__ == null ) m.__id__ = $fid++; var f; if( o.hx__closures__ == null ) o.hx__closures__ = {}; else f = o.hx__closures__[m.__id__]; if( f == null ) { f = function(){ return f.method.apply(f.scope, arguments); }; f.scope = o; f.method = m; o.hx__closures__[m.__id__] = f; } return f; }
if(Array.prototype.map == null) Array.prototype.map = function(f) {
	var a = [];
	var _g1 = 0;
	var _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		a[i] = f(this[i]);
	}
	return a;
};
Cube._directions = [[1,-1,0],[1,0,-1],[0,1,-1],[-1,1,0],[-1,0,1],[0,-1,1]];
Grid.SQRT_3_2 = Math.sqrt(3) / 2;
})(typeof console != "undefined" ? console : {log:function(){}}, typeof window != "undefined" ? window : exports);
