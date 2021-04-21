(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? factory(exports)
    : typeof define === "function" && define.amd
    ? define(["exports"], factory)
    : ((global = global || self), factory((global.CanvasFreeDrawing = {})));
})(this, function (exports) {
  "use strict";

  var commonjsGlobal =
    typeof globalThis !== "undefined"
      ? globalThis
      : typeof window !== "undefined"
      ? window
      : typeof global !== "undefined"
      ? global
      : typeof self !== "undefined"
      ? self
      : {};

  function unwrapExports(x) {
    return x &&
      x.__esModule &&
      Object.prototype.hasOwnProperty.call(x, "default")
      ? x["default"]
      : x;
  }

  function createCommonjsModule(fn, module) {
    return (
      (module = { exports: {} }), fn(module, module.exports), module.exports
    );
  }

  var dist = createCommonjsModule(function (module, exports) {
    var __spreadArrays =
      (commonjsGlobal && commonjsGlobal.__spreadArrays) ||
      function () {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
          s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
          for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
        return r;
      };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AllowedEvents = void 0;
    var AllowedEvents;
    (function (AllowedEvents) {
      AllowedEvents["redraw"] = "redraw";
      AllowedEvents["fill"] = "fill";
      AllowedEvents["mouseup"] = "mouseup";
      AllowedEvents["mousedown"] = "mousedown";
      AllowedEvents["mouseenter"] = "mouseenter";
      AllowedEvents["mouseleave"] = "mouseleave";
    })((AllowedEvents = exports.AllowedEvents || (exports.AllowedEvents = {})));
    var CanvasFreeDrawing = /** @class */ (function () {
      function CanvasFreeDrawing(params) {
        var elementId = params.elementId,
          width = params.width,
          height = params.height,
          _a = params.backgroundColor,
          backgroundColor = _a === void 0 ? [255, 255, 255] : _a,
          _b = params.lineWidth,
          lineWidth = _b === void 0 ? 3 : _b,
          _c = params.strokeColor,
          strokeColor = _c === void 0 ? [0, 0, 0] : _c,
          disabled = params.disabled,
          _d = params.showWarnings,
          showWarnings = _d === void 0 ? false : _d,
          _e = params.maxSnapshots,
          maxSnapshots = _e === void 0 ? 20 : _e;
        this.requiredParam(params, "elementId");
        this.requiredParam(params, "width");
        this.requiredParam(params, "height");
        this.elementId = elementId;
        this.canvasNode = document.getElementById(this.elementId);
        if (this.canvasNode instanceof HTMLCanvasElement) {
          this.canvas = this.canvasNode;
        } else if (this.canvasNode instanceof HTMLElement) {
          var newCanvas = document.createElement("canvas");
          this.canvasNode.appendChild(newCanvas);
          this.canvas = newCanvas;
        } else {
          throw new Error(
            "No element found with following id: " + this.elementId
          );
        }
        this.context = this.canvas.getContext("2d");
        this.width = width;
        this.height = height;
        this.maxSnapshots = maxSnapshots;
        this.snapshots = [];
        this.undos = [];
        this.positions = [];
        this.leftCanvasDrawing = false; // to check if user left the canvas drawing, on mouseover resume drawing
        this.isDrawing = false;
        this.isDrawingModeEnabled = true;
        this.imageRestored = false;
        this.lineWidth = lineWidth;
        this.strokeColor = this.toValidColor(strokeColor);
        this.listenersList = [
          "mouseDown",
          "mouseMove",
          "mouseLeave",
          "mouseUp",
          "touchStart",
          "touchMove",
          "touchEnd",
        ];
        this.allowedEvents = this.getAllowedEvents();
        this.redrawCounter = 0;
        this.dispatchEventsOnceEvery = 0; // this may become something like: [{event, counter}]
        // initialize events
        this.events = {
          redrawEvent: new Event("cfd_redraw"),
          fillEvent: new Event("cfd_fill"),
          mouseUpEvent: new Event("cfd_mouseup"),
          mouseDownEvent: new Event("cfd_mousedown"),
          mouseEnterEvent: new Event("cfd_mouseenter"),
          mouseLeaveEvent: new Event("cfd_mouseleave"),
          touchStartEvent: new Event("cfd_touchstart"),
          touchEndEvent: new Event("cfd_touchend"),
        };
        this.bindings = {
          mouseDown: this.mouseDown.bind(this),
          mouseMove: this.mouseMove.bind(this),
          mouseLeave: this.mouseLeave.bind(this),
          mouseUp: this.mouseUp.bind(this),
          mouseUpDocument: this.mouseUpDocument.bind(this),
          touchStart: this.touchStart.bind(this),
          touchMove: this.touchMove.bind(this),
          touchEnd: this.touchEnd.bind(this),
        };
        this.touchIdentifier = undefined;
        this.previousX = undefined;
        this.previousY = undefined;
        this.showWarnings = showWarnings;
        // cache
        this.isNodeColorEqualCache = {};
        this.setDimensions();
        this.setBackground(backgroundColor);
        this.storeSnapshot();
        if (!disabled) this.enableDrawingMode();
      }
      CanvasFreeDrawing.prototype.requiredParam = function (object, param) {
        if (!object || !object[param]) {
          throw new Error(param + " is required");
        }
      };
      CanvasFreeDrawing.prototype.addListeners = function () {
        var _this = this;
        this.listenersList.forEach(function (event) {
          _this.canvas.addEventListener(
            event.toLowerCase(),
            _this.bindings[event]
          );
        });
        document.addEventListener("mouseup", this.bindings.mouseUpDocument);
      };
      CanvasFreeDrawing.prototype.removeListeners = function () {
        var _this = this;
        this.listenersList.forEach(function (event) {
          _this.canvas.removeEventListener(
            event.toLowerCase(),
            _this.bindings[event]
          );
        });
        document.removeEventListener("mouseup", this.bindings.mouseUpDocument);
      };
      CanvasFreeDrawing.prototype.getAllowedEvents = function () {
        var events = [];
        for (var event_1 in AllowedEvents) {
          events.push(event_1);
        }
        return events;
      };
      CanvasFreeDrawing.prototype.enableDrawingMode = function () {
        this.isDrawingModeEnabled = true;
        this.addListeners();
        this.toggleCursor();
        return this.isDrawingModeEnabled;
      };
      CanvasFreeDrawing.prototype.disableDrawingMode = function () {
        this.isDrawingModeEnabled = false;
        this.removeListeners();
        this.toggleCursor();
        return this.isDrawingModeEnabled;
      };
      CanvasFreeDrawing.prototype.mouseDown = function (event) {
        if (event.button !== 0) return;
        this.drawPoint(event.offsetX, event.offsetY);
      };
      CanvasFreeDrawing.prototype.mouseMove = function (event) {
        this.drawLine(event.offsetX, event.offsetY, event);
      };
      CanvasFreeDrawing.prototype.touchStart = function (event) {
        if (event.changedTouches.length > 0) {
          var _a = event.changedTouches[0],
            pageX = _a.pageX,
            pageY = _a.pageY,
            identifier = _a.identifier;
          var x = pageX - this.canvas.offsetLeft;
          var y = pageY - this.canvas.offsetTop;
          this.touchIdentifier = identifier;
          this.drawPoint(x, y);
        }
      };
      CanvasFreeDrawing.prototype.touchMove = function (event) {
        if (event.changedTouches.length > 0) {
          var _a = event.changedTouches[0],
            pageX = _a.pageX,
            pageY = _a.pageY,
            identifier = _a.identifier;
          var x = pageX - this.canvas.offsetLeft;
          var y = pageY - this.canvas.offsetTop;
          // check if is multi touch, if it is do nothing
          if (identifier != this.touchIdentifier) return;
          this.previousX = x;
          this.previousY = y;
          this.drawLine(x, y, event);
        }
      };
      CanvasFreeDrawing.prototype.touchEnd = function () {
        this.handleEndDrawing();
        this.canvas.dispatchEvent(this.events.touchEndEvent);
      };
      CanvasFreeDrawing.prototype.mouseUp = function () {
        this.handleEndDrawing();
        this.canvas.dispatchEvent(this.events.mouseUpEvent);
      };
      CanvasFreeDrawing.prototype.mouseUpDocument = function () {
        this.leftCanvasDrawing = false;
      };
      CanvasFreeDrawing.prototype.mouseLeave = function () {
        if (this.isDrawing) this.leftCanvasDrawing = true;
        this.isDrawing = false;
        this.canvas.dispatchEvent(this.events.mouseLeaveEvent);
      };
      CanvasFreeDrawing.prototype.mouseEnter = function () {
        this.canvas.dispatchEvent(this.events.mouseEnterEvent);
      };
      CanvasFreeDrawing.prototype.handleEndDrawing = function () {
        this.isDrawing = false;
        this.storeSnapshot();
      };
      CanvasFreeDrawing.prototype.drawPoint = function (x, y) {
        this.isDrawing = true;
        this.storeDrawing(x, y, false);
        this.canvas.dispatchEvent(this.events.mouseDownEvent);
        this.handleDrawing();
      };
      CanvasFreeDrawing.prototype.drawLine = function (x, y, event) {
        if (this.leftCanvasDrawing) {
          this.leftCanvasDrawing = false;
          if (event instanceof MouseEvent) {
            this.mouseDown(event);
          } else if (event instanceof TouchEvent) {
            this.touchEnd();
          }
        }
        if (this.isDrawing) {
          this.storeDrawing(x, y, true);
          this.handleDrawing(this.dispatchEventsOnceEvery);
        }
      };
      CanvasFreeDrawing.prototype.handleDrawing = function (
        dispatchEventsOnceEvery
      ) {
        var _this = this;
        this.context.lineJoin = "round";
        var positions = [__spreadArrays(this.positions).pop()];
        positions.forEach(function (position) {
          if (position && position[0] && position[0].strokeColor) {
            _this.context.strokeStyle = _this.rgbaFromArray(
              position[0].strokeColor
            );
            _this.context.lineWidth = position[0].lineWidth;
            _this.draw(position);
          }
        });
        if (!dispatchEventsOnceEvery) {
          this.canvas.dispatchEvent(this.events.redrawEvent);
        } else if (this.redrawCounter % dispatchEventsOnceEvery === 0) {
          this.canvas.dispatchEvent(this.events.redrawEvent);
        }
        this.undos = [];
        this.redrawCounter += 1;
      };
      // DRAW
      CanvasFreeDrawing.prototype.draw = function (position) {
        var _this = this;
        position.forEach(function (_a, i) {
          var x = _a.x,
            y = _a.y,
            moving = _a.moving;
          _this.context.beginPath();
          if (moving && i) {
            _this.context.moveTo(position[i - 1]["x"], position[i - 1]["y"]);
          } else {
            _this.context.moveTo(x - 1, y);
          }
          _this.context.lineTo(x, y);
          _this.context.closePath();
          _this.context.stroke();
        });
      };
      CanvasFreeDrawing.prototype.toValidColor = function (color) {
        if (Array.isArray(color) && color.length === 4) return color;
        if (Array.isArray(color) && color.length === 3) {
          var validColor = __spreadArrays(color);
          validColor.push(255);
          return validColor;
        } else {
          this.logWarning(
            "Color is not valid!\n" +
              "It must be an array with RGB values:  [0-255, 0-255, 0-255]"
          );
          return [0, 0, 0, 255];
        }
      };
      CanvasFreeDrawing.prototype.rgbaFromArray = function (a) {
        return "rgba(" + a[0] + "," + a[1] + "," + a[2] + "," + a[3] + ")";
      };
      CanvasFreeDrawing.prototype.setDimensions = function () {
        this.canvas.height = this.height;
        this.canvas.width = this.width;
      };
      CanvasFreeDrawing.prototype.toggleCursor = function () {
        this.canvas.style.cursor = this.isDrawingModeEnabled
          ? "crosshair"
          : "auto";
      };
      CanvasFreeDrawing.prototype.storeDrawing = function (x, y, moving) {
        if (moving) {
          var lastIndex = this.positions.length - 1;
          this.positions[lastIndex].push({
            x: x,
            y: y,
            moving: moving,
            lineWidth: this.lineWidth,
            strokeColor: this.strokeColor,
          });
        } else {
          this.positions.push([
            {
              x: x,
              y: y,
              moving: moving,
              lineWidth: this.lineWidth,
              strokeColor: this.strokeColor,
            },
          ]);
        }
      };
      CanvasFreeDrawing.prototype.storeSnapshot = function () {
        var imageData = this.getCanvasSnapshot();
        this.snapshots.push(imageData);
        if (this.snapshots.length > this.maxSnapshots) {
          this.snapshots = this.snapshots.splice(-Math.abs(this.maxSnapshots));
        }
      };
      CanvasFreeDrawing.prototype.getCanvasSnapshot = function () {
        return this.context.getImageData(0, 0, this.width, this.height);
      };
      CanvasFreeDrawing.prototype.restoreCanvasSnapshot = function (imageData) {
        this.context.putImageData(imageData, 0, 0);
      };
      // Public APIs
      CanvasFreeDrawing.prototype.on = function (params, callback) {
        var event = params.event,
          counter = params.counter;
        this.requiredParam(params, "event");
        if (this.allowedEvents.includes(event)) {
          if (event === "redraw" && counter && Number.isInteger(counter)) {
            this.dispatchEventsOnceEvery = counter;
          }
          this.canvas.addEventListener("cfd_" + event, function () {
            return callback();
          });
        } else {
          this.logWarning("This event is not allowed: " + event);
        }
      };
      CanvasFreeDrawing.prototype.setLineWidth = function (px) {
        this.lineWidth = px;
      };
      CanvasFreeDrawing.prototype.setBackground = function (color, save) {
        if (save === void 0) {
          save = true;
        }
        var validColor = this.toValidColor(color);
        if (validColor) {
          if (save) this.backgroundColor = validColor;
          this.context.fillStyle = this.rgbaFromArray(validColor);
          this.context.fillRect(0, 0, this.width, this.height);
        }
      };
      CanvasFreeDrawing.prototype.setDrawingColor = function (color) {
        this.setStrokeColor(color);
      };
      CanvasFreeDrawing.prototype.setStrokeColor = function (color) {
        this.strokeColor = this.toValidColor(color);
      };
      CanvasFreeDrawing.prototype.clear = function () {
        this.context.clearRect(0, 0, this.width, this.height);
        this.positions = [];
        this.imageRestored = false;
        if (this.backgroundColor) this.setBackground(this.backgroundColor);
        this.handleEndDrawing();
      };
      CanvasFreeDrawing.prototype.save = async function () {
        console.log(this.canvas.toDataURL());
        const result = await fetch("/api/eval", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dataURI: this.canvas.toDataURL() }),
        });
        const data = await result.json();
        print(data);
        document.getElementById(
          "results"
        ).innerHTML = `<p>Did you draw a ${data.prediction}?</p>`;
        return this.canvas.toDataURL();
      };
      // UNDO
      CanvasFreeDrawing.prototype.undo = function () {
        var lastSnapshot = this.snapshots[this.snapshots.length - 1];
        var goToSnapshot = this.snapshots[this.snapshots.length - 2];
        if (goToSnapshot) {
          this.restoreCanvasSnapshot(goToSnapshot);
          this.snapshots.pop();
          this.undos.push(lastSnapshot);
          this.undos = this.undos.splice(-Math.abs(this.maxSnapshots));
          this.imageRestored = true;
        } else {
          this.logWarning("There are no more undos left.");
        }
      };
      // REDO
      CanvasFreeDrawing.prototype.redo = function () {
        if (this.undos.length > 0) {
          var lastUndo = this.undos.pop();
          if (lastUndo) {
            this.restoreCanvasSnapshot(lastUndo);
            this.snapshots.push(lastUndo);
            this.snapshots = this.snapshots.splice(
              -Math.abs(this.maxSnapshots)
            );
          }
        } else {
          this.logWarning("There are no more redos left.");
        }
      };
      return CanvasFreeDrawing;
    })();
    exports.default = CanvasFreeDrawing;
  });

  var index = unwrapExports(dist);
  var dist_1 = dist.AllowedEvents;

  exports.AllowedEvents = dist_1;
  exports.default = index;

  Object.defineProperty(exports, "__esModule", { value: true });
});
