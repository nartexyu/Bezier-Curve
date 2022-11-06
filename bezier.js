// Global variables
const canvasID = 'canvas' 
const clearButtonID = 'clear-button' 
const clearButton = document.getElementById(clearButtonID) 
const canvas = document.getElementById(canvasID) 
canvas.width = window.innerWidth 
canvas.height = window.innerHeight 

//  Class for drawing the control points for the bezier curve
class Square {
  constructor(x, y) {
    this.x = x 
    this.y = y 
    this.height = 10 
    this.width = 10
    this.color = '#5A5A5A' 
  }
  
  // Draws a square
  draw(ctx) {
    const x = this.x - this.width / 2 
    const y = this.y - this.height / 2 
    ctx.fillStyle = this.color 
    ctx.fillRect(x, y, this.width, this.height) 
  } 
  
  // Checks if the object is selected
  select(x, y) {
    const checkX = x < this.x + this.width / 2 && x > this.x - this.width / 2 
    const checkY = y < this.y + this.height / 2 && y > this.y - this.height / 2 
    return checkX && checkY 
  }
}
 
// Class for drawing the interpolation points which make up the bezier curve
class Circle {
  constructor(x, y, radius = 2) {
    this.x = x 
    this.y = y 
    this.radius = radius 
    this.color = '#000000' 
  }

  // Draws a circle
  draw(ctx) {
    ctx.beginPath() 
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false) 
    ctx.fillStyle = this.color 
    ctx.fill() 
  }
}
 
// Class for drawing the curve
class Curve {
  constructor(beginPoint, controlPoints, endPoint) {
    this.beginPoint = beginPoint 
    this.endPoint = endPoint 
    this.controlPoints = controlPoints 
    this.color = '#000000' 
    this.points = [] 
  }

  // Draws the control points
  drawControlPoints(ctx) {
    this.beginPoint.draw(ctx) 
    this.controlPoints.forEach(controlPoint => controlPoint.draw(ctx)) 
    this.endPoint.draw(ctx) 
  }

  // Checks what kind of point is being selected
  selectPoints(x, y) {
    if (this.beginPoint.select(x, y)) {
      return this.beginPoint 
    }
    const selectControlPoint = this.controlPoints.filter(controlPoint => controlPoint.select(x, y)) 
    if (selectControlPoint.length) {
      return selectControlPoint[0] 
    }
    if (this.endPoint.select(x, y)) {
      return this.endPoint 
    }
    return null 
  }
  
  // Creates interpolation points and pushes it into an array for it to be drawn
  createPoints() {
    this.points = [] 
    for (let i = 0; i < 1; i += 0.001) {
      const x = (1 - i) ** 3 * this.beginPoint.x +
        3 * (1 - i) ** 2 * i * this.controlPoints[0].x +
        3 * (1 - i) * i ** 2 * this.controlPoints[1].x +
        i ** 3 * this.endPoint.x 

      const y = (1 - i) ** 3 * this.beginPoint.y +
        3 * (1 - i) ** 2 * i * this.controlPoints[0].y +
        3 * (1 - i) * i ** 2 * this.controlPoints[1].y +
        i ** 3 * this.endPoint.y 

      this.points.push(new Circle(x, y, 2)) 
    }
  }
  
  // Draws all the interpolation points to form a
  drawCurve(ctx) {
    this.createPoints() 
    this.points.forEach(point => point.draw(ctx)) 
  }
}
 
// Class for the entire drawing of all the curves and points
class Draw {
  constructor(canvas, clearButton) {
    this.canvas = canvas 
    this.clearButton = clearButton 
    this.ctx = this.canvas.getContext('2d') 
    this.curves = [] 
    this.drawPoints = [] 
    this.movePoint = null 
    this.movedPoint = false 

    // Clears the canvas if the clear button is clicked
  if (this.clearButton) this.clearButton.addEventListener('click', () => {
    this.clearCanvas() 
    this.curves = [] 
    this.drawPoints = [] 
  }) 

  // Document event listeners
  this.canvas.addEventListener('mousedown', (event) => this.onMouseDownEvent(event)) 
  this.canvas.addEventListener('mousemove', (event) => this.onMouseMoveEvent(event)) 
  this.canvas.addEventListener('mouseup', (event) => this.onMouseUpEvent(event)) 
  this.canvas.addEventListener('click', (event) => this.onMouseClickEvent(event)) 
  }

  // Mouse down events. Checks if point where mouse is pressed down is an existing point. If not, it creates a new point
  onMouseDownEvent(event) {
    const { x, y } = this.getEventCoordinates(event) 
   
    const selectdrawPoints = this.drawPoints.filter((point) => point.select(x, y)) 
    const selectCurvePoints = this.curves.map(curve => {
      const selectPoint = curve.selectPoints(x, y) 
      if (selectPoint) {
        return { curve, selectPoint } 
      }
      return null 
    }).filter(i => i) 

    if (selectCurvePoints.length) {
      this.movePoint = selectCurvePoints[0].selectPoint 
    } else if (selectdrawPoints.length) {
      this.movePoint = selectdrawPoints[0] 
    } else {
      this.createDrawingPoint(x, y) 
    }
  }

  // Gets event coordinates on mouse click
  onMouseClickEvent(event) {
    const { x, y } = this.getEventCoordinates(event) 
    this.draw() 
  }

  // Mouse move events. If the point is being moved, gets the new coordinates of where point was moved to and redraws everything
  onMouseMoveEvent(event) {
    if (this.movePoint) {
      this.pointBeingMoved = true 
      const { x, y } = this.getEventCoordinates(event) 
      this.movePoint.x = x 
      this.movePoint.y = y 
      this.draw() 
    }
  }

  // Mouse up events. If there are 4 points drawn, draw a new curve
  onMouseUpEvent(event) {
    if (this.movePoint) {
      this.movePoint = null 
      this.pointBeingMoved = false 
    }

    if (this.drawPoints.length === 4) {
      const controlPoints = this.drawPoints.splice(1, this.drawPoints.length - 2) 
      const curve = new Curve(
        this.drawPoints[0],
        controlPoints,
        this.drawPoints[this.drawPoints.length - 1],
        this.color,
      ) 

      this.curves.push(curve) 
      this.drawPoints = [] 
      this.draw() 
    } 
  }
  
  // Adds control points to the array and draws a square for each
  createDrawingPoint(x, y) {
    this.drawPoints.push(new Square(x, y)) 
    this.draw() 
  }

  // Returns the x y coordinates
  getEventCoordinates(event) {
    return {
      x: event.pageX - this.canvas.offsetLeft,
      y: event.pageY - this.canvas.offsetTop,
    }
  }

  // Draws all the curves and control points
  draw() {
    this.clearCanvas() 
    this.drawPoints.forEach(point => point.draw(this.ctx)) 
    this.curves.forEach(curve => {
      curve.drawControlPoints(this.ctx) 
      curve.drawCurve(this.ctx) 
    }) 
  }

  // Clears the canvas
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height) 
  }
}
  
let drawing = new Draw(canvas, clearButton) 