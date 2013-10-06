/* global jQuery, window, document */

'use strict';
(function ($, window, document, undefined) {


//paper, x, y, topWidth, bottomWidth, containerHeight, yRotation, hasContent, percentageContent, padding
    // Create the defaults once
    var pluginName = 'Stack',
        defaults = {
            debug: true,    //verbose info in the console
            raphaelUrl: 'http://cdnjs.cloudflare.com/ajax/libs/raphael/2.1.0/raphael-min.js',
            events: true, // listen to incoming events

            // Visualisation options
            x: 80,
            y: 80,
            width: 40,
            height: 100,
            yRotation: 40,
            percentage: 90,
            bgColor: '#ddd',
            bgShadow: '#bbb',
            fillColor: '0-#39598a-#6982a6',
            strokeColor: '0-#39598a-#6982a6',
            shadowColor: '0-#37537d-#607696'
        };

    // The actual plugin constructor
    function Stack(element, options) {
        var raphaelIsLoaded, // raphael from cdn
            self = this;

        this.element = element; //jQuery element passed in
        this.$element = $(element);
        this.options = $.extend({}, defaults, options); // extend default options with user options
        this._defaults = defaults;
        this._name = pluginName;

        if (!window.Raphael) {
            raphaelIsLoaded = $.getScript(this.options.raphaelUrl);

            raphaelIsLoaded.done(function () {
                self.init(); // init plugin when Raphael is loaded          
            });

            raphaelIsLoaded.fail(function () {
                new Error(self._name + ': Raphael is not loaded, cannot proceed');
            });

        } else {
            this.init(); // init plugin straight away
        }

    }

    Stack.prototype.init = function () {
        this.posLeft = this.$element.position().left;
        this.posTop = this.$element.position().top;
        this.posWidth = this.$element.width();
        this.posHeight = this.$element.height();

        // warn if width or height are 0
        if (this.posHeight === 0 || this.posWidth === 0) {
            this.debugMessage('Element width or height are not set', 'warn');
        }

        // Creates canvas with dimensions of the element, now we can draw!
        this.paper = window.Raphael(this.posLeft, this.posTop, this.posWidth, this.posHeight);
        //this.paper.setViewBox = (this.posLeft, this.posTop, this.posWidth, this.posHeight, true);

        this.drawBase();
        //this.drawTop();

        if (this.options.events) { this.listenToEvents(); }

    };

    Stack.prototype.getters = {
        // this.getTopCx = function() { return this.x }
        // this.getTopCy = function() { return this.y + this.posHeight - self.getPercentageContent() }
        // this.getTopRx = function() { return self.getTopContentWidth()-(self.getTopContentWidth()*self.padding) }
        // this.getTopRy = function() { return self.getTopContentRy()-(self.getTopContentRy()*self.padding*2) }
        // this.getBaseCx = function() { return self.getX() }
        // this.getBaseCy = function() { return self.getY()+self.containerHeight }
        // this.getBaseRx = function() { return self.bottomWidth-(self.bottomWidth*self.padding) }
        // this.getBaseRy = function() { return self.getBaseContentRy()-(self.getBaseContentRy()*self.padding*2) }       
    };


    Stack.prototype.drawBase = function () {
        var baseWidth = this.posWidth / 2,
            baseHeight = this.options.yRotation,
            baseX = this.posWidth / 2,
            baseY = this.posHeight - baseHeight - 20;

        window.console.log(baseWidth, baseHeight);

        this.timerStart('stack');

        for (var i = 0; i <= 100; i++) {
            this.bgElement = [];
            
            this.bgElement[i] = this.paper.ellipse(
                //self.getBaseCx(), self.getBaseCy(), self.getBaseRx(), self.getBaseRy()
                baseX, baseY - i*2, baseWidth, baseHeight
            );

            if (i < 100) {
                this.bgElement[i].attr({stroke: this.options.bgColor});
                this.bgElement[i].attr({fill: this.options.bgColor, 'fill-opacity': 1});
            } else {
                this.bgElement[i].attr({stroke: this.options.bgShadow, 'fill-opacity': 0.01});
                this.bgElement[i].attr({fill: this.options.bgColor, 'fill-opacity': 0.1});
            }
        }

        for (i = 0; i <= this.options.percentage; i++) {

            //if (i === 50) { this.options.fillColor = '#009933'; this.options.strokeColor = '#009933'}

            this.baseElement = this.paper.ellipse(
                //self.getBaseCx(), self.getBaseCy(), self.getBaseRx(), self.getBaseRy()
                baseX, baseY - i*2, baseWidth, baseHeight
            );


            if (i < this.options.percentage) {
                this.baseElement.attr({stroke: this.options.strokeColor});
                this.baseElement.attr({fill: this.options.fillColor, 'fill-opacity': 1});
            } else {
                this.baseElement.attr({stroke: this.options.shadowColor});
                this.baseElement.attr({fill: this.options.shadowColor, 'fill-opacity': 1});
            }

            this.bgElement[100].toFront();

        }

        this.timerStop('stack');
        console.log(this.elapsedTime);


    };

    Stack.prototype.drawTop = function () {
        var baseWidth = this.posWidth / 2 - 60,
            baseHeight = this.options.yRotation,
            baseX = this.posWidth / 2,
            baseY = this.posTop + baseHeight + 20;


        this.baseElement = this.paper.ellipse(
            //self.getBaseCx(), self.getBaseCy(), self.getBaseRx(), self.getBaseRy()
            baseX, baseY, baseWidth, baseHeight
            );

        this.baseElement.attr({fill: this.options.fillColor});
        this.baseElement.attr({stroke: this.options.strokeColor});

    };

    Stack.prototype.drawContainer = function () {
        this.containerElement = this.paper.path(
            this.getPathMatrixForContainer()
            ).attr({fill: this.fillColor});
    };

    Stack.prototype.listenToEvents = function () {
        // sample animate event
        // trigger it like so: $('#block').trigger('stack:animate', [0, 100]);
        this.$element.on('stack:animate', function (event, start, stop) {
            console.log('got it', start, stop, event);
        });

        this.$element.on('timer:stop', function (event, timerName) {
            var elapsed = this.stopTime[timerName].getTime() - this.startTime[timerName].getTime();

            this.debugMessage('Elapsed Time: ' + elapsed + ' ms');

        });
    };

    Stack.prototype.timerStart = function (timerName) {
        this.startTime = [];
        this.stopTime = [];

        this.startTime[timerName] = new Date();
        this.stopTime[timerName] = '';
        this.$element.trigger('timer:start', [timerName]);
    };

    Stack.prototype.timerStop = function (timerName) {
        this.stopTime = [];

        this.stopTime[timerName] = new Date();
        this.$element.trigger('timer:stop', [timerName]);
    };



    Stack.prototype.debugMessage = function (msg, type) {
        var msgType = type || 'log';

        // display debug message if the option is set
        // available types are log, warn and error
        if (this.options.debug) {
            window.console[msgType](msg, this.element);
        }
    };


    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Stack(this, options));
            }
        });
    };

})(jQuery, window, document);
