/*
*
* iPED Toolkit Overlays
* (c) 2014 Morin Ostkamp, Institute for Geoinformatics (ifgi)
*
*/

function ChromaKey() {
  this.drawDelegate = window.draw.bind(this);
  this.drawDelegate();
}

function draw(){
	requestAnimationFrame(this.drawDelegate);
	this.draw();
}

ChromaKey.prototype.draw = function() {
  if ($('.remote video')[0]) {
    // Maybe there is no remote video yet.
    this.drawVideoOnCanvas();  
  }
};

ChromaKey.prototype.drawVideoOnCanvas = function() {
  // See: http://tech.pro/tutorial/1281/chroma-key-video-effects-using-javascript-and-the-html5-canvas-element
  var selectedR = 10;
  var selectedG = 245
  var selectedB = 10;
  
  var sourceVideo = $('.remote video')[0];
  var width = $('.remote video').width();
  var height = $('.remote video').height();
  
  var displayCanvas = $('#chroma-key-canvas')[0];
      displayCanvas.setAttribute('width', width);
      displayCanvas.setAttribute('height', height);
  var displayContext = displayCanvas.getContext('2d');
  
  var hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.setAttribute('width', width);
      hiddenCanvas.setAttribute('height', height);
  var hiddenContext = hiddenCanvas.getContext('2d');
      hiddenContext.drawImage(sourceVideo, 0, 0, width, height);
  
  if (!displayContext || !hiddenContext) {
    return;
  }
  
  var frame = hiddenContext.getImageData(0, 0, width, height);
  var length = frame.data.length;
  
  for (var i = 0; i < length; i++) {
    var r = frame.data [i * 4 + 0];
    var g = frame.data [i * 4 + 1];
    var b = frame.data [i * 4 + 2];

    if (r <= selectedR && b <= selectedB && g >= selectedG) {
      frame.data[i * 4 + 3] = 0; 
    } 
  }
  displayContext.putImageData(frame, 0, 0);
  
  /*
  // See: http://www.xindustry.com/html5greenscreen/
  var object = $('.remote video')[0];
  var width = $('.remote video').width();
  var height = $('.remote video').height();
  var canvas = $('#chroma-key-canvas')[0];
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  if (canvas.getContext) {
    var context = canvas.getContext('2d');
    var imgBackgroundData = context.getImageData(0, 0, width, height);
    context.drawImage(object, 0, 0, width, height);
    imgDataNormal = context.getImageData(0, 0, width, height);
    var imgData = context.createImageData(width, height);

    for (i = 0; i < imgData.width * imgData.height * 4; i += 4) {
      var r = imgDataNormal.data[i + 0];
      var g = imgDataNormal.data[i + 1];
      var b = imgDataNormal.data[i + 2];
      var a = imgDataNormal.data[i + 3];
      // compare rgb levels for green and set alphachannel to 0;
      selectedR = 10;
      selectedG = 245
      selectedB = 10;
      if (r <= selectedR && b <= selectedB && g >= selectedG) {
        a = 0;
      }
      if (a != 0) {
        imgData.data[i + 0] = r;
        imgData.data[i + 1] = g;
        imgData.data[i + 2] = b;
        imgData.data[i + 3] = a;
      }
    }

    for (var y = 0; y < imgData.height; y++) {
      for (var x = 0; x < imgData.width; x++) {
        var r = imgData.data[((imgData.width * y) + x) * 4];
        var g = imgData.data[((imgData.width * y) + x) * 4 + 1];
        var b = imgData.data[((imgData.width * y) + x) * 4 + 2];
        var a = imgData.data[((imgData.width * y) + x) * 4 + 3];
        if (imgData.data[((imgData.width * y) + x) * 4 + 3] != 0) {
          offsetYup = y - 1;
          offsetYdown = y + 1;
          offsetXleft = x - 1;
          offsetxRight = x + 1;
          var change=false;
          if(offsetYup>0)
          {
            if(imgData.data[((imgData.width * (y-1) ) + (x)) * 4 + 3] == 0)
            {
              change=true;
            }
          }
          if (offsetYdown < imgData.height)
          {
            if (imgData.data[((imgData.width * (y + 1)) + (x)) * 4 + 3] == 0) {
              change = true;
            }
          }
          if (offsetXleft > -1) {
            if (imgData.data[((imgData.width * y) + (x -1)) * 4 + 3] == 0) {
              change = true;
            }
          }
          if (offsetxRight < imgData.width) {
            if (imgData.data[((imgData.width * y) + (x + 1)) * 4 + 3] == 0) {
              change = true;
            }
          }
          if (change) {
            var gray = (imgData.data[((imgData.width * y) + x) * 4 + 0] * .393) + (imgData.data[((imgData.width * y) + x) * 4 + 1] * .769) + (imgData.data[((imgData.width * y) + x) * 4 + 2] * .189);                                
            imgData.data[((imgData.width * y) + x) * 4] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4] *0.9);
            imgData.data[((imgData.width * y) + x) * 4 + 1] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4 + 1]*0.9);
            imgData.data[((imgData.width * y) + x) * 4 + 2] = (gray * 0.2) + (imgBackgroundData.data[((imgData.width * y) + x) * 4 + 2] * 0.9);
            imgData.data[((imgData.width * y) + x) * 4 + 3] = 255;
          }
        }         
      }
    }

    for (i = 0; i < imgData.width * imgData.height * 4; i += 4) {
      var r = imgData.data[i + 0];
      var g = imgData.data[i + 1];
      var b = imgData.data[i + 2];
      var a = imgData.data[i + 3];                
      if (a == 0) {
        imgData.data[i + 0] = imgBackgroundData.data[i + 0];
        imgData.data[i + 1] = imgBackgroundData.data[i + 1];
        imgData.data[i + 2] = imgBackgroundData.data[i + 2];
        imgData.data[i + 3] = imgBackgroundData.data[i + 3];
      }                   
    }
    context.putImageData(imgData, 0, 0);       
  }
  */
};

new ChromaKey();