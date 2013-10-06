/* global jQuery, window, document, console */

/**
 *  Stacked bar chart visualisation
 *  jQuery / Raphael plugin by Deloitte Digital
 *
 *  Initialisation example:
 *              $('#chart').Stack({
 *                   hasContainer: false,
 *                   coefficient: 0.4,
 *                   stacks: [
 *                       {
 *                           percentage: 20,
 *                           primaryColor: '#92d400',
 *                           secondaryColor: '#8fbe26',
 *                           label: 'Retireready RSA',
 *                       },
 *                       {
 *                           percentage: 30,
 *                           primaryColor: '#4b95fa',
 *                           secondaryColor: '#2e73d0',
 *                           label: 'Retireready',
 *                       }
 *                   ]
 *               });
 */




(function ($, window, document, undefined) {
    'use strict';

    // Create the defaults once
    var pluginName = 'Stack',
        defaults = {
            debug: true,    //verbose info in the console
            raphaelUrl: 'http://cdnjs.cloudflare.com/ajax/libs/raphael/2.1.0/raphael-min.js',
            events: true, // listen to incoming events
            version: '0.1',
            coefficient: 1,
            hasContainer: false
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
                throw new Error(self._name + ': Raphael is not loaded, cannot proceed');
            });

        } else {
            this.init(); // init plugin straight away
        }

    }

    // init stack library
    Stack.prototype.init = function () {
        console.log(this);
        if (this.$element.is(':visible') === false) {
            this.$element.attrchange({
                trackValues: true,
                callback: this.checkVisibility,
                context: this
            });
            return false;
        }

        console.log(this.$element);

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

        // render all stacks in this.options.stacks
        this.render();

        if (this.options.events) { this.listenToEvents(); }

    };

    Stack.prototype.render = function () {
        var stacks = this.options.stacks,
            key;

        this.totalPercentage = 0;
        this.stacks = [];

        for (key in stacks) {
            if (stacks.hasOwnProperty(key)) {
                this.drawStack(stacks[key]);
            }
        }
    };

    Stack.prototype.drawStack = function (options) {
        var i,
            stack,
            total = this.totalPercentage * this.options.coefficient;

        stack = this.stacks[this.stacks.length] = [];

        for (i = total; i <= total + options.percentage * this.options.coefficient - 1; i++) {
            this.drawEllipse(stack, options, i);
        }

        this.totalPercentage += options.percentage;

    };

    Stack.prototype.drawEllipse = function (stack, options, i) {
        var paddingX = this.posWidth / 6,
            paddingY = this.posHeight / 6,
            baseWidth = this.posWidth / 2 - paddingX,
            baseHeight = this.posWidth / 12,
            baseX = this.posWidth / 2,
            baseY = this.posHeight - baseHeight - paddingY,
            topEllipse = this.totalPercentage + options.percentage - 1,
            fillColor = options.primaryColor,
            strokeColor = options.strokeColor || options.primaryColor,
            ellipse;

        ellipse = this.paper.ellipse(
            baseX, baseY - i, baseWidth, baseHeight
        );

        console.log(i, topEllipse * this.options.coefficient);

        if (i === Math.floor(topEllipse * this.options.coefficient)) {
            fillColor = options.secondaryColor || options.primaryColor;
            strokeColor = options.strokeColor || options.secondaryColor || options.primaryColor;
        }
        ellipse.attr({stroke: strokeColor});
        ellipse.attr({fill: fillColor, 'fill-opacity': options.opacity || 1});

        stack.push(ellipse);

    };

    Stack.prototype.listenToEvents = function () {
        // sample animate event
        // trigger it like so: $('#block').trigger('stack:animate', [0, 100]);
        this.$element.on('stack:animate', function (event, start, stop) {
            console.log('got it', start, stop, event);
            console.log(this);
        });
    };

    Stack.prototype.checkVisibility = function (e, context) {
        console.log(this, context);
        if (e.attributeName === 'style') {
            if (e.newValue === 'display: inline-block;' || e.newValue === 'display: block;') {
                //TODO: unbind attrchange plugin
                // init chart
                context.init();
            } else if (e.newValue === 'display: none;') {
                // hide chart with it's parent element
                context.paper.forEach(function (el) {
                    el.hide();
                });

            } else {
                return false;
            }
        }
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