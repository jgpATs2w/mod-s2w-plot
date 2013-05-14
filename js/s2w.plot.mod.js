/**
	 * input: x,y <- coordinates over window. Need to be transformed previously
	 * 			plot <- s2wPlot object where is called from
	 */
	function _Point(x,y){
			this.dateX = x; this.valueY = y;
			s2w.Plot._readMaxMinY(y);
			s2w.Plot._readMaxMinDate(x);
	}
	_Point.prototype.draw = function(context,fillColor){
			this.x = this.transformX(this.dateX); 
			this.y = this.transformY(this.valueY);
			context.fillStyle = fillColor; 
			context.fillRect(this.x,this.y-10,10,10);
			context.fill()
	};
	_Point.prototype.transformX = function (x){
		z = Math.abs(s2w.Plot.Awx-s2w.Plot.Owx)/s2w.Plot._timediff(s2w.Plot.Ad,s2w.Plot.Od);
		return s2w.Plot.Owx + s2w.Plot._timediff(x,s2w.Plot.Od)*z;
	}
	_Point.prototype.transformY = function (y){
		w = Math.abs(y) * Math.abs(s2w.Plot.Bwy-s2w.Plot.Owy);
		return s2w.Plot.Owy - w/s2w.Plot.By;
	}
	function _Path(name, color){
		this.name = name;
		this.fillColor = color;
		this.Points = [];
		this.updateChecked();
	}
	_Path.prototype.updateChecked = function(){
		input = document.getElementById('input_path_'+this.name);
		this.checked = (input == null)? true : input.checked;
	}
	_Path.prototype.addPoint = function(x,y){
			this.Points.push(new _Point(x,y));
		}
	_Path.prototype.drawPoints = function(){
			if(!this.checked) return;
			for(i=0; i<this.Points.length; i++){
				this.Points[i].draw(context,this.fillColor);
			}
		}
	function _AbsciseMark(x){
		this.x = s2w.Plot._transformX(x);
		this.tick = x;
	}
	_AbsciseMark.prototype.draw = function(context,color){
				context.fillStyle = color;
				context.textBaseline = "top";
				context.fillRect(this.x,s2w.Plot.Owy,1,3);
				context.fillText(this.tick, this.x, s2w.Plot.Owy+s2w.Plot.MARGIN_ABSCISE_FONT);
				context.fill()
			}
	function _OrdinateMark(y, plot){
		this.y = s2w.Plot._transformY(y);
		this.tick = y;
	}
	_OrdinateMark.prototype.draw = function(context, color){
			context.fillStyle = color; context.textAlign = "end";
			context.fillRect(s2w.Plot.Owx, this.y,3,1);
			context.fillText(this.tick,s2w.Plot.Owx-s2w.Plot.MARGIN_ORDINATE_FONT, this.y);
		}
