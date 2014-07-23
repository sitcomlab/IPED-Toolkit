/*!
* The iPED Toolkit
* webRTC chroma keying -- Renders green video background (0, 255, 0) transparent
*
* (c) 2014 Morin Ostkamp
* Institute for Geoinformatics (ifgi), University of Münster
*/

define(['underscorejs/js/underscore',
        'aop/js/meld'],
        
        function(Underscore, Meld) {
          function ChromaKeyPlugin(opts) {
            JL('iPED Toolkit.ChromaKeyPlugin').info('ChromaKeyPlugin loaded');
            
            // <Configuration>
            this.scale  = opts.scale || 4;
            this.fps    = opts.fps   || 1;
            // </Configuration>
            
            this.parent = opts.parent; // FIXME: Include type check, e.g., $.typeof(opts.parent) === 'overlayPlugin'
            this.isEnabled = true;
            this.lastTimestamp = 0;
  
            this.selectedR = 10;
            this.selectedG = 245
            this.selectedB = 10;
  
            this.sourceVideo = null;
            this.width = 0;
            this.height = 0;
            
            _.bindAll(this, 'onKeyDown', 'render');
            window.addEventListener('keydown', this.onKeyDown);
            Meld.after(this.parent, 'render', this.render);
          }
          
          ChromaKeyPlugin.prototype.onKeyDown = function(event) {
            //console.log(event.which);
            switch (event.keyCode) {
              case 75: // k
          			this.isEnabled = !this.isEnabled;
                JL('iPED Toolkit.ChromaKeyPlugin').info('Chroma Keying is now turned ' + (this.isEnabled?'on':'off')); 
                break;
            }
          };

          ChromaKeyPlugin.prototype.render = function() {
            if (this.sourceVideo || $('#iPED-Overlay iframe').contents().find('.remote video')[0]) {
              // Maybe there is no remote video yet.
              this.drawVideoOnCanvas();  
            }
          };

          ChromaKeyPlugin.prototype.drawVideoOnCanvas = function() {
            // See: http://tech.pro/tutorial/1281/chroma-key-video-effects-using-javascript-and-the-html5-canvas-element
  
            if (this.sourceVideo == null || this.sourceVideo.width() != this.width || this.sourceVideo.height() != this.height) {
              this.sourceVideo = $('#iPED-Overlay iframe').contents().find('.remote video');
              this.width = this.sourceVideo.width() / this.scale;
              this.height = this.sourceVideo.height() / this.scale;
  
              this.displayCanvas = $('#iPED-Overlay iframe').contents().find('#chroma-key-canvas')[0];
              this.displayCanvas.setAttribute('width', this.width * this.scale);
              this.displayCanvas.setAttribute('height', this.height * this.scale);
              this.displayContext = this.displayCanvas.getContext('2d');
  
              this.hiddenCanvas = document.createElement('canvas');
              this.hiddenCanvas.setAttribute('width', this.width);
              this.hiddenCanvas.setAttribute('height', this.height);
              this.hiddenContext = this.hiddenCanvas.getContext('2d');
            }
  
            this.hiddenContext.drawImage(this.sourceVideo[0], 0, 0, this.width, this.height);
            var frame = this.hiddenContext.getImageData(0, 0, this.width, this.height);
            var length = frame.data.length;
  
            if (this.isEnabled) {
              for (var i = 0; i < length; i++) {
                var r = frame.data [i * 4 + 0];
                var g = frame.data [i * 4 + 1];
                var b = frame.data [i * 4 + 2];

                if (r <= this.selectedR && b <= this.selectedB && g >= this.selectedG) {
                  frame.data[i * 4 + 3] = 0; 
                } 
              }
            }
            //this.displayContext.putImageData(frame, 0, 0);
            this.hiddenContext.putImageData(frame, 0, 0);
            this.displayContext.drawImage(this.hiddenCanvas, 0, 0, this.width * this.scale, this.height * this.scale);
          };
          
          return ChromaKeyPlugin;
        }
);