function S2WPlot(canvasId){
	this.XSCALE = 0.8; this.YSCALE = 0.8; this.FONTSCALE = 0.1; this.POINTSCALE = 0.01; this.SCALE_Y_AXIS = 1.2;
	this.MARGIN_SIDES= 50; this.MARGIN_TOP= 20; this.MARGIN_ABSCISE_FONT = 5; this.MARGIN_ORDINATE_FONT = 2;
	this.BACKCOLOR = "#000"; this.COLOR_ABSCISE_TEXT = "#000"; this.COLOR_ORDINATES = "#000";
	this.DEFAULT_MIN_DATE = '2015-01-01'; this.DEFAULT_MAX_DATE = '1980-01-01';
	this.DEFAULT_MAX_VALUE = 500;
	
	if(canvasId) this.canvas = document.getElementById(canvasId);
	
	else if ((this.canvas = document.getElementById('s2w_plot_canvas')) == null){
		new Error('Canvas div not found. Nothing to do');
		return;
	}
	this.Paths = {};
	
	this._rand = function (){
		num = Math.random()*255;
		return num.toFixed(0);}
	this._randomColor = function (){
		colorstr = "rgb("+this._rand()+","+this._rand()+","+this._rand()+")";
		
		return colorstr;
	}
	this.MAX_Y = 0; this.MIN_Y=0;
	this._readMaxMinY = function (y){
		if(y>this.MAX_Y) this.MAX_Y = this.SCALE_Y_AXIS * y;
		if(y<this.MIN_Y) this.MIN_Y = y;
	}
	this.MAX_DATE = this.DEFAULT_MAX_DATE; this.MIN_DATE = this.DEFAULT_MIN_DATE;
	this._readMaxMinDate = function (d){//huerfana!!
		if(new Date(this.MIN_DATE).getTime() > new Date(d).getTime()) this.MIN_DATE = d;
		if(new Date(this.MAX_DATE).getTime() < new Date(d).getTime()) this.MAX_DATE = d;
	}
	this._drawOrdinates = function (){
		step = Math.pow(10, Math.floor(Math.LOG10E * Math.log(this.MAX_Y - this.MIN_Y))); 
		if(step < 10) step = 10;
		y = (this.MIN_Y < 0)? 0: this.MIN_Y;
		do{
			new _OrdinateMark(y).draw(context,this.COLOR_ORDINATES);
			y+=step;
		}while(y<this.MAX_Y)
		
	}
	this._date2string = function(d){
			y = d.getFullYear(); m = d.getMonth()+1; if(m<10) m= "0"+m
			
			return y+"-"+m+"-01";
	}
	this._drawAbscises = function (){
		
		
		toDate = new Date(this.MAX_DATE); fromDate = new Date(this.MIN_DATE);
		xDate = fromDate;
		
		do{
			x = this._date2string(xDate);
			new _AbsciseMark(x).draw(context,this.COLOR_ORDINATES);
			
			xDate = new Date(xDate.getFullYear(),xDate.getMonth()+1,1);
			
		}while(xDate.getTime() < toDate.getTime());
		
	}
	/**
	 * input: d1, d2 <- strings of date as '2012-03-01'
	 * output: difference (in msec) between dates 
	 */
	this._timediff = function (d1, d2){
		r = Math.abs((new Date(d1).getTime() - new Date(d2).getTime()));
		return r;
	}
	this._scaleCanvas = function(){
		this.canvas.width = this.XSCALE * window.innerWidth;
		this.canvas.height = this.YSCALE * window.innerHeight;
		this.Awx = this.canvas.width - this.MARGIN_SIDES;
		this.Owx = this.MARGIN_SIDES;
		this.Bwy = this.MARGIN_TOP;
		this.Owy = this.canvas.height - this.MARGIN_TOP;
		this.Od = this.MIN_DATE; this.Ad = this.MAX_DATE;
		this.By = this.MAX_Y;
	}
	/**
	 * input: 	vd <- date of v in string format i.e. '2012-03-01'
	 * 			vv <- value of v in real, euro units
	 */
	this._transformX = function (x){
		z = Math.abs(s2w.Plot.Awx-s2w.Plot.Owx)/s2w.Plot._timediff(s2w.Plot.Ad,s2w.Plot.Od);
		return s2w.Plot.Owx + s2w.Plot._timediff(x,s2w.Plot.Od)*z;
		
		return (this.Owx + 
			this._timediff(x,this.Od)*Math.abs(this.Awx-this.Owx)/
			this._timediff(this.Ad,this.Od));
	}
	this._transformY = function (y){
		return this.Owy - y * Math.abs(this.Bwy-this.Owy)/this.By;
	}
	this._getContext = function(){
		context = this.canvas.getContext("2d");
		context.strokeStyle = this.BACKCOLOR;
		return context;
	}
	this._drawAxis = function(){
		this.context.moveTo(this.Owx,this.Owy); context.lineTo(this.Owx,this.Bwy);
		this.context.moveTo(this.Owx,this.Owy); context.lineTo(this.Awx,this.Owy);
	
		this.context.stroke();
	}
	/**
	 * @param 
	 */
	this.setData = function(XColumn, YColumns){
		//this.Data = eval((data));
		if(typeof XColumn != "string"){ new Error('first parameter shoud be a string'); return}
		//if(typeof YColumns != "array"){ new Error('second parameter shoud be an array'); return}
		this.Data = s2w.Matrix.get();
		this._xcolumn = XColumn;
		this._ycolumns = YColumns;
		
		this._importData();
	}
	this._importData = function (){
		if(this.Data.length > 0){
			for(i = 0; i<this.Data.length; i++){
				que = this.Data[i]['que'];
				if(!(que in this.Paths)){
					this.Paths[que] = new _Path(que, this._randomColor());
				}
				this.Paths[que].addPoint(this.Data[i]['cuando'], Math.abs(this.Data[i]['cuanto']));
			}
		
		}else
			new Error('s2wPlot.importData#unknown or empty data');	
		
	}
	this._drawPaths = function(){
		for(path in this.Paths){
			this.Paths[path].updateChecked();
			this.Paths[path].drawPoints();
		}
	}
	this.LegendLoaded = false;
	this._drawLegend = function(){
		div = document.getElementById('s2w_plot_legend');
		if(div == null){new Error('no div found. Legend can not be drawn')}
		s = "";
		for(i in this.Paths){
			s += "<input id='input_path_"+i+"' checked='"+this.Paths[i].checked
							+"' type='checkbox' onchange='s2w.Plot.plot()'/> <label style='color: "+this.Paths[i].fillColor
							+"'>"+this.Paths[i].name+"</label><br>";
		}
		div.innerHTML = s;
		this.LegendLoaded = true;
	}
	this.plot = function(){
		if(this.Data == null){
			new Error('Data must be set first. Nothing to do.');
			return;
		} 
		
		this.context = this._getContext();
		this._scaleCanvas();
		this.context.fillStyle = this.COLOR_ABSCISE_TEXT;
		this.context.textBaseline = "top";
		this._drawAxis();
		this._drawAbscises();
		this._drawOrdinates();
		
		this._drawPaths();
		
		if(!this.LegendLoaded) this._drawLegend();
		
	}
}

window.addEventListener('resize', function(){s2w.Plot.plot();});
